import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
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
import EtiquetaStatus from '../components/EtiquetaStatus';
import Icone from '../components/Icone';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import {
    contarCandidaturasPendentes,
    listarNotificacoes,
    listarServicosAbertos,
} from '../services/api';
import { cores, espacos, raios } from '../theme/cores';
import { formatarDinheiro, formatarQuando, primeiroNome } from '../utils/formato';

const ACOES_CONTRATANTE = [
    {
        chave: 'publicar',
        rotulo: 'Publicar',
        icone: 'add-circle-outline',
        rota: '/publicar',
        fundo: 'rgba(255, 222, 89, 0.35)',
        cor: cores.amareloEscuro,
    },
    {
        chave: 'servicos',
        rotulo: 'Serviços',
        icone: 'briefcase-outline',
        rota: '/meus-servicos',
        fundo: cores.azulClaro,
        cor: cores.azul,
    },
    {
        chave: 'historico',
        rotulo: 'Histórico',
        icone: 'time-outline',
        rota: '/historico',
        fundo: cores.azulClaro,
        cor: cores.azul,
    },
    {
        chave: 'avaliacoes',
        rotulo: 'Avaliações',
        icone: 'star-outline',
        rota: '/avaliacoes',
        fundo: cores.azulClaro,
        cor: cores.azul,
    },
    {
        chave: 'suporte',
        rotulo: 'Ajuda',
        icone: 'headset-outline',
        rota: '/suporte',
        fundo: cores.sucessoClaro,
        cor: cores.sucesso,
    },
];

const ACOES_CONTRATADO = [
    {
        chave: 'vagas',
        rotulo: 'Vagas',
        icone: 'navigate-outline',
        rota: '/proximos',
        fundo: 'rgba(255, 222, 89, 0.35)',
        cor: cores.amareloEscuro,
    },
    {
        chave: 'candidaturas',
        rotulo: 'Candidaturas',
        icone: 'mail-outline',
        rota: '/candidaturas',
        fundo: cores.azulClaro,
        cor: cores.azul,
    },
    {
        chave: 'historico',
        rotulo: 'Histórico',
        icone: 'time-outline',
        rota: '/historico',
        fundo: cores.azulClaro,
        cor: cores.azul,
    },
    {
        chave: 'avaliacoes',
        rotulo: 'Avaliações',
        icone: 'star-outline',
        rota: '/avaliacoes',
        fundo: cores.azulClaro,
        cor: cores.azul,
    },
    {
        chave: 'suporte',
        rotulo: 'Ajuda',
        icone: 'headset-outline',
        rota: '/suporte',
        fundo: cores.sucessoClaro,
        cor: cores.sucesso,
    },
];

