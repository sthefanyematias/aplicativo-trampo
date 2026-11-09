import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Icone from './Icone';
import { cores, raios } from '../theme/cores';

const ESTILOS = {
    azul: { fundo: cores.azul, texto: cores.branco, borda: cores.azul },
    amarelo: { fundo: cores.amarelo, texto: cores.preto, borda: cores.amareloEscuro },
    perigo: { fundo: cores.erro, texto: cores.branco, borda: cores.erro },
    sucesso: { fundo: cores.sucesso, texto: cores.branco, borda: cores.sucesso },
    claro: { fundo: cores.branco, texto: cores.azul, borda: cores.azul },
};

export default function Botao({
    titulo,
    onPress,
    carregando = false,
    variante = 'azul',
    desabilitado = false,
    compacto = false,
    icone,
    acessibilidade,
}) {
    const escala = useRef(new Animated.Value(1)).current;
    const estilo = ESTILOS[variante] || ESTILOS.azul;
    const bloqueado = carregando || desabilitado;

    function animar(valor) {
        Animated.spring(escala, {
            toValue: valor,
            useNativeDriver: true,
            friction: 6,
            tension: 140,
        }).start();
    }

    return (
        <Animated.View
            style={[
                styles.caixa,
                compacto ? styles.caixaCompacta : null,
                { transform: [{ scale: escala }] },
            ]}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={acessibilidade || titulo}
                accessibilityState={{ disabled: bloqueado, busy: carregando }}
                onPress={onPress}
                onPressIn={() => animar(0.96)}
                onPressOut={() => animar(1)}
                disabled={bloqueado}
                style={[
                    styles.botao,
                    compacto ? styles.compacto : null,
                    {
                        backgroundColor: estilo.fundo,
                        borderColor: estilo.borda,
                    },
                    bloqueado ? styles.desabilitado : null,
                ]}
            >
                {carregando ? (
                    <ActivityIndicator color={estilo.texto} />
                ) : (
                    <View style={styles.conteudo}>
                        {icone ? (
                            <Icone nome={icone} tamanho={compacto ? 16 : 18} cor={estilo.texto} />
                        ) : null}

                        <Text
                            style={[
                                styles.texto,
                                compacto ? styles.textoCompacto : null,
                                { color: estilo.texto },
                            ]}
                        >
                            {titulo}
                        </Text>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    caixa: {
        width: '100%',
    },
    caixaCompacta: {
        width: 'auto',
        alignSelf: 'flex-start',
    },
    botao: {
        height: 52,
        borderRadius: raios.medio,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        borderWidth: 1,
    },
    compacto: {
        height: 42,
    },
    conteudo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    desabilitado: {
        opacity: 0.5,
    },
    texto: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    textoCompacto: {
        fontSize: 14,
    },
});