
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import EtiquetaStatus from '../components/EtiquetaStatus';
import Icone from '../components/Icone';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import {
    iniciarAnaliseReporte,
    listarReportes,
    listarTodosServicos,
    listarUsuarios,
    resolverReporte,
    resumoAdministrativo,
} from '../services/api';
import { cores, espacos, raios } from '../theme/cores';
import { formatarData, formatarDinheiro, formatarHora, formatarQuando, nomeCompleto } from '../utils/formato';

const ABAS = [
    { chave: 'resumo', rotulo: 'Resumo', icone: 'stats-chart-outline' },
    { chave: 'usuarios', rotulo: 'Usuários', icone: 'people-outline' },
    { chave: 'servicos', rotulo: 'Serviços', icone: 'briefcase-outline' },
    { chave: 'suporte', rotulo: 'Suporte', icone: 'headset-outline' },
];

const ASSUNTOS = {
    PROBLEMA_NO_SERVICO: 'Problema com um serviço',
    PROBLEMA_NO_CHAT: 'Problema na conversa',
    PAGAMENTO: 'Pagamento ou cobrança',
    COMPORTAMENTO: 'Comportamento inadequado',
    CONTA: 'Problema com a conta',
    OUTRO: 'Outro assunto',
};

const NOMES_STATUS_REPORTE = {
    ABERTO: 'Aberto',
    EM_ANALISE: 'Em análise',
    RESOLVIDO: 'Resolvido',
};

const NOMES_TIPO = {
    ADMIN: 'Administrador',
    CONTRATADO: 'Trabalhador',
    CONTRATANTE: 'Contratante',
};

