import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import BarraInferior from '../components/BarraInferior';
import Botao from '../components/Botao';
import Cabecalho from '../components/Cabecalho';
import Icone from '../components/Icone';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import { listarAvaliacoes } from '../services/api';
import { cores, espacos, raios } from '../theme/cores';
import { formatarData } from '../utils/formato';

function calcularMedia(lista) {
    if (lista.length === 0) return 0;

    let soma = 0;
    for (let i = 0; i < lista.length; i++) {
        soma = soma + Number(lista[i].nota || 0);
    }
    return soma / lista.length;
}

function Estrelas({ nota, tamanho = 15 }) {
    const cheias = Math.round(nota);

    return (
        <View style={styles.linhaEstrelas}>
            {[1, 2, 3, 4, 5].map((numero) => (
                <Icone
                    key={numero}
                    nome={numero <= cheias ? 'star' : 'star-outline'}
                    tamanho={tamanho}
                    cor={numero <= cheias ? cores.amareloEscuro : cores.borda}
                />
            ))}
        </View>
    );
}

export default function TelaAvaliacoes() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const [avaliacoes, setAvaliacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (usuario) {
            carregarAvaliacoes();
        } else {
            setCarregando(false);
        }
    }, [usuario]);

    async function carregarAvaliacoes() {
        setErro('');

        try {
            const pagina = await listarAvaliacoes(usuario.id, { pagina: 0, tamanho: 50 });
            setAvaliacoes(pagina?.conteudo ?? []);
        } catch (e) {
            setAvaliacoes([]);
            setErro(e.message);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }

    function aoPuxarParaAtualizar() {
        setAtualizando(true);
        carregarAvaliacoes();
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

    const media = calcularMedia(avaliacoes);

    return (
        <Tela>
            <FlatList
                contentContainerStyle={styles.conteudo}
                data={avaliacoes}
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
                    <View>
                        <Cabecalho
                            titulo="Avaliações recebidas"
                            subtitulo="Reputação construída na plataforma"
                            mostrarVoltar={false}
                        />

                        {carregando ? null : (
                            <Vidro style={styles.resumo}>
                                <View style={styles.resumoNota}>
                                    <Text style={styles.mediaNumero}>{media.toFixed(1)}</Text>
                                    <Text style={styles.resumoTotal}>
                                        {avaliacoes.length}{' '}
                                        {avaliacoes.length === 1 ? 'avaliação' : 'avaliações'}
                                    </Text>
                                </View>

                                <View style={styles.resumoEstrelas}>
                                    <Estrelas nota={media} tamanho={18} />
                                    <Text style={styles.informacao}>
                                        {media >= 4.5
                                            ? 'Reputação excelente'
                                            : media >= 3.5
                                              ? 'Boa reputação'
                                              : media > 0
                                                ? 'Reputação em construção'
                                                : 'Sem avaliações'}
                                    </Text>
                                </View>
                            </Vidro>
                        )}

                        {!carregando && avaliacoes.length > 0 ? (
                            <Text style={styles.secao}>Comentários</Text>
                        ) : null}
                    </View>
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
                                <Icone nome="star-outline" tamanho={26} cor={cores.cinzaTexto} />
                            </View>
                            <Text style={styles.textoVazio}>
                                Nenhuma avaliação recebida até o momento.
                            </Text>
                        </Vidro>
                    )
                }
                renderItem={({ item }) => (
                    <Vidro style={styles.cartao}>
                        <View style={styles.linhaTopo}>
                            <Estrelas nota={item.nota} />

                            <View style={styles.autor}>
                                <Icone
                                    nome="person-circle-outline"
                                    tamanho={14}
                                    cor={cores.cinzaTexto}
                                />
                                <Text style={styles.autorTexto}>
                                    {item.avaliador?.nome || 'Participante'}
                                </Text>
                            </View>
                        </View>

                        {item.comentario ? (
                            <Text style={styles.comentario}>{item.comentario}</Text>
                        ) : (
                            <Text style={styles.informacao}>Sem comentário.</Text>
                        )}

                        <View style={styles.linhaData}>
                            <Icone
                                nome="calendar-outline"
                                tamanho={13}
                                cor={cores.cinzaTexto}
                            />
                            <Text style={styles.informacao}>{formatarData(item.data)}</Text>
                        </View>
                    </Vidro>
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
    resumo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.lg,
        marginBottom: espacos.lg,
    },
    resumoNota: {
        alignItems: 'center',
    },
    resumoEstrelas: {
        flex: 1,
        gap: espacos.xs,
    },
    mediaNumero: {
        fontSize: 34,
        fontWeight: '700',
        color: cores.preto,
        letterSpacing: -1,
    },
    resumoTotal: {
        fontSize: 11,
        color: cores.cinzaTexto,
    },
    linhaEstrelas: {
        flexDirection: 'row',
        gap: 2,
    },
    secao: {
        fontSize: 16,
        fontWeight: '700',
        color: cores.preto,
        marginBottom: espacos.md,
    },
    cartao: {
        padding: espacos.lg,
        marginBottom: espacos.md,
    },
    linhaTopo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: espacos.sm,
    },
    autor: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 1,
    },
    autorTexto: {
        fontSize: 12,
        color: cores.cinzaTexto,
        fontWeight: '600',
    },
    comentario: {
        fontSize: 14,
        color: cores.grafite,
        lineHeight: 20,
    },
    linhaData: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    informacao: {
        fontSize: 12,
        color: cores.cinzaTexto,
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