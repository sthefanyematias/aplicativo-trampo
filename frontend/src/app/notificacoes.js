import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import Botao from '../components/Botao';
import Cabecalho from '../components/Cabecalho';
import Icone from '../components/Icone';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import {
    listarNotificacoes,
    marcarNotificacaoLida,
    marcarTodasNotificacoesLidas,
} from '../services/api';
import { cores, espacos, raios } from '../theme/cores';
import { formatarData, formatarHora } from '../utils/formato';

const APARENCIA = {
    AVALIACAO: { icone: 'star', cor: cores.amareloEscuro, fundo: 'rgba(255, 222, 89, 0.35)' },
    SERVICO: { icone: 'checkmark-circle', cor: cores.sucesso, fundo: cores.sucessoClaro },
    SUPORTE: { icone: 'headset', cor: cores.azul, fundo: cores.azulClaro },
    INFO: { icone: 'notifications', cor: cores.azul, fundo: cores.azulClaro },
};

export default function TelaNotificacoes() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const [notificacoes, setNotificacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (usuario) {
            carregar();
        } else {
            setCarregando(false);
        }
    }, [usuario]);

    async function carregar() {
        try {
            const dados = await listarNotificacoes();
            setNotificacoes(dados ?? []);
            setErro('');
        } catch (e) {
            setNotificacoes([]);
            setErro(e.message);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }

    async function abrir(item) {
        if (!item.lida) {
            try {
                await marcarNotificacaoLida(item.id);
                setNotificacoes((anterior) =>
                    anterior.map((n) => (n.id === item.id ? { ...n, lida: true } : n))
                );
            } catch {
            }
        }

        if (item.servicoId) {
            router.push('/servico?id=' + item.servicoId);
        }
    }

    async function lerTodas() {
        try {
            await marcarTodasNotificacoesLidas();
            setNotificacoes((anterior) => anterior.map((n) => ({ ...n, lida: true })));
        } catch (e) {
            setErro(e.message);
        }
    }

    if (carregandoSessao) {
        return (
            <Tela>
                <View style={styles.centro}>
                    <ActivityIndicator color={cores.azul} size="large" />
                </View>
            </Tela>
        );
    }

    if (!usuario) return <Redirect href="/login" />;

    const naoLidas = notificacoes.filter((item) => !item.lida).length;

    return (
        <Tela>
            <FlatList
                contentContainerStyle={styles.conteudo}
                data={notificacoes}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={atualizando}
                        onRefresh={() => {
                            setAtualizando(true);
                            carregar();
                        }}
                        tintColor={cores.azul}
                        colors={[cores.azul]}
                    />
                }
                ListHeaderComponent={
                    <View>
                        <Cabecalho
                            titulo="Notificações"
                            subtitulo={
                                naoLidas > 0
                                    ? naoLidas +
                                      (naoLidas === 1 ? ' não lida' : ' não lidas')
                                    : 'Tudo em dia por aqui'
                            }
                        />

                        {naoLidas > 0 ? (
                            <Pressable
                                accessibilityRole="button"
                                onPress={lerTodas}
                                style={({ pressed }) => [
                                    styles.lerTodas,
                                    pressed ? styles.lerTodasPressionado : null,
                                ]}
                            >
                                <Icone
                                    nome="checkmark-done-outline"
                                    tamanho={15}
                                    cor={cores.azul}
                                />
                                <Text style={styles.lerTodasTexto}>Marcar todas como lidas</Text>
                            </Pressable>
                        ) : null}
                    </View>
                }
                ListFooterComponent={
                    <View style={styles.rodape}>
                        <Botao
                            titulo="Voltar para o início"
                            variante="claro"
                            onPress={() => router.replace('/home')}
                        />
                    </View>
                }
                ListEmptyComponent={
                    carregando ? (
                        <View style={styles.centroLista}>
                            <ActivityIndicator color={cores.azul} />
                        </View>
                    ) : (
                        <Vidro style={styles.vazio}>
                            <View style={styles.vazioCirculo}>
                                <Icone
                                    nome="notifications-off-outline"
                                    tamanho={26}
                                    cor={cores.cinzaTexto}
                                />
                            </View>
                            <Text style={styles.textoVazio}>
                                Nenhuma notificação por enquanto. Avisos de avaliações e serviços
                                aparecem aqui.
                            </Text>
                        </Vidro>
                    )
                }
                renderItem={({ item }) => {
                    const aparencia = APARENCIA[item.tipo] || APARENCIA.INFO;

                    return (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={item.titulo}
                            onPress={() => abrir(item)}
                            style={({ pressed }) => (pressed ? styles.pressionado : null)}
                        >
                            <Vidro
                                style={[
                                    styles.cartao,
                                    !item.lida ? styles.cartaoNaoLida : null,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.icone,
                                        { backgroundColor: aparencia.fundo },
                                    ]}
                                >
                                    <Icone
                                        nome={aparencia.icone}
                                        tamanho={18}
                                        cor={aparencia.cor}
                                    />
                                </View>

                                <View style={styles.areaTexto}>
                                    <View style={styles.linhaTopo}>
                                        <Text
                                            style={[
                                                styles.titulo,
                                                !item.lida ? styles.tituloNaoLida : null,
                                            ]}
                                            numberOfLines={2}
                                        >
                                            {item.titulo}
                                        </Text>

                                        {!item.lida ? <View style={styles.ponto} /> : null}
                                    </View>

                                    <Text style={styles.mensagem}>{item.mensagem}</Text>

                                    <Text style={styles.data}>
                                        {formatarData(item.criadoEm)}
                                        {item.criadoEm ? ' · ' + formatarHora(item.criadoEm) : ''}
                                    </Text>

                                    {item.servicoId ? (
                                        <View style={styles.linhaAbrir}>
                                            <Text style={styles.abrirTexto}>
                                                Ver serviço
                                            </Text>
                                            <Icone
                                                nome="chevron-forward"
                                                tamanho={13}
                                                cor={cores.azul}
                                            />
                                        </View>
                                    ) : null}
                                </View>
                            </Vidro>
                        </Pressable>
                    );
                }}
            />

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
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    centroLista: { paddingVertical: espacos.xxl, alignItems: 'center' },
    conteudo: { padding: espacos.lg, paddingBottom: espacos.md },
    lerTodas: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: cores.azulClaro,
        borderRadius: raios.pilula,
        paddingHorizontal: espacos.md,
        paddingVertical: espacos.sm,
        marginBottom: espacos.md,
    },
    lerTodasPressionado: { opacity: 0.7 },
    lerTodasTexto: { fontSize: 12, fontWeight: '700', color: cores.azul },
    cartao: {
        flexDirection: 'row',
        gap: espacos.md,
        padding: espacos.md,
        marginBottom: espacos.sm,
    },
    cartaoNaoLida: {
        borderColor: cores.azul,
        backgroundColor: cores.azulClaro,
    },
    icone: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    areaTexto: { flex: 1, gap: 3 },
    linhaTopo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: espacos.sm,
    },
    titulo: { flex: 1, fontSize: 14, fontWeight: '600', color: cores.preto },
    tituloNaoLida: { fontWeight: '700' },
    ponto: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: cores.azul,
        marginTop: 4,
    },
    mensagem: { fontSize: 12, color: cores.cinzaTexto, lineHeight: 18 },
    data: { fontSize: 10, color: cores.cinzaTexto },
    linhaAbrir: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
    abrirTexto: { fontSize: 11, fontWeight: '700', color: cores.azul },
    pressionado: { opacity: 0.85 },
    vazio: {
        alignItems: 'center',
        gap: espacos.md,
        paddingVertical: espacos.xl,
        paddingHorizontal: espacos.lg,
    },
    vazioCirculo: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: cores.cinza,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textoVazio: { fontSize: 13, color: cores.cinzaTexto, textAlign: 'center', lineHeight: 19 },
    rodape: { marginTop: espacos.md },
});
