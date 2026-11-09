import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Icone from './Icone';
import { cores, espacos, raios, vidro } from '../theme/cores';

export default function Cabecalho({ titulo, subtitulo, mostrarVoltar = true, acao }) {
    const router = useRouter();

    return (
        <View style={styles.linha}>
            {mostrarVoltar ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Voltar"
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.voltar, pressed ? styles.voltarPressionado : null]}
                >
                    <Icone nome="chevron-back" tamanho={22} cor={cores.azul} />
                </Pressable>
            ) : null}

            <View style={styles.textos}>
                <Text style={styles.titulo}>{titulo}</Text>
                {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
            </View>

            {acao ? <View style={styles.acao}>{acao}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    linha: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.md,
        marginBottom: espacos.lg,
    },
    voltar: {
        width: 42,
        height: 42,
        borderRadius: raios.pilula,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: vidro.claro,
        borderWidth: 1,
        borderColor: vidro.bordaClara,
    },
    voltarPressionado: {
        opacity: 0.7,
        transform: [{ scale: 0.94 }],
    },
    textos: {
        flex: 1,
    },
    titulo: {
        fontSize: 22,
        fontWeight: '700',
        color: cores.preto,
        letterSpacing: -0.3,
    },
    subtitulo: {
        fontSize: 13,
        color: cores.cinzaTexto,
        marginTop: 2,
    },
    acao: {
        alignItems: 'flex-end',
    },
});