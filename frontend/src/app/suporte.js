import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import Botao from '../components/Botao';
import Cabecalho from '../components/Cabecalho';
import CampoTexto from '../components/CampoTexto';
import Icone from '../components/Icone';
import Seletor from '../components/Seletor';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import { buscarServico, criarReporte, listarMeusReportes } from '../services/api';
import { cores, espacos, raios } from '../theme/cores';
import { formatarData } from '../utils/formato';

const ASSUNTOS = [
    { valor: 'PROBLEMA_NO_SERVICO', rotulo: 'Problema com um serviço' },
    { valor: 'PROBLEMA_NO_CHAT', rotulo: 'Problema na conversa' },
    { valor: 'PAGAMENTO', rotulo: 'Pagamento ou cobrança' },
    { valor: 'COMPORTAMENTO', rotulo: 'Comportamento inadequado' },
    { valor: 'CONTA', rotulo: 'Problema com a minha conta' },
    { valor: 'OUTRO', rotulo: 'Outro assunto' },
];

const NOMES_STATUS = {
    ABERTO: 'Aberto',
    EM_ANALISE: 'Em análise',
    RESOLVIDO: 'Resolvido',
};

export default function TelaSuporte() {
    const router = useRouter();
    const { servicoId } = useLocalSearchParams();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const [assunto, setAssunto] = useState('PROBLEMA_NO_SERVICO');
    const [descricao, setDescricao] = useState('');
    const [servico, setServico] = useState(null);
    const [reportes, setReportes] = useState([]);
    const [enviando, setEnviando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [recado, setRecado] = useState('');

    useEffect(() => {
        if (!usuario) return;
        carregar();
    }, [usuario]);

    async function carregar() {
        try {
            const lista = await listarMeusReportes();
            setReportes(lista ?? []);

            if (servicoId) {
                try {
                    setServico(await buscarServico(Number(servicoId)));
                } catch {
                    setServico(null);
                }
            }
        } catch (e) {
            setErro(e.message);
        } finally {
            setCarregando(false);
        }
    }

    async function enviar() {
        setErro('');
        setRecado('');

        if (!assunto) {
            setErro('Escolha o assunto da solicitação.');
            return;
        }

        if (descricao.trim().length < 10) {
            setErro('Descreva o problema com pelo menos 10 caracteres.');
            return;
        }

        setEnviando(true);

        try {
            await criarReporte({
                assunto,
                descricao: descricao.trim(),
                servicoId: servico?.id ?? null,
            });

            setDescricao('');
            setRecado('Solicitação enviada. A equipe administrativa vai analisar e responder.');
            await carregar();
        } catch (e) {
            setErro(e.message);
        } finally {
            setEnviando(false);
        }
    }

    if (carregandoSessao) {
        return (
            <Tela>
                <View style={styles.centro}>
                    <Text style={styles.textoVazio}>Carregando...</Text>
                </View>
            </Tela>
        );
    }

    if (!usuario) return <Redirect href="/login" />;

    return (
        <Tela>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.conteudo}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Cabecalho
                        titulo="Ajuda e suporte"
                        subtitulo="Fale com a equipe administrativa"
                    />

                    <Vidro style={styles.destaque}>
                        <View style={styles.destaqueIcone}>
                            <Icone nome="headset-outline" tamanho={22} cor={cores.azul} />
                        </View>
                        <View style={styles.destaqueTexto}>
                            <Text style={styles.destaqueTitulo}>Reportar um problema</Text>
                            <Text style={styles.informacao}>
                                Conte o que aconteceu. A sua solicitação vai direto para a área
                                administrativa e você recebe a resposta aqui e nas notificações.
                            </Text>
                        </View>
                    </Vidro>

                    {servico ? (
                        <Vidro style={styles.servico}>
                            <Icone nome="briefcase-outline" tamanho={16} cor={cores.azul} />
                            <View style={styles.servicoTexto}>
                                <Text style={styles.servicoRotulo}>Serviço relacionado</Text>
                                <Text style={styles.servicoTitulo} numberOfLines={1}>
                                    {servico.titulo}
                                </Text>
                            </View>
                        </Vidro>
                    ) : null}

                    <Vidro style={styles.formulario}>
                        <Seletor
                            label="Assunto"
                            valor={assunto}
                            opcoes={ASSUNTOS}
                            onChange={setAssunto}
                            placeholder="Escolha o assunto"
                        />

                        <CampoTexto
                            label="Descrição"
                            valor={descricao}
                            onChange={setDescricao}
                            placeholder="Descreva o problema com o máximo de detalhes"
                            multiline
                            maxLength={2000}
                            autoCapitalize="sentences"
                        />

                        <Text style={styles.dica}>
                            {descricao.length}/2000 caracteres
                        </Text>

                        <Botao
                            titulo="Enviar para o suporte"
                            icone="send-outline"
                            carregando={enviando}
                            onPress={enviar}
                        />
                    </Vidro>

                    <View style={styles.linhaSecao}>
                        <Text style={styles.secao}>Minhas solicitações</Text>
                        {reportes.length > 0 ? (
                            <Text style={styles.contador}>{reportes.length}</Text>
                        ) : null}
                    </View>

                    {carregando ? (
                        <Text style={styles.textoVazio}>Carregando solicitações...</Text>
                    ) : reportes.length === 0 ? (
                        <Vidro style={styles.vazio}>
                            <Icone nome="chatbox-outline" tamanho={26} cor={cores.cinzaTexto} />
                            <Text style={styles.textoVazio}>
                                Você ainda não enviou nenhuma solicitação.
                            </Text>
                        </Vidro>
                    ) : (
                        reportes.map((item) => {
                            const resolvido = item.status === 'RESOLVIDO';

                            return (
                                <Vidro key={item.id} style={styles.cartaoReporte}>
                                    <View style={styles.linhaTopo}>
                                        <Text style={styles.assunto} numberOfLines={2}>
                                            {ASSUNTOS.find((a) => a.valor === item.assunto)?.rotulo ||
                                                item.assunto}
                                        </Text>
                                        <View
                                            style={[
                                                styles.etiqueta,
                                                resolvido
                                                    ? styles.etiquetaResolvido
                                                    : styles.etiquetaAberto,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.etiquetaTexto,
                                                    resolvido
                                                        ? styles.etiquetaTextoResolvido
                                                        : styles.etiquetaTextoAberto,
                                                ]}
                                            >
                                                {NOMES_STATUS[item.status] || item.status}
                                            </Text>
                                        </View>
                                    </View>

                                    {item.servico?.titulo ? (
                                        <Text style={styles.servicoReferencia} numberOfLines={1}>
                                            Serviço: {item.servico.titulo}
                                        </Text>
                                    ) : null}

                                    <Text style={styles.descricao}>{item.descricao}</Text>

                                    {item.resposta ? (
                                        <View style={styles.resposta}>
                                            <View style={styles.linhaResposta}>
                                                <Icone
                                                    nome="shield-checkmark-outline"
                                                    tamanho={14}
                                                    cor={cores.sucesso}
                                                />
                                                <Text style={styles.respostaTitulo}>
                                                    Resposta da administração
                                                </Text>
                                            </View>
                                            <Text style={styles.respostaTexto}>{item.resposta}</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.aguardando}>
                                            Aguardando análise da equipe administrativa.
                                        </Text>
                                    )}

                                    <Text style={styles.data}>
                                        Enviado em {formatarData(item.criadoEm)}
                                    </Text>
                                </Vidro>
                            );
                        })
                    )}

                    <Botao
                        titulo="Voltar para o início"
                        variante="claro"
                        onPress={() => router.replace('/home')}
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            <Aviso
                visivel={Boolean(erro)}
                mensagem={erro}
                tipo="erro"
                aoFechar={() => setErro('')}
            />
            <Aviso
                visivel={Boolean(recado)}
                mensagem={recado}
                tipo="sucesso"
                aoFechar={() => setRecado('')}
            />
        </Tela>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    conteudo: { padding: espacos.lg, paddingBottom: espacos.xl, gap: espacos.md },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    textoVazio: { fontSize: 13, color: cores.cinzaTexto, textAlign: 'center' },
    destaque: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.md,
        padding: espacos.lg,
        backgroundColor: cores.azulClaro,
        borderColor: cores.azulClaro,
    },
    destaqueIcone: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: cores.branco,
        alignItems: 'center',
        justifyContent: 'center',
    },
    destaqueTexto: { flex: 1, gap: 3 },
    destaqueTitulo: { fontSize: 15, fontWeight: '700', color: cores.preto },
    informacao: { fontSize: 12, color: cores.cinzaTexto, lineHeight: 18 },
    servico: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.sm,
        padding: espacos.md,
    },
    servicoTexto: { flex: 1, gap: 1 },
    servicoRotulo: { fontSize: 10, color: cores.cinzaTexto, fontWeight: '600' },
    servicoTitulo: { fontSize: 13, fontWeight: '700', color: cores.preto },
    formulario: { padding: espacos.lg, gap: espacos.md },
    dica: { fontSize: 11, color: cores.cinzaTexto, textAlign: 'right' },
    linhaSecao: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: espacos.sm,
    },
    secao: { fontSize: 16, fontWeight: '700', color: cores.preto },
    contador: {
        fontSize: 11,
        fontWeight: '700',
        color: cores.azul,
        backgroundColor: cores.azulClaro,
        paddingHorizontal: 9,
        paddingVertical: 2,
        borderRadius: raios.pilula,
    },
    vazio: { alignItems: 'center', gap: espacos.sm, padding: espacos.xl },
    cartaoReporte: { padding: espacos.lg, gap: espacos.sm },
    linhaTopo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: espacos.sm,
    },
    assunto: { flex: 1, fontSize: 14, fontWeight: '700', color: cores.preto },
    etiqueta: {
        borderRadius: raios.pilula,
        paddingHorizontal: 9,
        paddingVertical: 3,
    },
    etiquetaAberto: { backgroundColor: cores.alertaClaro },
    etiquetaResolvido: { backgroundColor: cores.sucessoClaro },
    etiquetaTexto: { fontSize: 10, fontWeight: '700' },
    etiquetaTextoAberto: { color: cores.alerta },
    etiquetaTextoResolvido: { color: cores.sucesso },
    servicoReferencia: { fontSize: 11, color: cores.azul, fontWeight: '600' },
    descricao: { fontSize: 13, color: cores.grafite, lineHeight: 19 },
    resposta: {
        backgroundColor: cores.sucessoClaro,
        borderRadius: raios.pequeno,
        padding: espacos.md,
        gap: 4,
    },
    linhaResposta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    respostaTitulo: { fontSize: 11, fontWeight: '700', color: cores.sucesso },
    respostaTexto: { fontSize: 13, color: cores.grafite, lineHeight: 19 },
    aguardando: { fontSize: 12, color: cores.alerta, fontStyle: 'italic' },
    data: { fontSize: 11, color: cores.cinzaTexto },
});
