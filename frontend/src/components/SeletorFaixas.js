import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FAIXAS_HORARIO } from '../data/profissoes';
import Icone from './Icone';
import { cores, raios } from '../theme/cores';

export default function SeletorFaixas({ label, selecionadas, onChange, error }) {
    function alternar(valor) {
        if (selecionadas.includes(valor)) {
            onChange(selecionadas.filter((faixa) => faixa !== valor));
            return;
        }

        onChange([...selecionadas, valor]);
    }

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <View style={styles.lista}>
                {FAIXAS_HORARIO.map((faixa) => {
                    const ativa = selecionadas.includes(faixa.valor);

                    return (
                        <Pressable
                            key={faixa.valor}
                            accessibilityRole="checkbox"
                            accessibilityLabel={faixa.rotulo}
                            accessibilityState={{ checked: ativa }}
                            onPress={() => alternar(faixa.valor)}
                            style={({ pressed }) => [
                                styles.opcao,
                                ativa ? styles.opcaoAtiva : null,
                                pressed ? styles.opcaoPressionada : null,
                            ]}
                        >
                            <View style={[styles.caixa, ativa ? styles.caixaAtiva : null]}>
                                {ativa ? (
                                    <Icone nome="checkmark" tamanho={13} cor={cores.branco} />
                                ) : null}
                            </View>

                            <Text style={[styles.texto, ativa ? styles.textoAtivo : null]}>
                                {faixa.rotulo}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {error ? <Text style={styles.erro}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 14,
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: cores.grafite,
        marginBottom: 8,
        fontWeight: '600',
    },
    lista: {
        gap: 8,
    },
    opcao: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: raios.pequeno,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: cores.branco,
    },
    opcaoAtiva: {
        borderColor: cores.azul,
        backgroundColor: cores.azulClaro,
    },
    opcaoPressionada: {
        opacity: 0.85,
    },
    caixa: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: cores.borda,
        alignItems: 'center',
        justifyContent: 'center',
    },
    caixaAtiva: {
        backgroundColor: cores.azul,
        borderColor: cores.azul,
    },
    texto: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: cores.grafite,
    },
    textoAtivo: {
        color: cores.azul,
        fontWeight: '600',
    },
    erro: {
        color: cores.erro,
        fontSize: 12,
        marginTop: 6,
    },
});