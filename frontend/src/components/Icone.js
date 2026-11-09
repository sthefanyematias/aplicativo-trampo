import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';
import { cores } from '../theme/cores';

export default function Icone({ nome, tamanho = 18, cor = cores.preto, estilo }) {
    const existe = Boolean(Ionicons.glyphMap && Ionicons.glyphMap[nome]);

    if (!existe) {
        return (
            <Text style={[styles.emoji, { fontSize: tamanho, color: cor }, estilo]}>
                {nome}
            </Text>
        );
    }

    return <Ionicons name={nome} size={tamanho} color={cor} style={estilo} />;
}

const styles = StyleSheet.create({
    emoji: {
        textAlign: 'center',
    },
});