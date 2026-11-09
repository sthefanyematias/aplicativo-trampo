import { StyleSheet, View } from 'react-native';
import { raios, vidro } from '../theme/cores';

export default function Vidro({ children, style, escuro = false, semBorda = false }) {
    return (
        <View
            style={[
                styles.base,
                escuro ? styles.escuro : styles.claro,
                semBorda ? styles.semBorda : null,
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: raios.medio,
        borderWidth: 1,
        padding: 16,
        gap: 8,
        elevation: 0,
    },
    claro: {
        backgroundColor: vidro.claro,
        borderColor: vidro.bordaClara,
    },
    escuro: {
        backgroundColor: vidro.escuro,
        borderColor: vidro.bordaEscura,
    },
    semBorda: {
        borderWidth: 0,
    },
});