import { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import { cores, espacos, raios } from '../theme/cores';
import logo from '../assets/logo.png';

function emailValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor ?? '').trim());
}

export default function Login() {
    const router = useRouter();
    const { usuario, entrar, sessaoExpirada } = useAuth();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [erros, setErros] = useState({});
    const [carregando, setCarregando] = useState(false);

    if (usuario) {
        return <Redirect href={usuario.tipo === 'ADMIN' ? '/admin' : '/home'} />;
    }

    function validar() {
        const novos = {};

        if (!emailValido(email)) novos.email = 'Informe um e-mail válido.';
        if (!senha) novos.senha = 'Informe a senha.';

        setErros(novos);
        return Object.keys(novos).length === 0;
    }

    async function aoEntrar() {
        setErro('');

        if (!validar()) {
            setErro('Revise os campos destacados.');
            return;
        }

        setCarregando(true);

        try {
            const dados = await login(email, senha);
            await entrar(dados);
        } catch (e) {
            setErro(e.message);
        } finally {
            setCarregando(false);
        }
    }

    return (
        <Tela cor={cores.branco}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.conteudo}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.marca}>
                        <Image source={logo} style={styles.logo} resizeMode="contain" />
                        <Text style={styles.titulo}>Bem-vindo ao Trampo</Text>
                        <Text style={styles.subtitulo}>Entre para continuar de onde parou</Text>
                    </View>

                    {sessaoExpirada ? (
                        <Vidro style={styles.aviso}>
                            <Text style={styles.avisoTexto}>
                                Sua sessão expirou. Entre novamente.
                            </Text>
                        </Vidro>
                    ) : null}

                    <Vidro style={styles.formulario}>
                        <CampoTexto
                            label="E-mail"
                            valor={email}
                            onChange={(valor) => {
                                setEmail(valor);
                                setErros((atual) => ({ ...atual, email: undefined }));
                            }}
                            placeholder="seu@email.com"
                            keyboard="email-address"
                            autoComplete="email"
                            error={erros.email}
                        />

                        <CampoTexto
                            label="Senha"
                            valor={senha}
                            onChange={(valor) => {
                                setSenha(valor);
                                setErros((atual) => ({ ...atual, senha: undefined }));
                            }}
                            placeholder="Sua senha"
                            secure
                            autoComplete="password"
                            maxLength={60}
                            error={erros.senha}
                        />

                        <Botao titulo="Entrar" onPress={aoEntrar} carregando={carregando} />
                    </Vidro>

                    <Pressable
                        onPress={() => router.push('/cadastro')}
                        disabled={carregando}
                        style={styles.linkArea}
                    >
                        <Text style={styles.link}>Criar uma conta</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>

            <Aviso
                visivel={Boolean(erro)}
                mensagem={erro}
                tipo="erro"
                aoFechar={() => setErro('')}
            />
        </Tela>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    conteudo: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: espacos.xl,
        paddingBottom: espacos.xxl,
    },
    marca: { alignItems: 'center', marginBottom: espacos.xl },
    logo: { width: 118, height: 118, marginBottom: espacos.md },
    titulo: {
        fontSize: 24,
        fontWeight: '700',
        color: cores.preto,
        textAlign: 'center',
        letterSpacing: -0.4,
    },
    subtitulo: {
        fontSize: 14,
        color: cores.cinzaTexto,
        marginTop: espacos.xs,
        textAlign: 'center',
    },
    aviso: {
        backgroundColor: cores.alertaClaro,
        borderColor: cores.alerta,
        marginBottom: espacos.md,
    },
    avisoTexto: { color: cores.alerta, fontSize: 13, textAlign: 'center' },
    formulario: { padding: espacos.lg },
    linkArea: {
        marginTop: espacos.xl,
        alignSelf: 'center',
        paddingVertical: espacos.sm,
        paddingHorizontal: espacos.md,
        borderRadius: raios.pilula,
    },
    link: { color: cores.azul, fontWeight: '600', fontSize: 14 },
});