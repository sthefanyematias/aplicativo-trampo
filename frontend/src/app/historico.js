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
import { listarCandidaturasDoContratado, listarServicosDoContratante } from '../services/api';
import { cores, espacos } from '../theme/cores';
import { formatarData, formatarDinheiro } from '../utils/formato';

function terminou(status) {
    return status === 'CONCLUIDO' || status === 'CANCELADO';
}

export default function TelaHistorico() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const [lista, setLista] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    const ehContratante = usuario?.tipo === 'CONTRATANTE';
    const ehContratado = usuario?.tipo === 'CONTRATADO';

    useEffect(() => {
        if (usuario) {
            carregarHistorico();
        } else {
            setCarregando(false);
        }
    }, [usuario]);

    async function carregarHistorico() {
        setErro('');

        try {
            if (ehContratante && usuario.contratanteId) {
                const pagina = await listarServicosDoContratante(usuario.contratanteId, {
                    pagina: 0,
                    tamanho: 100,
                });

                const servicos = pagina?.conteudo ?? [];
                const terminados = servicos.filter((item) => terminou(item.status));

                setLista(
                    terminados.map((item) => ({
                        id: item.id,
                        titulo: item.titulo,
                        valor: item.valor,
                        status: item.status,
                        data: item.criadoEm,
                        pessoa: item.contratado?.usuario?.nome || '',
                    }))
                );
            }

            if (ehContratado && usuario.contratadoId) {
                const pagina = await listarCandidaturasDoContratado(usuario.contratadoId, {
                    pagina: 0,
                    tamanho: 100,
                });

                const candidaturas = pagina?.conteudo ?? [];
                const aceitas = candidaturas.filter(
                    (item) =>
                        item.status === 'ACEITA' && item.servico && terminou(item.servico.status)
                );

                setLista(
                    aceitas.map((item) => ({
                        id: item.servico.id,
                        titulo: item.servico.titulo,
                        valor: item.servico.valor,
                        status: item.servico.status,
                        data: item.servico.criadoEm,
                        pessoa: item.servico.contratante?.usuario?.nome || '',
                    }))
                );
            }
        } catch (e) {
            setLista([]);
            setErro(e.message);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }

    function aoPuxarParaAtualizar() {
        setAtualizando(true);
        carregarHistorico();
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

    return (
        <Tela>
            <FlatList
                contentContainerStyle={styles.conteudo}
                data={lista}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={atualizando}
                        onRefresh={aoPuxarParaAtualizar}
                        tintColor={cores.azul}
                        colors={[cores.azul]}
                    />
                }
                ListHeaderComponent={
                    <Cabecalho
                        titulo="Histórico"
                        subtitulo="Serviços concluídos e cancelados"
                        mostrarVoltar={false}
                    />
                }
                ListFooterComponent={
                    <View style={styles.rodape}>
                        {carregando ? (
                            <ActivityIndicator color={cores.azul} />
                        ) : (
                            <Botao
                                titulo="Voltar para o início"
                                variante="claro"
                                onPress={() => router.replace('/home')}
                            />
                        )}
                    </View>
                }
                ListEmptyComponent={
                    carregando ? null : (
                        <Vidro style={styles.vazio}>
                            <View style={styles.vazioCirculo}>
                                <Icone nome="time-outline" tamanho={26} cor={cores.cinzaTexto} />
                            </View>
                            <Text style={styles.textoVazio}>
                                Nenhum serviço finalizado até o momento.
                            </Text>
                        </Vidro>
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.toque}
                        onPress={() => router.push('/servico?id=' + item.id)}
                    >
                        <Vidro style={styles.cartao}>
                            <View style={styles.linhaTitulo}>
                                <Text style={styles.tituloCartao} numberOfLines={2}>
                                    {item.titulo}
                                </Text>
                                <EtiquetaStatus status={item.status} />
                            </View>

                            <Text style={styles.valor}>{formatarDinheiro(item.valor)}</Text>

                            {item.pessoa ? (
                                <View style={styles.linhaInfo}>
                                    <Icone
                                        nome="person-outline"
                                        tamanho={14}
                                        cor={cores.cinzaTexto}
                                    />
                                    <Text style={styles.informacao}>
                                        {ehContratante ? 'Trabalhador' : 'Contratante'}:{' '}
                                        {item.pessoa}
                                    </Text>
                                </View>
                            ) : null}

                            {item.data ? (
                                <View style={styles.linhaInfo}>
                                    <Icone
                                        nome="calendar-outline"
                                        tamanho={14}
                                        cor={cores.cinzaTexto}
                                    />
                                    <Text style={styles.informacao}>
                                        Publicado em {formatarData(item.data)}
                                    </Text>
                                </View>
                            ) : null}
                        </Vidro>
                    </TouchableOpacity>
                )}
            />

            <BarraInferior abaAtiva="home" tipo={usuario.tipo} />

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
    centro: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    conteudo: {
        padding: espacos.lg,
        paddingBottom: espacos.sm,
    },
    toque: {
        marginBottom: espacos.md,
    },
    cartao: {
        padding: espacos.lg,
    },
    linhaTitulo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: espacos.sm,
    },
    tituloCartao: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: cores.preto,
    },
    valor: {
        fontSize: 17,
        fontWeight: '700',
        color: cores.azul,
    },
    linhaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    informacao: {
        fontSize: 12,
        color: cores.cinzaTexto,
        flexShrink: 1,
    },
    vazio: {
        alignItems: 'center',
        gap: espacos.md,
        paddingVertical: espacos.xl,
    },
    vazioCirculo: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: cores.cinza,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textoVazio: {
        color: cores.cinzaTexto,
        textAlign: 'center',
        fontSize: 14,
    },
    rodape: {
        marginTop: espacos.md,
    },
});