export default function TelaAdmin() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao, sair } = useAuth();

    const [aba, setAba] = useState('resumo');
    const [resumo, setResumo] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [reportes, setReportes] = useState([]);
    const [respostas, setRespostas] = useState({});
    const [resolvendo, setResolvendo] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (usuario) {
            carregarTudo();
        } else {
            setCarregando(false);
        }
    }, [usuario]);

    async function carregarTudo() {
        setErro('');

        try {
            const [dadosResumo, dadosUsuarios, dadosServicos, dadosReportes] = await Promise.all([
                resumoAdministrativo(),
                listarUsuarios({ pagina: 0, tamanho: 50 }),
                listarTodosServicos({ pagina: 0, tamanho: 50 }),
                listarReportes(),
            ]);

            setResumo(dadosResumo);
            setUsuarios(dadosUsuarios?.conteudo ?? []);
            setServicos(dadosServicos?.conteudo ?? []);
            setReportes(dadosReportes ?? []);
        } catch (e) {
            setErro(e.message);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }

    function atualizar() {
        setAtualizando(true);
        carregarTudo();
    }

    async function resolver(item) {
        setErro('');
        setResolvendo(String(item.id));

        try {
            const resolvido = await resolverReporte(item.id, respostas[item.id] ?? '');
            setReportes((anterior) =>
                anterior.map((reporte) => (reporte.id === item.id ? resolvido : reporte))
            );
            setRespostas((anterior) => ({ ...anterior, [item.id]: '' }));
        } catch (e) {
            setErro(e.message);
        } finally {
            setResolvendo('');
        }
    }

    async function analisar(item) {
        setErro('');
        setResolvendo(String(item.id));

        try {
            const atualizado = await iniciarAnaliseReporte(item.id);
            setReportes((anterior) =>
                anterior.map((reporte) => (reporte.id === item.id ? atualizado : reporte))
            );
        } catch (e) {
            setErro(e.message);
        } finally {
            setResolvendo('');
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
    if (usuario.tipo !== 'ADMIN') return <Redirect href="/home" />;

    const cartoes = resumo
        ? [
              {
                  chave: 'usuarios',
                  titulo: 'Usuários',
                  valor: resumo.usuarios,
                  icone: 'people-outline',
              },
              {
                  chave: 'contratados',
                  titulo: 'Trabalhadores',
                  valor: resumo.contratados,
                  icone: 'construct-outline',
              },
              {
                  chave: 'contratantes',
                  titulo: 'Contratantes',
                  valor: resumo.contratantes,
                  icone: 'briefcase-outline',
              },
              {
                  chave: 'abertos',
                  titulo: 'Abertos',
                  valor: resumo.servicosAbertos,
                  icone: 'megaphone-outline',
              },
              {
                  chave: 'andamento',
                  titulo: 'Em andamento',
                  valor: resumo.servicosEmAndamento,
                  icone: 'sync-outline',
              },
              {
                  chave: 'concluidos',
                  titulo: 'Concluídos',
                  valor: resumo.servicosConcluidos,
                  icone: 'checkmark-circle-outline',
              },
              {
                  chave: 'cancelados',
                  titulo: 'Cancelados',
                  valor: resumo.servicosCancelados,
                  icone: 'close-circle-outline',
              },
              {
                  chave: 'candidaturas',
                  titulo: 'Pendentes',
                  valor: resumo.candidaturasPendentes,
                  icone: 'mail-unread-outline',
              },
              {
                  chave: 'avaliacoes',
                  titulo: 'Avaliações',
                  valor: resumo.avaliacoes,
                  icone: 'star-outline',
              },
              {
                  chave: 'suporte',
                  titulo: 'Suporte',
                  valor: resumo.reportesAbertos,
                  icone: 'headset-outline',
              },
          ]
        : [];

    const recarregar = (
        <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizar}
            tintColor={cores.azul}
            colors={[cores.azul]}
        />
    );

    return (
        <Tela>
            <View style={styles.cabecalho}>
                <View style={styles.cabecalhoTexto}>
                    <Text style={styles.titulo}>Painel administrativo</Text>
                    <Text style={styles.subtitulo}>{usuario.email}</Text>
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Sair da conta"
                    onPress={sair}
                    style={({ pressed }) => [
                        styles.sair,
                        pressed ? styles.sairPressionado : null,
                    ]}
                >
                    <Icone nome="log-out-outline" tamanho={20} cor={cores.erro} />
                </Pressable>
            </View>

            <View style={styles.abas}>
                {ABAS.map((item) => {
                    const ativa = aba === item.chave;

                    return (
                        <Pressable
                            key={item.chave}
                            accessibilityRole="tab"
                            accessibilityLabel={item.rotulo}
                            accessibilityState={{ selected: ativa }}
                            onPress={() => setAba(item.chave)}
                            style={[styles.aba, ativa ? styles.abaAtiva : null]}
                        >
                            <Icone
                                nome={item.icone}
                                tamanho={15}
                                cor={ativa ? cores.branco : cores.cinzaTexto}
                            />
                            <Text style={[styles.abaTexto, ativa ? styles.abaTextoAtivo : null]}>
                                {item.rotulo}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {carregando ? (
                <View style={styles.centroLista}>
                    <ActivityIndicator color={cores.azul} size="large" />
                </View>
            ) : null}

            {!carregando && aba === 'resumo' ? (
                <FlatList
                    key="lista-resumo"
                    data={cartoes}
                    numColumns={3}
                    keyExtractor={(item) => item.chave}
                    columnWrapperStyle={styles.linhaCartoes}
                    contentContainerStyle={styles.gradeCartoes}
                    showsVerticalScrollIndicator={false}
                    refreshControl={recarregar}
                    renderItem={({ item }) => (
                        <Vidro style={styles.cartaoResumo}>
                            <Icone nome={item.icone} tamanho={18} cor={cores.azul} />
                            <Text style={styles.numeroResumo}>{item.valor ?? 0}</Text>
                            <Text style={styles.tituloResumo} numberOfLines={1}>
                                {item.titulo}
                            </Text>
                        </Vidro>
                    )}
                />
            ) : null}

            {!carregando && aba === 'usuarios' ? (
                <FlatList
                    key="lista-usuarios"
                    data={usuarios}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.lista}
                    showsVerticalScrollIndicator={false}
                    refreshControl={recarregar}
                    ListEmptyComponent={
                        <Text style={styles.vazio}>Nenhum usuário cadastrado.</Text>
                    }
                    renderItem={({ item }) => (
                        <Vidro style={styles.cartaoLinha}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarLetra}>
                                    {String(item.nome || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </View>

                            <View style={styles.areaTexto}>
                                <Text style={styles.tituloLinha} numberOfLines={1}>
                                    {nomeCompleto(item)}
                                </Text>
                                <Text style={styles.informacao} numberOfLines={1}>
                                    {item.email}
                                </Text>
                            </View>

                            <Text style={styles.tipo}>{NOMES_TIPO[item.tipo] || item.tipo}</Text>
                        </Vidro>
                    )}
                />
            ) : null}

            {!carregando && aba === 'servicos' ? (
                <FlatList
                    key="lista-servicos"
                    data={servicos}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.lista}
                    showsVerticalScrollIndicator={false}
                    refreshControl={recarregar}
                    ListEmptyComponent={
                        <Text style={styles.vazio}>Nenhum serviço publicado.</Text>
                    }
                    renderItem={({ item }) => (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={'Abrir serviço ' + item.titulo}
                            onPress={() => router.push('/servico?id=' + item.id)}
                        >
                            <Vidro style={styles.cartaoServico}>
                                <View style={styles.linhaTitulo}>
                                    <Text style={styles.tituloLinha} numberOfLines={2}>
                                        {item.titulo}
                                    </Text>
                                    <EtiquetaStatus status={item.status} />
                                </View>

                                <Text style={styles.valor}>{formatarDinheiro(item.valor)}</Text>

                                <Text style={styles.informacao}>
                                    {formatarQuando(
                                        item.dataServico,
                                        item.horaInicio,
                                        item.horaFim,
                                        item.periodo
                                    )}
                                </Text>
                            </Vidro>
                        </Pressable>
                    )}
                />
            ) : null}

            {!carregando && aba === 'suporte' ? (
                <FlatList
                    key="lista-suporte"
                    data={reportes}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.lista}
                    showsVerticalScrollIndicator={false}
                    refreshControl={recarregar}
                    ListEmptyComponent={
                        <Text style={styles.vazio}>Nenhuma solicitação de suporte.</Text>
                    }
                    renderItem={({ item }) => {
                        const resolvido = item.status === 'RESOLVIDO';

                        return (
                            <Vidro style={styles.cartaoReporte}>
                                <View style={styles.linhaTitulo}>
                                    <Text style={styles.tituloReporte} numberOfLines={2}>
                                        {ASSUNTOS[item.assunto] || item.assunto}
                                    </Text>
                                    <View
                                        style={[
                                            styles.etiquetaReporte,
                                            resolvido
                                                ? styles.etiquetaResolvido
                                                : styles.etiquetaAberto,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.etiquetaReporteTexto,
                                                resolvido
                                                    ? styles.etiquetaTextoResolvido
                                                    : styles.etiquetaTextoAberto,
                                            ]}
                                        >
                                            {NOMES_STATUS_REPORTE[item.status] || item.status}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.autorReporte}>
                                    {nomeCompleto(item.usuario)}
                                </Text>
                                <Text style={styles.informacao} numberOfLines={1}>
                                    {item.usuario?.email}
                                </Text>

                                {item.servico?.titulo ? (
                                    <Text style={styles.servicoReporte} numberOfLines={1}>
                                        Serviço: {item.servico.titulo}
                                    </Text>
                                ) : null}

                                <Text style={styles.descricaoReporte}>{item.descricao}</Text>

                                {resolvido ? (
                                    <View style={styles.respostaAdmin}>
                                        <Text style={styles.respostaAdminTitulo}>
                                            Resposta enviada
                                        </Text>
                                        <Text style={styles.descricaoReporte}>
                                            {item.resposta}
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        <TextInput
                                            style={styles.campoResposta}
                                            value={respostas[item.id] ?? ''}
                                            onChangeText={(texto) =>
                                                setRespostas((anterior) => ({
                                                    ...anterior,
                                                    [item.id]: texto,
                                                }))
                                            }
                                            placeholder="Escreva a resposta para o usuário"
                                            placeholderTextColor={cores.cinzaTexto}
                                            multiline
                                            maxLength={2000}
                                        />

                                        <View style={styles.acoesReporte}>
                                            {item.status === 'ABERTO' ? (
                                                <Pressable
                                                    accessibilityRole="button"
                                                    onPress={() => analisar(item)}
                                                    disabled={resolvendo === String(item.id)}
                                                    style={({ pressed }) => [
                                                        styles.acaoSecundaria,
                                                        pressed ? styles.acaoPressionada : null,
                                                    ]}
                                                >
                                                    <Text style={styles.acaoSecundariaTexto}>
                                                        Em análise
                                                    </Text>
                                                </Pressable>
                                            ) : null}

                                            <Pressable
                                                accessibilityRole="button"
                                                onPress={() => resolver(item)}
                                                disabled={resolvendo === String(item.id)}
                                                style={({ pressed }) => [
                                                    styles.acaoPrimaria,
                                                    pressed ? styles.acaoPressionada : null,
                                                ]}
                                            >
                                                {resolvendo === String(item.id) ? (
                                                    <ActivityIndicator
                                                        color={cores.branco}
                                                        size="small"
                                                    />
                                                ) : (
                                                    <>
                                                        <Icone
                                                            nome="checkmark-done"
                                                            tamanho={14}
                                                            cor={cores.branco}
                                                        />
                                                        <Text style={styles.acaoPrimariaTexto}>
                                                            Resolver
                                                        </Text>
                                                    </>
                                                )}
                                            </Pressable>
                                        </View>
                                    </>
                                )}

                                <Text style={styles.dataReporte}>
                                    {formatarData(item.criadoEm)}
                                    {item.criadoEm ? ' · ' + formatarHora(item.criadoEm) : ''}
                                </Text>
                            </Vidro>
                        );
                    }}
                />
            ) : null}

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
    centroLista: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cabecalho: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.md,
        paddingHorizontal: espacos.lg,
        paddingTop: espacos.sm,
    },
    cabecalhoTexto: { flex: 1, gap: 2 },
    titulo: {
        fontSize: 22,
        fontWeight: '700',
        color: cores.preto,
        letterSpacing: -0.4,
    },
    subtitulo: { fontSize: 12, color: cores.cinzaTexto },
    sair: {
        width: 42,
        height: 42,
        borderRadius: raios.pilula,
        backgroundColor: cores.erroClaro,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sairPressionado: { opacity: 0.7, transform: [{ scale: 0.94 }] },
    abas: {
        flexDirection: 'row',
        gap: espacos.sm,
        padding: espacos.lg,
        paddingBottom: espacos.sm,
    },
    aba: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 40,
        borderRadius: raios.pequeno,
        backgroundColor: cores.branco,
        borderWidth: 1,
        borderColor: cores.borda,
    },
    abaAtiva: { backgroundColor: cores.azul, borderColor: cores.azul },
    abaTexto: { fontSize: 12, fontWeight: '600', color: cores.cinzaTexto },
    abaTextoAtivo: { color: cores.branco },
    gradeCartoes: {
        paddingHorizontal: espacos.lg,
        paddingBottom: espacos.lg,
    },
    linhaCartoes: { gap: espacos.sm, marginBottom: espacos.sm },
    cartaoResumo: { flex: 1, padding: espacos.md, gap: 2, alignItems: 'flex-start' },
    numeroResumo: { fontSize: 20, fontWeight: '700', color: cores.preto },
    tituloResumo: { fontSize: 10, color: cores.cinzaTexto, fontWeight: '600' },
    lista: { paddingHorizontal: espacos.lg, paddingBottom: espacos.lg },
    cartaoLinha: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.md,
        padding: espacos.md,
        marginBottom: espacos.sm,
    },
    cartaoServico: { padding: espacos.md, marginBottom: espacos.sm },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: cores.azulClaro,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLetra: { color: cores.azul, fontSize: 15, fontWeight: '700' },
    areaTexto: { flex: 1, gap: 2 },
    linhaTitulo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: espacos.sm,
    },
    tituloLinha: { flex: 1, fontSize: 14, fontWeight: '700', color: cores.preto },
    informacao: { fontSize: 12, color: cores.cinzaTexto },
    valor: { fontSize: 15, fontWeight: '700', color: cores.azul },
    tipo: { fontSize: 11, fontWeight: '600', color: cores.cinzaTexto },
    vazio: {
        fontSize: 13,
        color: cores.cinzaTexto,
        textAlign: 'center',
        paddingVertical: espacos.xl,
    },
    cartaoReporte: { padding: espacos.md, marginBottom: espacos.sm, gap: 4 },
    tituloReporte: { flex: 1, fontSize: 14, fontWeight: '700', color: cores.preto },
    etiquetaReporte: { borderRadius: raios.pilula, paddingHorizontal: 8, paddingVertical: 3 },
    etiquetaAberto: { backgroundColor: cores.alertaClaro },
    etiquetaResolvido: { backgroundColor: cores.sucessoClaro },
    etiquetaReporteTexto: { fontSize: 10, fontWeight: '700' },
    etiquetaTextoAberto: { color: cores.alerta },
    etiquetaTextoResolvido: { color: cores.sucesso },
    autorReporte: { fontSize: 12, fontWeight: '700', color: cores.grafite },
    servicoReporte: { fontSize: 11, color: cores.azul, fontWeight: '600' },
    descricaoReporte: { fontSize: 12, color: cores.grafite, lineHeight: 18 },
    respostaAdmin: {
        backgroundColor: cores.sucessoClaro,
        borderRadius: raios.pequeno,
        padding: espacos.md,
        gap: 3,
        marginTop: espacos.xs,
    },
    respostaAdminTitulo: { fontSize: 11, fontWeight: '700', color: cores.sucesso },
    campoResposta: {
        minHeight: 64,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: raios.pequeno,
        padding: espacos.sm,
        fontSize: 12,
        color: cores.preto,
        textAlignVertical: 'top',
        backgroundColor: cores.branco,
        marginTop: espacos.xs,
    },
    acoesReporte: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacos.sm },
    acaoSecundaria: {
        borderRadius: raios.pequeno,
        borderWidth: 1,
        borderColor: cores.borda,
        paddingHorizontal: espacos.md,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acaoSecundariaTexto: { fontSize: 11, fontWeight: '600', color: cores.cinzaTexto },
    acaoPrimaria: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: cores.sucesso,
        borderRadius: raios.pequeno,
        paddingHorizontal: espacos.md,
        height: 34,
        justifyContent: 'center',
    },
    acaoPrimariaTexto: { fontSize: 11, fontWeight: '700', color: cores.branco },
    acaoPressionada: { opacity: 0.8 },
    dataReporte: { fontSize: 10, color: cores.cinzaTexto },
});
