import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { cores } from '../theme/cores';

const TAMANHO_BOLINHA = 28;

export default function ControleDeslizante({
    label,
    valor,
    min = 1,
    max = 50,
    passo = 1,
    onChange,
    sufixo = 'km',
}) {
    const [largura, setLargura] = useState(0);
    const larguraRef = useRef(0);

    function calcular(novaLargura, posicaoX) {
        const util = novaLargura - TAMANHO_BOLINHA;

        if (util <= 0) return min;

        const fracao = Math.min(1, Math.max(0, (posicaoX - TAMANHO_BOLINHA / 2) / util));
        const bruto = min + fracao * (max - min);
        const arredondado = Math.round(bruto / passo) * passo;

        return Math.min(max, Math.max(min, arredondado));
    }

    const responder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evento, gesto) =>
                Math.abs(gesto.dx) > Math.abs(gesto.dy),
            onPanResponderTerminationRequest: () => false,
            onPanResponderGrant: (evento) => {
                onChange(calcular(larguraRef.current, evento.nativeEvent.locationX));
            },
            onPanResponderMove: (evento) => {
                onChange(calcular(larguraRef.current, evento.nativeEvent.locationX));
            },
        })
    ).current;

    const util = Math.max(1, largura - TAMANHO_BOLINHA);
    const percentual = Math.min(1, Math.max(0, (valor - min) / (max - min)));
    const posicao = percentual * util;

    function aoMedir(evento) {
        const novaLargura = evento.nativeEvent.layout.width;
        larguraRef.current = novaLargura;
        setLargura(novaLargura);
    }

    return (
        <View style={styles.container}>
            <View style={styles.topo}>
                {label ? <Text style={styles.label}>{label}</Text> : null}
                <Text style={styles.valor}>
                    {valor} {sufixo}
                </Text>
            </View>

            <View style={styles.area} onLayout={aoMedir} {...responder.panHandlers}>
                <View style={styles.trilha} />
                <View style={[styles.preenchimento, { width: posicao + TAMANHO_BOLINHA / 2 }]} />
                <View style={[styles.bolinha, { left: posicao }]} />
            </View>

            <View style={styles.escala}>
                <Text style={styles.escalaTexto}>
                    {min} {sufixo}
                </Text>
                <Text style={styles.escalaTexto}>
                    {max} {sufixo}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 18,
        width: '100%',
    },
    topo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    label: {
        fontSize: 14,
        color: cores.grafite,
        fontWeight: '600',
    },
    valor: {
        fontSize: 14,
        fontWeight: '800',
        color: cores.azul,
    },
    area: {
        height: 44,
        justifyContent: 'center',
    },
    trilha: {
        height: 6,
        borderRadius: 3,
        backgroundColor: cores.borda,
        width: '100%',
    },
    preenchimento: {
        position: 'absolute',
        height: 6,
        borderRadius: 3,
        backgroundColor: cores.azul,
    },
    bolinha: {
        position: 'absolute',
        width: TAMANHO_BOLINHA,
        height: TAMANHO_BOLINHA,
        borderRadius: TAMANHO_BOLINHA / 2,
        backgroundColor: cores.branco,
        borderWidth: 3,
        borderColor: cores.azul,
    },
    escala: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    escalaTexto: {
        fontSize: 11,
        color: cores.cinzaTexto,
    },
});