export default function Home() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const [servicos, setServicos] = useState([]);
    const [pendentes, setPendentes] = useState(0);
    const [notificacoes, setNotificacoes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    const ehContratante = usuario?.tipo === 'CONTRATANTE';
    const acoes = ehContratante ? ACOES_CONTRATANTE : ACOES_CONTRATADO;

    useEffect(() => {
        if (usuario) {
            carregarTudo();
        } else {
            setCarregando(false);
        }
    }, [usuario]);

    async function carregarTudo() {
        await Promise.all([carregarServicos(), carregarPendentes(), carregarNotificacoes()]);
    }

    async function carregarServicos() {
        setErro('');

        try {
            const pagina = await listarServicosAbertos({ pagina: 0, tamanho: 50 });
            setServicos(pagina?.conteudo ?? []);
        } catch (e) {
            setServicos([]);
            setErro(e.message);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }

    async function carregarPendentes() {
        if (!ehContratante) return;

        try {
            const dados = await contarCandidaturasPendentes();
            setPendentes(Number(dados?.total ?? 0));
        } catch {
            setPendentes(0);
        }
    }

    async function carregarNotificacoes() {
        try {
            const dados = await listarNotificacoes();
            setNotificacoes(dados ?? []);
        } catch {
            setNotificacoes([]);
        }
    }

    function aoPuxarParaAtualizar() {
        setAtualizando(true);
        carregarTudo();
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
    const ultimaNaoLida = notificacoes.find((item) => !item.lida) || null;

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
                    <View>
                        <View style={styles.cabecalho}>
                            <View style={styles.saudacaoArea}>
                                <Text style={styles.saudacao}>
                                    Olá, {primeiroNome(usuario.nome) || 'bem-vindo'}
                                </Text>
                                <Text style={styles.subtitulo}>
                                    {ehContratante
                                        ? 'O que você precisa hoje?'
                                        : 'Encontre uma vaga perto de você.'}
                                </Text>
                            </View>

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={
                                    naoLidas > 0
                                        ? 'Notificações, ' + naoLidas + ' não lidas'
                                        : 'Notificações'
                                }
                                onPress={() => router.push('/notificacoes')}
                                style={({ pressed }) => [
                                    styles.sino,
                                    pressed ? styles.avatarPressionado : null,
                                ]}
                            >
                                <Icone
                                    nome={naoLidas > 0 ? 'notifications' : 'notifications-outline'}
                                    tamanho={20}
                                    cor={cores.azul}
                                />

                                {naoLidas > 0 ? (
                                    <View style={styles.sinoSelo}>
                                        <Text style={styles.sinoSeloTexto}>
                                            {naoLidas > 9 ? '9+' : naoLidas}
                                        </Text>
                                    </View>
                                ) : null}
                            </Pressable>

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Abrir perfil"
                                onPress={() => router.push('/perfil')}
                                style={({ pressed }) => [
                                    styles.avatar,
                                    pressed ? styles.avatarPressionado : null,
                                ]}
                            >
                                <Text style={styles.avatarLetra}>
                                    {String(usuario.nome || 'T').charAt(0).toUpperCase()}
                                </Text>
                            </Pressable>
                        </View>

                        {ultimaNaoLida ? (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={'Nova notificação: ' + ultimaNaoLida.titulo}
                                onPress={() => router.push('/notificacoes')}
                                style={({ pressed }) => [
                                    styles.notificacao,
                                    pressed ? styles.notificacaoPressionada : null,
                                ]}
                            >
                                <View style={styles.notificacaoIcone}>
                                    <Icone
                                        nome={
                                            ultimaNaoLida.tipo === 'AVALIACAO'
                                                ? 'star'
                                                : ultimaNaoLida.tipo === 'SUPORTE'
                                                  ? 'headset'
                                                  : 'notifications'
                                        }
                                        tamanho={20}
                                        cor={cores.branco}
                                    />
                                </View>

                                <View style={styles.notificacaoTexto}>
                                    <Text style={styles.notificacaoTitulo} numberOfLines={1}>
                                        {ultimaNaoLida.titulo}
                                    </Text>
                                    <Text style={styles.notificacaoDica} numberOfLines={2}>
                                        {ultimaNaoLida.mensagem}
                                    </Text>
                                </View>

                                <Icone nome="chevron-forward" tamanho={18} cor={cores.branco} />
                            </Pressable>
                        ) : null}

                        {ehContratante && pendentes > 0 ? (
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={
                                    pendentes +
                                    ' candidaturas aguardando resposta. Toque para revisar.'
                                }
                                onPress={() => router.push('/meus-servicos')}
                                style={({ pressed }) => [
                                    styles.notificacao,
                                    pressed ? styles.notificacaoPressionada : null,
                                ]}
                            >
                                <View style={styles.notificacaoIcone}>
                                    <Icone nome="notifications" tamanho={20} cor={cores.branco} />
                                </View>

                                <View style={styles.notificacaoTexto}>
                                    <Text style={styles.notificacaoTitulo}>
                                        {pendentes}{' '}
                                        {pendentes === 1
                                            ? 'candidatura aguardando resposta'
                                            : 'candidaturas aguardando resposta'}
                                    </Text>
                                    <Text style={styles.notificacaoDica}>
                                        Revise e escolha o profissional
                                    </Text>
                                </View>

                                <Icone nome="chevron-forward" tamanho={18} cor={cores.branco} />
                            </Pressable>
                        ) : null}

                        <Vidro style={styles.acoes}>
                            {acoes.map((acao) => (
                                <Pressable
                                    key={acao.chave}
                                    accessibilityRole="button"
                                    accessibilityLabel={acao.rotulo}
                                    onPress={() => router.push(acao.rota)}
                                    style={({ pressed }) => [
                                        styles.acao,
                                        pressed ? styles.acaoPressionada : null,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.acaoCirculo,
                                            { backgroundColor: acao.fundo },
                                        ]}
                                    >
                                        <Icone nome={acao.icone} tamanho={22} cor={acao.cor} />
                                    </View>

                                    {acao.chave === 'servicos' && pendentes > 0 ? (
                                        <View style={styles.selo}>
                                            <Text style={styles.seloTexto}>{pendentes}</Text>
                                        </View>
                                    ) : null}

                                    <Text style={styles.acaoRotulo} numberOfLines={1}>
                                        {acao.rotulo}
                                    </Text>
                                </Pressable>
                            ))}
                        </Vidro>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Abrir ajuda e suporte"
                            onPress={() => router.push('/suporte')}
                            style={({ pressed }) => [
                                styles.suporte,
                                pressed ? styles.acaoPressionada : null,
                            ]}
                        >
                            <View style={styles.suporteIcone}>
                                <Icone nome="headset-outline" tamanho={18} cor={cores.sucesso} />
                            </View>

                            <View style={styles.suporteTexto}>
                                <Text style={styles.suporteTitulo}>Precisa de ajuda?</Text>
                                <Text style={styles.suporteDica}>
                                    Fale com o suporte e reporte um problema
                                </Text>
                            </View>

                            <Icone nome="chevron-forward" tamanho={16} cor={cores.cinzaTexto} />
                        </Pressable>

                        <View style={styles.linhaSecao}>
                            <Text style={styles.secao}>Serviços abertos</Text>
                            {!carregando ? (
                                <Text style={styles.contador}>{servicos.length}</Text>
                            ) : null}
                        </View>
                    </View>
                }
                ListFooterComponent={<View style={styles.rodape} />}
                ListEmptyComponent={
                    carregando ? (
                        <Vidro style={styles.vazio}>
                            <ActivityIndicator color={cores.azul} />
                            <Text style={styles.vazioTexto}>
                                Carregando os serviços disponíveis...
                            </Text>
                        </Vidro>
                    ) : (
                        <Vidro style={styles.vazio}>
                            <View style={styles.vazioCirculo}>
                                <Icone
                                    nome={erro ? 'cloud-offline-outline' : 'briefcase-outline'}
                                    tamanho={26}
                                    cor={cores.cinzaTexto}
                                />
                            </View>

                            <Text style={styles.vazioTitulo}>
                                {erro ? 'Não foi possível carregar' : 'Nenhum serviço aberto'}
                            </Text>

                            <Text style={styles.vazioTexto}>
                                {erro
                                    ? 'Verifique a conexão e tente novamente.'
                                    : 'Novos serviços aparecem aqui assim que forem publicados.'}
                            </Text>

                            <View style={styles.vazioAcao}>
                                <Botao
                                    titulo={erro ? 'Tentar novamente' : 'Atualizar lista'}
                                    icone="refresh-outline"
                                    variante="claro"
                                    compacto
                                    onPress={carregarServicos}
                                />
                            </View>
                        </Vidro>
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={'Abrir serviço ' + item.titulo}
                        style={styles.toqueCartao}
                        onPress={() => router.push('/servico?id=' + item.id)}
                    >
                        <Vidro style={styles.cartao}>
                            <View style={styles.linhaTitulo}>
                                <Text style={styles.tituloCartao} numberOfLines={2}>
                                    {item.titulo}
                                </Text>
                                <EtiquetaStatus status={item.status} />
                            </View>

                            {item.descricao ? (
                                <Text style={styles.descricao} numberOfLines={2}>
                                    {item.descricao}
                                </Text>
                            ) : null}

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

                            <View style={styles.linhaRodape}>
                                <Text style={styles.valor}>{formatarDinheiro(item.valor)}</Text>

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
                            </View>
                        </Vidro>
                    </TouchableOpacity>
                )}
            />

            <BarraInferior abaAtiva="home" tipo={usuario.tipo} />

            <Aviso
                visivel={Boolean(erro) && servicos.length > 0}
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
    cabecalho: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.md,
        marginTop: espacos.sm,
    },
    saudacaoArea: { flex: 1 },
    saudacao: {
        fontSize: 24,
        fontWeight: '700',
        color: cores.preto,
        letterSpacing: -0.5,
    },
    subtitulo: { fontSize: 14, color: cores.cinzaTexto, marginTop: espacos.xs },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: raios.pilula,
        backgroundColor: cores.azul,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarPressionado: { transform: [{ scale: 0.94 }], opacity: 0.9 },
    sino: {
        width: 42,
        height: 42,
        borderRadius: raios.pilula,
        backgroundColor: cores.branco,
        borderWidth: 1,
        borderColor: cores.borda,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sinoSelo: {
        position: 'absolute',
        top: -3,
        right: -3,
        minWidth: 17,
        height: 17,
        borderRadius: 9,
        backgroundColor: cores.erro,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: cores.branco,
    },
    sinoSeloTexto: { color: cores.branco, fontSize: 9, fontWeight: '700' },
    suporte: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.md,
        backgroundColor: cores.branco,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: raios.medio,
        padding: espacos.md,
        marginTop: espacos.md,
    },
    suporteIcone: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: cores.sucessoClaro,
        alignItems: 'center',
        justifyContent: 'center',
    },
    suporteTexto: { flex: 1, gap: 2 },
    suporteTitulo: { fontSize: 13, fontWeight: '700', color: cores.preto },
    suporteDica: { fontSize: 11, color: cores.cinzaTexto },
    avatarLetra: { color: cores.branco, fontSize: 18, fontWeight: '700' },
    notificacao: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.md,
        backgroundColor: cores.azul,
        borderRadius: raios.medio,
        paddingVertical: espacos.md,
        paddingHorizontal: espacos.lg,
        marginTop: espacos.lg,
    },
    notificacaoPressionada: { opacity: 0.9 },
    notificacaoIcone: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificacaoTexto: { flex: 1, gap: 2 },
    notificacaoTitulo: { color: cores.branco, fontSize: 13, fontWeight: '700' },
    notificacaoDica: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 11 },
    acoes: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: espacos.lg,
        paddingVertical: espacos.lg,
        paddingHorizontal: espacos.sm,
    },
    acao: { flex: 1, alignItems: 'center', gap: espacos.sm },
    acaoPressionada: { opacity: 0.7, transform: [{ scale: 0.96 }] },
    acaoCirculo: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selo: {
        position: 'absolute',
        top: -2,
        right: '18%',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: cores.erro,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    seloTexto: { color: cores.branco, fontSize: 10, fontWeight: '700' },
    acaoRotulo: {
        fontSize: 11,
        fontWeight: '600',
        color: cores.grafite,
        textAlign: 'center',
    },
    linhaSecao: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: espacos.xl,
        marginBottom: espacos.md,
    },
    secao: { fontSize: 17, fontWeight: '700', color: cores.preto },
    contador: {
        fontSize: 12,
        fontWeight: '700',
        color: cores.azul,
        backgroundColor: cores.azulClaro,
        paddingHorizontal: 9,
        paddingVertical: 2,
        borderRadius: raios.pilula,
    },
    toqueCartao: { marginBottom: espacos.md },
    cartao: { padding: espacos.lg },
    linhaTitulo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: espacos.sm,
    },
    tituloCartao: { flex: 1, fontSize: 16, fontWeight: '700', color: cores.preto },
    descricao: { fontSize: 14, color: cores.cinzaTexto },
    linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
    linhaRodape: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: espacos.md,
    },
    valor: { fontSize: 18, fontWeight: '700', color: cores.azul },
    informacao: { fontSize: 12, color: cores.cinzaTexto, flexShrink: 1 },
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
    vazioTitulo: {
        fontSize: 15,
        fontWeight: '700',
        color: cores.preto,
        textAlign: 'center',
    },
    vazioTexto: {
        fontSize: 13,
        color: cores.cinzaTexto,
        textAlign: 'center',
        lineHeight: 19,
    },
    vazioAcao: { marginTop: espacos.md, alignItems: 'center' },
    rodape: { height: espacos.md },
});
