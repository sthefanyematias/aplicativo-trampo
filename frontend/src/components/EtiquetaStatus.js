
import { StyleSheet, Text, View } from 'react-native';
import { cores, raios } from '../theme/cores';

const NOMES = {
    ABERTO: 'Aberto',
    EM_ANDAMENTO: 'Em andamento',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
    PENDENTE: 'Pendente',
    ACEITA: 'Aceita',
    RECUSADA: 'Recusada',
};

const CORES = {
    ABERTO: { fundo: cores.sucessoClaro, texto: cores.sucesso },
    EM_ANDAMENTO: { fundo: cores.alertaClaro, texto: cores.alerta },
    CONCLUIDO: { fundo: cores.sucessoClaro, texto: cores.sucesso },
    CANCELADO: { fundo: cores.cinza, texto: cores.cinzaTexto },
    PENDENTE: { fundo: cores.alertaClaro, texto: cores.alerta },
    ACEITA: { fundo: cores.sucessoClaro, texto: cores.sucesso },
    RECUSADA: { fundo: cores.erroClaro, texto: cores.erro },
};

export default function EtiquetaStatus({ status }) {
    const cor = CORES[status] || { fundo: cores.cinza, texto: cores.cinzaTexto };

    return (
        <View
            accessibilityLabel={'Situação: ' + (NOMES[status] || status)}
            style={[styles.etiqueta, { backgroundColor: cor.fundo }]}
        >
            <View style={[styles.bolinha, { backgroundColor: cor.texto }]} />
            <Text style={[styles.texto, { color: cor.texto }]}>{NOMES[status] || status}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    etiqueta: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: raios.pilula,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    bolinha: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    texto: {
        fontSize: 12,
        fontWeight: '700',
    },
});
