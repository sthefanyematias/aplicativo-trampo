import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DIAS_SEMANA } from '../data/profissoes';
import Icone from './Icone';
import { cores, raios } from '../theme/cores';

export default function SeletorDias({ label, selecionados, onChange, error }) {
    function alternar(valor) {
        if (selecionados.includes(valor)) {
            onChange(selecionados.filter((dia) => dia !== valor));
            return;
        }

        onChange([...selecionados, valor]);
    }

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <View style={styles.grade}>
                {DIAS_SEMANA.map((dia) => {
                    const ativo = selecionados.includes(dia.valor);

                    return (
                        <Pressable
                            key={dia.valor}
                            accessibilityRole="checkbox"
                            accessibilityLabel={dia.rotulo}
                            accessibilityState={{ checked: ativo }}
                            onPress={() => alternar(dia.valor)}
                            style={({ pressed }) => [
                                styles.dia,
                                ativo ? styles.diaAtivo : null,
                                pressed ? styles.diaPressionado : null,
                            ]}
                        >
                            {ativo ? (
                                <Icone nome="checkmark" tamanho={13} cor={cores.branco} />
                            ) : null}
                            <Text style={[styles.texto, ativo ? styles.textoAtivo : null]}>
                                {dia.rotulo}
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
    grade: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 8,
    },
    dia: {
        width: '23.5%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 12,
        borderRadius: raios.pequeno,
        borderWidth: 1,
        borderColor: cores.borda,
        backgroundColor: cores.branco,
    },
    diaAtivo: {
        backgroundColor: cores.azul,
        borderColor: cores.azul,
    },
    diaPressionado: {
        opacity: 0.8,
    },
    texto: {
        fontSize: 13,
        fontWeight: '600',
        color: cores.cinzaTexto,
    },
    textoAtivo: {
        color: cores.branco,
    },
    erro: {
        color: cores.erro,
        fontSize: 12,
        marginTop: 6,
    },
});