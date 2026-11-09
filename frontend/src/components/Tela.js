import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cores, espacos } from '../theme/cores';

export default function Tela({
    children,
    cor = cores.cinza,
    semBolinhas = false,
    topoExtra = espacos.md,
}) {
    const bordas = useSafeAreaInsets();
    const topo = Math.max(bordas.top, 24) + topoExtra;

    return (
        <View style={[styles.fundo, { backgroundColor: cor, paddingTop: topo }]}>
            {semBolinhas ? null : (
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    <View style={[styles.bolinha, styles.bolinhaAzul]} />
                    <View style={[styles.bolinha, styles.bolinhaAmarela]} />
                </View>
            )}

            <View style={styles.conteudo}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    fundo: {
        flex: 1,
    },
    conteudo: {
        flex: 1,
    },
    bolinha: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
    },
    bolinhaAzul: {
        backgroundColor: 'rgba(81, 112, 255, 0.10)',
        top: -120,
        right: -100,
    },
    bolinhaAmarela: {
        backgroundColor: 'rgba(255, 222, 89, 0.16)',
        bottom: -130,
        left: -90,
    },
});