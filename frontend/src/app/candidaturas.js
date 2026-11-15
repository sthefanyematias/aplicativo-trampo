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
import { useAuth } from '../context/AuthContext';
import { listarCandidaturasDoContratado, meuPerfilContratado } from '../services/api';
import { cores } from '../theme/cores';

const NOMES_STATUS = {
    PENDENTE: 'Pendente',
    ACEITA: 'Aceita',
    RECUSADA: 'Recusada',
    ABERTO: 'Aberto',
    EM_ANDAMENTO: 'Em andamento',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
};

const CORES_STATUS = {
    PENDENTE: '#b77900',
    ACEITA: '#1f8f4e',
    RECUSADA: '#c62828',
    ABERTO: '#1f8f4e',
    EM_ANDAMENTO: '#b77900',
    CONCLUIDO: '#1f8f4e',
    CANCELADO: '#666666',
};

function formatarData(valor) {
    if (!valor) return '';
    const partes = String(valor).split('T')[0].split('-');
    if (partes.length !== 3) return '';
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function formatarDinheiro(valor) {
    const numero = Number(valor);
    if (isNaN(numero)) return 'R$ 0,00';
    return 'R$ ' + numero.toFixed(2).replace('.', ',');
}

function Etiqueta({ status }) {
    return (
        <Text style={[styles.etiqueta, { color: CORES_STATUS[status] || cores.cinzaTexto }]}>
            {NOMES_STATUS[status] || status || '-'}
        </Text>
    );
}

export default function TelaMinhasCandidaturas() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const [candidaturas, setCandidaturas] = useState([]);
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

    async function resolverContratadoId() {
        if (usuario?.contratadoId) return usuario.contratadoId;

        const perfil = await meuPerfilContratado();
        return perfil?.id ?? null;
    }

    async function carregar() {
        setErro('');

        try {
            const contratadoId = await resolverContratadoId();

            if (!contratadoId) {
                setCandidaturas([]);
                setErro('Perfil de trabalhador não encontrado.');
                return;
            }

            const pagina = await listarCandidaturasDoContratado(contratadoId, {
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
        const id = item?.servico?.id;

        if (!id) {
            setErro('Não foi possível abrir este serviço.');
            return;
        }

        router.push('/servico?id=' + id);
    }

    if (carregandoSessao) {
        return (
            <View style={styles.centro}>
                <ActivityIndicator color={cores.azul} size="large" />
            </View>
        );
    }

    if (!usuario) return <Redirect href="/login" />;

    return (
        <View style={styles.tela}>
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
                            carregar();
                        }}
                        tintColor={cores.azul}
                        colors={[cores.azul]}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.cabecalho}>
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Voltar"
                            onPress={() => router.back()}
                            style={styles.voltar}
                        >
                            <Text style={styles.voltarTexto}>Voltar</Text>
                        </Pressable>

                        <Text style={styles.titulo}>Minhas candidaturas</Text>
                        <Text style={styles.subtitulo}>
                            Acompanhe as vagas em que você se candidatou
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    carregando ? (
                        <View style={styles.vazio}>
                            <ActivityIndicator color={cores.azul} />
                            <Text style={styles.vazioTexto}>Carregando candidaturas...</Text>
                        </View>
                    ) : (
                        <View style={styles.vazio}>
                            <Text style={styles.vazioTitulo}>
                                {erro ? 'Não foi possível carregar' : 'Nenhuma candidatura'}
                            </Text>
                            <Text style={styles.vazioTexto}>
                                {erro
                                    ? erro
                                    : 'Você ainda não se candidatou a nenhuma vaga.'}
                            </Text>
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => {
                                    setCarregando(true);
                                    carregar();
                                }}
                                style={styles.botao}
                            >
                                <Text style={styles.botaoTexto}>Tentar novamente</Text>
                            </Pressable>
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => abrirServico(item)}
                        style={styles.cartao}
                    >
                        <View style={styles.linhaTitulo}>
                            <Text style={styles.tituloCartao} numberOfLines={2}>
                                {item.servico?.titulo || 'Serviço'}
                            </Text>
                            <Etiqueta status={item.status} />
                        </View>

                        <Text style={styles.valor}>{formatarDinheiro(item.servico?.valor)}</Text>

                        <Text style={styles.info}>
                            Serviço: {NOMES_STATUS[item.servico?.status] || item.servico?.status || '-'}
                        </Text>

                        {item.data ? (
                            <Text style={styles.info}>
                                Candidatura em {formatarData(item.data)}
                            </Text>
                        ) : null}

                        {item.servico?.endereco ? (
                            <Text style={styles.info} numberOfLines={1}>
                                {item.servico.endereco}
                            </Text>
                        ) : null}
                    </Pressable>
                )}
                ListFooterComponent={
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push('/proximos')}
                        style={styles.rodape}
                    >
                        <Text style={styles.rodapeTexto}>Ver vagas</Text>
                    </Pressable>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    tela: { flex: 1, backgroundColor: cores.cinza },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    conteudo: { padding: 18, paddingTop: 54, paddingBottom: 30 },
    cabecalho: { marginBottom: 14 },
    voltar: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 12 },
    voltarTexto: { color: cores.azul, fontSize: 14, fontWeight: '600' },
    titulo: { fontSize: 24, fontWeight: '700', color: cores.preto },
    subtitulo: { fontSize: 14, color: cores.cinzaTexto, marginTop: 4 },
    cartao: {
        backgroundColor: cores.branco,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    linhaTitulo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
    },
    tituloCartao: { flex: 1, fontSize: 16, fontWeight: '700', color: cores.preto },
    etiqueta: { fontSize: 12, fontWeight: '700' },
    valor: { fontSize: 17, fontWeight: '700', color: cores.azul, marginTop: 6 },
    info: { fontSize: 12, color: cores.cinzaTexto, marginTop: 4 },
    vazio: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        gap: 8,
    },
    vazioTitulo: { fontSize: 16, fontWeight: '700', color: cores.preto, textAlign: 'center' },
    vazioTexto: { fontSize: 13, color: cores.cinzaTexto, textAlign: 'center', lineHeight: 19 },
    botao: {
        marginTop: 10,
        backgroundColor: cores.azul,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    botaoTexto: { color: cores.branco, fontSize: 14, fontWeight: '700' },
    rodape: { alignItems: 'center', paddingVertical: 18 },
    rodapeTexto: { color: cores.azul, fontSize: 14, fontWeight: '700' },
});
