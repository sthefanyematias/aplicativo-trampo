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
import { listarServicosDoContratante } from '../services/api';
import { cores, espacos } from '../theme/cores';
import { formatarDinheiro, formatarQuando } from '../utils/formato';

export default function TelaMeusServicos() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const [servicos, setServicos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (usuario && usuario.contratanteId) {
            carregarServicos();
        } else {
            setCarregando(false);
        }
    }, [usuario]);

    async function carregarServicos() {
        setErro('');

        try {
            const pagina = await listarServicosDoContratante(usuario.contratanteId, {
                pagina: 0,
                tamanho: 50,
            });
            setServicos(pagina?.conteudo ?? []);
        } catch (e) {
            setServicos([]);
            setErro(e.message);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }

    function aoPuxarParaAtualizar() {
        setAtualizando(true);
        carregarServicos();
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
                data={servicos}
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
                        titulo="Meus serviços"
                        subtitulo="Toque em um serviço para ver as candidaturas"
                        mostrarVoltar={false}
                    />
                }
                ListFooterComponent={
                    <View style={styles.rodape}>
                        {carregando ? (
                            <ActivityIndicator color={cores.azul} />
                        ) : (
                            <Botao
                                titulo="Publicar novo serviço"
                                variante="claro"
                                onPress={() => router.push('/publicar')}
                            />
                        )}
                    </View>
                }
                ListEmptyComponent={
                    carregando ? null : (
                        <Vidro style={styles.vazio}>
                            <View style={styles.vazioCirculo}>
                                <Icone
                                    nome="briefcase-outline"
                                    tamanho={26}
                                    cor={cores.cinzaTexto}
                                />
                            </View>
                            <Text style={styles.textoVazio}>
                                Você ainda não publicou nenhum serviço.
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

                            <View style={styles.linhaInfo}>
                                <Icone
                                    nome="calendar-outline"
                                    tamanho={14}
                                    cor={cores.cinzaTexto}
                                />
                                <Text style={styles.informacao}>
                                    {formatarQuando(
                                        item.dataServico,
                                        item.horaInicio,
                                        item.horaFim,
                                        item.periodo
                                    )}
                                </Text>
                            </View>

                            {item.endereco ? (
                                <View style={styles.linhaInfo}>
                                    <Icone
                                        nome="location-outline"
                                        tamanho={14}
                                        cor={cores.cinzaTexto}
                                    />
                                    <Text style={styles.informacao} numberOfLines={1}>
                                        {item.endereco}
                                    </Text>
                                </View>
                            ) : null}
                        </Vidro>
                    </TouchableOpacity>
                )}
            />

            <BarraInferior abaAtiva="servicos" tipo={usuario.tipo} />

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