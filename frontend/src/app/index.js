import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../context/AuthContext';
import { cores, espacos } from '../theme/cores';
import logo from '../assets/logo.png';

export default function Splash() {
    const { usuario, carregando } = useAuth();
    const opacidade = useRef(new Animated.Value(0)).current;
    const escala = useRef(new Animated.Value(0.9)).current;
    const [tempoMinimo, setTempoMinimo] = useState(false);

    useEffect(() => {
        SplashScreen.hideAsync().catch(() => {});

        Animated.parallel([
            Animated.timing(opacidade, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(escala, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        ]).start();

        const relogio = setTimeout(() => setTempoMinimo(true), 1400);
        return () => clearTimeout(relogio);
    }, [opacidade, escala]);

    if (!carregando && tempoMinimo) {
        if (!usuario) return <Redirect href="/login" />;
        return <Redirect href={usuario.tipo === 'ADMIN' ? '/admin' : '/home'} />;
    }

    return (
        <View style={styles.fundo}>
            <View style={styles.bolhaGrande} />
            <View style={styles.bolhaPequena} />

            <Animated.View
                style={[styles.centro, { opacity: opacidade, transform: [{ scale: escala }] }]}
            >
                <Image source={logo} style={styles.logo} resizeMode="contain" />
                <Text style={styles.nome}>Trampo</Text>
                <Text style={styles.slogan}>Seu serviço, do seu jeito</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    fundo: {
        flex: 1,
        backgroundColor: cores.azul,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bolhaGrande: {
        position: 'absolute',
        width: 360,
        height: 360,
        borderRadius: 180,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: -140,
        right: -120,
    },
    bolhaPequena: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(255, 222, 89, 0.16)',
        bottom: -80,
        left: -70,
    },
    centro: { alignItems: 'center' },
    logo: { width: 148, height: 148 },
    nome: {
        fontSize: 42,
        fontWeight: '700',
        color: cores.branco,
        marginTop: espacos.lg,
        letterSpacing: 0.5,
    },
    slogan: { fontSize: 15, color: cores.amarelo, marginTop: espacos.sm },
});