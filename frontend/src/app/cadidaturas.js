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
import { listarCandidaturasDoContratado } from '../services/api';
import { cores, espacos } from '../theme/cores';
import { formatarData, formatarDinheiro } from '../utils/formato';

export default function TelaMinhasCandidaturas() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const [candidaturas, setCandidaturas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (usuario && usuario.contratadoId) {
            carregarCandidaturas();
        } else {
            setCarregando(false);
        }
    }, [usuario]);

    async function carregarCandidaturas() {
        setErro('');

        try {
            const pagina = await listarCandidaturasDoContratado(usuario.contratadoId, {
                pagina: 0,
                tamanho: 50,
            });
            setCandidaturas(pagina?.conteudo ?? []);
        } catch (e) {
            setCandidaturas([]);
            setErro(e.message);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }

    function abrirServico(item) {
        const idDoServico = item?.servico?.id;

        if (!idDoServico) {
            setErro('Não foi possível abrir este serviço.');
            return;
        }

        router.push('/servico?id=' + idDoServico);
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
                data={candidaturas}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={atualizando}
                        onRefresh={() => {
                            setAtualizando(true);
                            carregarCandidaturas();
                        }}
                        tintColor={cores.azul}
                        colors={[cores.azul]}
                    />
                }
                ListHeaderComponent={
                    <Cabecalho
                        titulo="Minhas candidaturas"
                        subtitulo="Acompanhe as vagas em que você se candidatou"
                        mostrarVoltar={false}
                    />
                }
                ListFooterComponent={
                    <View style={styles.rodape}>
                        {carregando ? (
                            <ActivityIndicator color={cores.azul} />
                        ) : (
                            <Botao
                                titulo="Ver vagas"
                                icone="navigate-outline"
                                variante="claro"
                                onPress={() => router.replace('/proximos')}
                            />
                        )}
                    </View>
                }
                ListEmptyComponent={
                    carregando ? null : (
                        <Vidro style={styles.vazio}>
                            <View style={styles.vazioCirculo}>
                                <Icone nome="mail-outline" tamanho={26} cor={cores.cinzaTexto} />
                            </View>
                            <Text style={styles.vazioTitulo}>Nenhuma candidatura</Text>
                            <Text style={styles.textoVazio}>
                                Candidate-se a uma vaga para acompanhar aqui.
                            </Text>
                        </Vidro>
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={'Abrir serviço ' + (item.servico?.titulo || '')}
                        style={styles.toque}
                        onPress={() => abrirServico(item)}
                    >
                        <Vidro style={styles.cartao}>
                            <View style={styles.linhaTitulo}>
                                <Text style={styles.tituloCartao} numberOfLines={2}>
                                    {item.servico?.titulo || 'Serviço'}
                                </Text>
                                <EtiquetaStatus status={item.status} />
                            </View>

                            <Text style={styles.valor}>
                                {formatarDinheiro(item.servico?.valor)}
                            </Text>

                            <View style={styles.linhaInfo}>
                                <Icone
                                    nome="briefcase-outline"
                                    tamanho={14}
                                    cor={cores.cinzaTexto}
                                />
                                <Text style={styles.informacao}>Situação do serviço</Text>
                                <EtiquetaStatus status={item.servico?.status} />
                            </View>

                            {item.data ? (
                                <View style={styles.linhaInfo}>
                                    <Icone
                                        nome="calendar-outline"
                                        tamanho={14}
                                        cor={cores.cinzaTexto}
                                    />
                                    <Text style={styles.informacao}>
                                        Candidatura em {formatarData(item.data)}
                                    </Text>
                                </View>
                            ) : null}
                        </Vidro>
                    </TouchableOpacity>
                )}
            />

            <BarraInferior abaAtiva={undefined} tipo={usuario.tipo} />

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
    cartao: { padding: espacos.lg },
    linhaTitulo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: espacos.sm,
    },
    tituloCartao: { flex: 1, fontSize: 16, fontWeight: '700', color: cores.preto },
    valor: { fontSize: 17, fontWeight: '700', color: cores.azul },
    linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    informacao: { fontSize: 12, color: cores.cinzaTexto },
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
    textoVazio: { fontSize: 13, color: cores.cinzaTexto, textAlign: 'center' },
    rodape: { marginTop: espacos.md },
});