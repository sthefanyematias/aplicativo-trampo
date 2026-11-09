
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import BarraInferior from '../components/BarraInferior';
import Botao from '../components/Botao';
import Cabecalho from '../components/Cabecalho';
import EtiquetaStatus from '../components/EtiquetaStatus';
import Icone from '../components/Icone';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import { listarConversas } from '../services/api';
import { cores, espacos } from '../theme/cores';

function formatarQuando(texto) {
    if (!texto) return '';

    const partes = String(texto).split('T');
    const data = partes[0].split('-');

    if (data.length !== 3) return '';

    const hora = partes[1] ? partes[1].substring(0, 5) : '';

    return data[2] + '/' + data[1] + ' · ' + hora;
}

export default function TelaConversas() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const [conversas, setConversas] = useState([]);
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
        setErro('');

        try {
            const dados = await listarConversas();
            setConversas(dados ?? []);
        } catch (e) {
            setConversas([]);
            setErro(e.message);
        } finally {
            setCarregando(false);
            setAtualizando(false);
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

    const totalNaoLidas = conversas.reduce(
        (soma, conversa) => soma + Number(conversa.naoLidas || 0),
        0
    );

    return (
        <Tela>
            <FlatList
                contentContainerStyle={styles.conteudo}
                data={conversas}
                keyExtractor={(item) => String(item.servicoId)}
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
                            titulo="Conversas"
                            subtitulo={
                                totalNaoLidas > 0
                                    ? totalNaoLidas +
                                      (totalNaoLidas === 1
                                          ? ' mensagem não lida'
                                          : ' mensagens não lidas')
                                    : 'Seus atendimentos em um só lugar'
                            }
                            mostrarVoltar={false}
                        />
                    </View>
                }
                ListFooterComponent={<View style={styles.rodape} />}
                ListEmptyComponent={
                    carregando ? (
                        <Vidro style={styles.vazio}>
                            <ActivityIndicator color={cores.azul} />
                            <Text style={styles.textoVazio}>Carregando conversas...</Text>
                        </Vidro>
                    ) : (
                        <Vidro style={styles.vazio}>
                            <View style={styles.vazioCirculo}>
                                <Icone
                                    nome="chatbubbles-outline"
                                    tamanho={26}
                                    cor={cores.cinzaTexto}
                                />
                            </View>
                            <Text style={styles.vazioTitulo}>Nenhuma conversa ainda</Text>
                            <Text style={styles.textoVazio}>
                                As conversas aparecem aqui quando um serviço entra em andamento.
                            </Text>
                            <View style={styles.vazioAcao}>
                                <Botao
                                    titulo="Atualizar"
                                    icone="refresh-outline"
                                    variante="claro"
                                    compacto
                                    onPress={carregar}
                                />
                            </View>
                        </Vidro>
                    )
                }
                renderItem={({ item }) => {
                    const naoLidas = Number(item.naoLidas || 0);
                    const temAviso = naoLidas > 0;
                    const encerrada =
                        item.status === 'CONCLUIDO' || item.status === 'CANCELADO';

                    return (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityLabel={
                                'Conversa com ' +
                                item.outroNome +
                                (temAviso ? ', ' + naoLidas + ' não lidas' : '')
                            }
                            style={styles.toque}
                            onPress={() => router.push('/conversa?id=' + item.servicoId)}
                        >
                            <Vidro
                                style={[
                                    styles.cartao,
                                    temAviso ? styles.cartaoAviso : null,
                                    encerrada ? styles.cartaoEncerrado : null,
                                ]}
                            >
                                <View style={[styles.avatar, temAviso ? styles.avatarAviso : null]}>
                                    <Text style={styles.avatarLetra}>
                                        {String(item.outroNome || 'C').charAt(0).toUpperCase()}
                                    </Text>

                                    {encerrada ? (
                                        <View style={styles.cadeado}>
                                            <Icone
                                                nome="lock-closed"
                                                tamanho={9}
                                                cor={cores.cinzaTexto}
                                            />
                                        </View>
                                    ) : temAviso ? (
                                        <View style={styles.ponto} />
                                    ) : null}
                                </View>

                                <View style={styles.areaTexto}>
                                    <View style={styles.linhaTopo}>
                                        <Text
                                            style={[styles.nome, temAviso ? styles.nomeAviso : null]}
                                            numberOfLines={1}
                                        >
                                            {item.outroNome}
                                        </Text>
                                        <Text style={styles.data}>
                                            {formatarQuando(item.dataUltima)}
                                        </Text>
                                    </View>

                                    <View style={styles.linhaServico}>
                                        <Text style={styles.servico} numberOfLines={1}>
                                            {item.titulo}
                                        </Text>
                                        <EtiquetaStatus status={item.status} />
                                    </View>

                                    {encerrada ? (
                                        <View style={styles.linhaEncerrada}>
                                            <Icone
                                                nome="lock-closed-outline"
                                                tamanho={11}
                                                cor={cores.cinzaTexto}
                                            />
                                            <Text style={styles.textoEncerrado} numberOfLines={1}>
                                                Conversa encerrada · serviço finalizado
                                            </Text>
                                        </View>
                                    ) : (
                                        <Text
                                            style={[
                                                styles.previa,
                                                temAviso ? styles.previaAviso : null,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {item.ultimaMensagem}
                                        </Text>
                                    )}
                                </View>

                                {temAviso && !encerrada ? (
                                    <View style={styles.selo}>
                                        <Text style={styles.seloTexto}>
                                            {naoLidas > 9 ? '9+' : naoLidas}
                                        </Text>
                                    </View>
                                ) : (
                                    <Icone
                                        nome="chevron-forward"
                                        tamanho={16}
                                        cor={cores.cinzaTexto}
                                    />
                                )}
                            </Vidro>
                        </TouchableOpacity>
                    );
                }}
            />

            <BarraInferior abaAtiva="conversas" tipo={usuario.tipo} />

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
    conteudo: { padding: espacos.lg, paddingBottom: espacos.sm },
    toque: { marginBottom: espacos.md },
    cartao: { flexDirection: 'row', alignItems: 'center', gap: espacos.md, padding: espacos.lg },
    cartaoAviso: { borderColor: cores.azul, backgroundColor: cores.azulClaro },
    cartaoEncerrado: { backgroundColor: '#f4f4f7', borderColor: cores.borda, opacity: 0.92 },
    cadeado: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: cores.branco,
        borderWidth: 1,
        borderColor: cores.borda,
        alignItems: 'center',
        justifyContent: 'center',
    },
    linhaEncerrada: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    textoEncerrado: { fontSize: 12, color: cores.cinzaTexto, fontStyle: 'italic' },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: cores.azulClaro,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarAviso: { backgroundColor: cores.azul },
    avatarLetra: { color: cores.azul, fontSize: 17, fontWeight: '700' },
    ponto: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: cores.erro,
        borderWidth: 2,
        borderColor: cores.branco,
    },
    areaTexto: { flex: 1, gap: 3 },
    linhaTopo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
    },
    linhaServico: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nome: { flex: 1, fontSize: 15, fontWeight: '600', color: cores.preto },
    nomeAviso: { fontWeight: '700' },
    data: { fontSize: 11, color: cores.cinzaTexto },
    servico: { flex: 1, fontSize: 12, color: cores.azul, fontWeight: '600' },
    previa: { fontSize: 13, color: cores.cinzaTexto },
    previaAviso: { color: cores.grafite, fontWeight: '600' },
    selo: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: cores.erro,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    seloTexto: { color: cores.branco, fontSize: 11, fontWeight: '700' },
    vazio: {
        alignItems: 'center',
        paddingVertical: espacos.xxl,
        paddingHorizontal: espacos.lg,
        gap: espacos.sm,
    },
    vazioCirculo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: cores.cinza,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: espacos.xs,
    },
    vazioTitulo: { fontSize: 15, fontWeight: '700', color: cores.preto, textAlign: 'center' },
    textoVazio: { fontSize: 13, color: cores.cinzaTexto, textAlign: 'center', lineHeight: 19 },
    vazioAcao: { marginTop: espacos.md, alignItems: 'center' },
    rodape: { height: espacos.md },
});
