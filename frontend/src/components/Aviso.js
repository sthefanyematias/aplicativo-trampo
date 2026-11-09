import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icone from './Icone';
import { cores, espacos, raios } from '../theme/cores';

const APARENCIAS = {
    erro: {
        fundo: '#FEF3F2',
        borda: '#F3C6C2',
        icone: 'alert-circle',
        cor: cores.erro,
        titulo: 'Não foi possível continuar',
    },
    sucesso: {
        fundo: '#F1F9F4',
        borda: '#C4E4D1',
        icone: 'checkmark-circle',
        cor: cores.sucesso,
        titulo: 'Tudo certo',
    },
    info: {
        fundo: '#F0F3FF',
        borda: '#D3DCFF',
        icone: 'information-circle',
        cor: cores.azul,
        titulo: 'Atenção',
    },
};

export default function Aviso({
    visivel,
    mensagem,
    tipo = 'erro',
    titulo,
    aoFechar,
    duracao = 4500,
}) {
    const opacidade = useRef(new Animated.Value(0)).current;
    const deslocamento = useRef(new Animated.Value(-24)).current;
    const fechando = useRef(false);
    const bordas = useSafeAreaInsets();

    useEffect(() => {
        if (!visivel) return;

        fechando.current = false;
        opacidade.setValue(0);
        deslocamento.setValue(-24);

        Animated.parallel([
            Animated.timing(opacidade, { toValue: 1, duration: 220, useNativeDriver: true }),
            Animated.timing(deslocamento, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start();

        const relogio = setTimeout(() => {
            esconder();
        }, duracao);

        return () => clearTimeout(relogio);
    }, [visivel, mensagem, duracao]);

    function esconder() {
        if (fechando.current) return;
        fechando.current = true;

        Animated.parallel([
            Animated.timing(opacidade, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(deslocamento, { toValue: -24, duration: 180, useNativeDriver: true }),
        ]).start(() => {
            if (aoFechar) aoFechar();
        });
    }

    if (!visivel) return null;

    const aparencia = APARENCIAS[tipo] || APARENCIAS.erro;

    return (
        <View pointerEvents="box-none" style={[styles.camada, { top: bordas.top + espacos.sm }]}>
            <Animated.View
                style={[
                    styles.cartao,
                    {
                        backgroundColor: aparencia.fundo,
                        borderColor: aparencia.borda,
                        opacity: opacidade,
                        transform: [{ translateY: deslocamento }],
                    },
                ]}
            >
                <Icone nome={aparencia.icone} tamanho={22} cor={aparencia.cor} />

                <View style={styles.textos}>
                    <Text style={[styles.titulo, { color: aparencia.cor }]}>
                        {titulo || aparencia.titulo}
                    </Text>
                    <Text style={styles.mensagem}>{mensagem}</Text>
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Fechar aviso"
                    onPress={esconder}
                    hitSlop={10}
                    style={styles.fechar}
                >
                    <Icone nome="close" tamanho={18} cor={cores.cinzaTexto} />
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    camada: {
        position: 'absolute',
        left: espacos.lg,
        right: espacos.lg,
        zIndex: 99,
    },
    cartao: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: espacos.md,
        padding: espacos.lg,
        borderRadius: raios.medio,
        borderWidth: 1,
    },
    textos: {
        flex: 1,
        gap: 2,
    },
    titulo: {
        fontSize: 13,
        fontWeight: '700',
    },
    mensagem: {
        fontSize: 13,
        color: cores.grafite,
        lineHeight: 19,
    },
    fechar: {
        padding: 2,
    },
});