
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import Cabecalho from '../components/Cabecalho';
import Icone from '../components/Icone';
import Tela from '../components/Tela';
import { useAuth } from '../context/AuthContext';
import { buscarServico, enviarMensagem, listarMensagens } from '../services/api';
import { cores, espacos, raios, vidro } from '../theme/cores';

const INTERVALO_ATUALIZACAO = 5000;

function formatarHora(texto) {
    if (!texto) return '';
    const pedacos = String(texto).split('T');
    if (pedacos.length < 2) return '';
    return pedacos[1].substring(0, 5);
}

function nomeCompleto(pessoa) {
    if (!pessoa) return '';
    return ((pessoa.nome || '') + ' ' + (pessoa.sobrenome || '')).trim();
}

export default function TelaConversa() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const idDoServico = Number(id);

    const [servico, setServico] = useState(null);
    const [mensagens, setMensagens] = useState([]);
    const [texto, setTexto] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (!usuario) return;

        let telaAberta = true;

        buscarServico(idDoServico).then((dados) => {
            if (telaAberta) setServico(dados);
        });

        async function buscarMensagens() {
            try {
                const pagina = await listarMensagens(idDoServico);
                if (telaAberta) {
                    setMensagens(pagina?.conteudo ?? []);
                    setErro('');
                }
            } catch (e) {
                if (telaAberta) setErro(e.message);
            } finally {
                if (telaAberta) {
                    setCarregando(false);
                    setAtualizando(false);
                }
            }
        }

        function atualizarServico() {
            buscarServico(idDoServico)
                .then((dados) => {
                    if (telaAberta) setServico(dados);
                })
                .catch(() => {});
        }

        buscarMensagens();
        const relogio = setInterval(() => {
            buscarMensagens();
            atualizarServico();
        }, INTERVALO_ATUALIZACAO);

        return () => {
            telaAberta = false;
            clearInterval(relogio);
        };
    }, [usuario, idDoServico]);

    async function carregarMensagens() {
        try {
            const pagina = await listarMensagens(idDoServico);
            setMensagens(pagina?.conteudo ?? []);
        } catch (e) {
            setErro(e.message);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }

    async function aoEnviar() {
        const conteudo = texto.trim();

        if (encerrada) {
            setErro('Este chat está fechado porque o serviço já foi finalizado.');
            return;
        }

        if (!conteudo) {
            setErro('Escreva uma mensagem antes de enviar.');
            return;
        }

        setEnviando(true);

        try {
            await enviarMensagem(idDoServico, usuario.id, conteudo);
            setTexto('');
            await carregarMensagens();
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
                    <ActivityIndicator color={cores.azul} size="large" />
                </View>
            </Tela>
        );
    }

    if (!usuario) return <Redirect href="/login" />;

    const idDoContratante = servico?.contratante?.usuario?.id;
    const idDoContratado = servico?.contratado?.usuario?.id;

    const encerrada =
        servico?.status === 'CONCLUIDO' || servico?.status === 'CANCELADO';

    let nomeDaPessoa = 'Conversa';

    if (servico) {
        if (usuario.id === idDoContratante) {
            nomeDaPessoa = nomeCompleto(servico.contratado?.usuario) || 'Trabalhador';
        } else if (usuario.id === idDoContratado) {
            nomeDaPessoa = nomeCompleto(servico.contratante?.usuario) || 'Contratante';
        }
    }

    return (
        <Tela cor={cores.cinza}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.cabecalho}>
                    <Cabecalho
                        titulo={nomeDaPessoa}
                        subtitulo={
                            encerrada
                                ? (servico?.titulo || 'Serviço') + ' · encerrada'
                                : servico?.titulo || 'Serviço'
                        }
                        acao={
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Abrir detalhes do serviço"
                                onPress={() => router.push('/servico?id=' + idDoServico)}
                                hitSlop={8}
                            >
                                <Icone
                                    nome={
                                        encerrada
                                            ? 'lock-closed'
                                            : 'information-circle-outline'
                                    }
                                    tamanho={22}
                                    cor={encerrada ? cores.cinzaTexto : cores.azul}
                                />
                            </Pressable>
                        }
                    />
                </View>

                {encerrada ? (
                    <View style={styles.bannerFechado}>
                        <Icone nome="lock-closed" tamanho={15} cor={cores.cinzaTexto} />
                        <Text style={styles.bannerTexto}>
                            {servico?.status === 'CONCLUIDO'
                                ? 'Chat encerrado: o serviço foi finalizado. Você ainda pode ler o histórico.'
                                : 'Chat encerrado: o serviço foi cancelado. Você ainda pode ler o histórico.'}
                        </Text>
                    </View>
                ) : null}

                {carregando ? (
                    <View style={styles.centro}>
                        <ActivityIndicator color={cores.azul} size="large" />
                    </View>
                ) : (
                    <FlatList
                        style={styles.lista}
                        contentContainerStyle={styles.conteudoLista}
                        data={mensagens.slice().reverse()}
                        inverted={mensagens.length > 0}
                        keyExtractor={(item) => String(item.id)}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        refreshControl={
                            <RefreshControl
                                refreshing={atualizando}
                                onRefresh={() => {
                                    setAtualizando(true);
                                    carregarMensagens();
                                }}
                                tintColor={cores.azul}
                                colors={[cores.azul]}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.vazio}>
                                <Icone
                                    nome="chatbubble-ellipses-outline"
                                    tamanho={32}
                                    cor={cores.cinzaTexto}
                                />
                                <Text style={styles.textoVazio}>
                                    Nenhuma mensagem por aqui. Envie a primeira.
                                </Text>
                            </View>
                        }
                        renderItem={({ item }) => {
                            const souEu = item.remetente && item.remetente.id === usuario.id;

                            return (
                                <View
                                    accessibilityLabel={
                                        (souEu ? 'Você' : nomeDaPessoa) +
                                        ' disse: ' +
                                        item.conteudo
                                    }
                                    style={[
                                        styles.balao,
                                        souEu ? styles.balaoMeu : styles.balaoDeles,
                                    ]}
                                >
                                    <Text style={souEu ? styles.textoMeu : styles.textoDeles}>
                                        {item.conteudo}
                                    </Text>
                                    <Text style={[styles.hora, souEu ? styles.horaMeu : null]}>
                                        {formatarHora(item.dataEnvio)}
                                    </Text>
                                </View>
                            );
                        }}
                    />
                )}

                {encerrada ? (
                    <View style={styles.areaFechada}>
                        <Icone nome="lock-closed-outline" tamanho={18} cor={cores.cinzaTexto} />
                        <View style={styles.textoFechadoArea}>
                            <Text style={styles.tituloFechado}>Conversa encerrada</Text>
                            <Text style={styles.textoFechado}>
                                Não é possível enviar novas mensagens porque o serviço já foi
                                finalizado.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.areaEnviar}>
                        <TextInput
                            style={styles.campoMensagem}
                            value={texto}
                            onChangeText={setTexto}
                            placeholder="Escreva uma mensagem"
                            placeholderTextColor={cores.cinzaTexto}
                            multiline
                            maxLength={2000}
                        />

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Enviar mensagem"
                            accessibilityState={{ disabled: enviando || texto.trim().length === 0 }}
                            onPress={aoEnviar}
                            disabled={enviando || texto.trim().length === 0}
                            style={({ pressed }) => [
                                styles.botaoEnviar,
                                pressed ? styles.botaoEnviarPressionado : null,
                                enviando || texto.trim().length === 0
                                    ? styles.botaoEnviarDesabilitado
                                    : null,
                            ]}
                        >
                            {enviando ? (
                                <ActivityIndicator color={cores.branco} size="small" />
                            ) : (
                                <Icone nome="send" tamanho={20} cor={cores.branco} />
                            )}
                        </Pressable>
                    </View>
                )}
            </KeyboardAvoidingView>

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
    flex: { flex: 1 },
    cabecalho: { paddingHorizontal: espacos.lg, paddingTop: espacos.sm },
    lista: { flex: 1 },
    conteudoLista: { padding: espacos.lg, flexGrow: 1 },
    centro: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: espacos.xl,
    },
    vazio: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: espacos.sm,
        paddingHorizontal: espacos.xl,
    },
    textoVazio: { color: cores.cinzaTexto, textAlign: 'center', fontSize: 14 },
    balao: {
        borderRadius: raios.medio,
        paddingHorizontal: espacos.md,
        paddingVertical: espacos.sm,
        marginBottom: espacos.sm,
        maxWidth: '85%',
    },
    balaoMeu: {
        backgroundColor: cores.azul,
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    balaoDeles: {
        backgroundColor: vidro.claro,
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: vidro.bordaClara,
    },
    textoMeu: { color: cores.branco, fontSize: 14, lineHeight: 20 },
    textoDeles: { color: cores.preto, fontSize: 14, lineHeight: 20 },
    hora: { fontSize: 10, color: cores.cinzaTexto, marginTop: espacos.xs, textAlign: 'right' },
    horaMeu: { color: 'rgba(255, 255, 255, 0.75)' },
    bannerFechado: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.sm,
        marginHorizontal: espacos.lg,
        marginTop: espacos.md,
        backgroundColor: '#ececf2',
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: raios.medio,
        padding: espacos.md,
    },
    bannerTexto: { flex: 1, fontSize: 12, color: cores.cinzaTexto, lineHeight: 17 },
    areaFechada: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.md,
        padding: espacos.lg,
        backgroundColor: '#f1f1f5',
        borderTopWidth: 1,
        borderTopColor: cores.borda,
    },
    textoFechadoArea: { flex: 1, gap: 2 },
    tituloFechado: { fontSize: 13, fontWeight: '700', color: cores.grafite },
    textoFechado: { fontSize: 12, color: cores.cinzaTexto, lineHeight: 17 },
    areaEnviar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: espacos.sm,
        padding: espacos.md,
        backgroundColor: cores.branco,
        borderTopWidth: 1,
        borderTopColor: cores.borda,
    },
    campoMensagem: {
        flex: 1,
        minHeight: 44,
        maxHeight: 110,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: raios.medio,
        paddingHorizontal: espacos.md,
        paddingTop: espacos.md,
        fontSize: 14,
        color: cores.preto,
        backgroundColor: cores.branco,
    },
    botaoEnviar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: cores.azul,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botaoEnviarPressionado: { transform: [{ scale: 0.94 }], opacity: 0.9 },
    botaoEnviarDesabilitado: { backgroundColor: cores.borda },
});
