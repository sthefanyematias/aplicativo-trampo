import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import Botao from '../components/Botao';
import Cabecalho from '../components/Cabecalho';
import EtiquetaStatus from '../components/EtiquetaStatus';
import Icone from '../components/Icone';
import ModalAvaliacao from '../components/ModalAvaliacao';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import {
    aceitarCandidatura,
    buscarContratado,
    buscarContratante,
    buscarMinhaAvaliacao,
    buscarServico,
    cancelarServico,
    candidatar,
    listarCandidaturasDoContratado,
    listarCandidaturasPorServico,
    listarMensagens,
} from '../services/api';
import { cores, espacos, raios } from '../theme/cores';
import { formatarDinheiro, formatarHora, formatarQuando, primeiroNome } from '../utils/formato';

function Estrelas({ nota }) {
    const cheias = Math.round(Number(nota) || 0);

    return (
        <View style={styles.linhaEstrelas}>
            {[1, 2, 3, 4, 5].map((numero) => (
                <Icone
                    key={numero}
                    nome={numero <= cheias ? 'star' : 'star-outline'}
                    tamanho={13}
                    cor={numero <= cheias ? cores.amareloEscuro : cores.borda}
                />
            ))}
        </View>
    );
}

export default function TelaServico() {
    const router = useRouter();
    const { id, novo } = useLocalSearchParams();
    const { usuario, carregando: carregandoSessao, contratadoId } = useAuth();

    const [servico, setServico] = useState(null);
    const [candidaturas, setCandidaturas] = useState([]);
    const [minhaCandidatura, setMinhaCandidatura] = useState(null);
    const [bioTrabalhador, setBioTrabalhador] = useState(null);
    const [bioContratante, setBioContratante] = useState(null);
    const [conversa, setConversa] = useState({ total: 0, ultima: null });
    const [minhaAvaliacao, setMinhaAvaliacao] = useState(null);
    const [modalAvaliacao, setModalAvaliacao] = useState(false);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [recado, setRecado] = useState('');
    const [publicado, setPublicado] = useState(Boolean(novo));
    const [acaoEmAndamento, setAcaoEmAndamento] = useState('');

    const idDoServico = Number(id);
    const abriuAvaliacao = useRef(false);

    useEffect(() => {
        if (usuario) {
            carregarServico();
        }
    }, [id, usuario]);

    async function carregarServico() {
        setCarregando(true);

        try {
            const dados = await buscarServico(idDoServico);
            setServico(dados);

            const idDoContratante = dados.contratante?.usuario?.id;
            const idDoContratado = dados.contratado?.usuario?.id;

            const souEuQuePubliquei = idDoContratante === usuario.id;
            const souEuQueTrabalho = idDoContratado === usuario.id;
            const participo = souEuQuePubliquei || souEuQueTrabalho;

            if (souEuQuePubliquei && dados.status === 'ABERTO') {
                const pagina = await listarCandidaturasPorServico(idDoServico);
                setCandidaturas(pagina?.conteudo ?? []);
            } else {
                setCandidaturas([]);
            }

            if (dados.contratado?.id) {
                buscarContratado(dados.contratado.id)
                    .then(setBioTrabalhador)
                    .catch(() => setBioTrabalhador(null));
            } else {
                setBioTrabalhador(null);
            }

            if (dados.contratante?.id) {
                buscarContratante(dados.contratante.id)
                    .then(setBioContratante)
                    .catch(() => setBioContratante(null));
            } else {
                setBioContratante(null);
            }

            if (participo) {
                const mensagens = await listarMensagens(idDoServico, { pagina: 0, tamanho: 100 });
                const conteudo = mensagens?.conteudo ?? [];

                setConversa({
                    total: Number(mensagens?.total ?? conteudo.length),
                    ultima: conteudo.length > 0 ? conteudo[conteudo.length - 1] : null,
                });
            } else {
                setConversa({ total: 0, ultima: null });
            }

            if (participo && dados.status === 'CONCLUIDO') {
                let avaliacao = null;
                try {
                    avaliacao = await buscarMinhaAvaliacao(idDoServico);
                } catch {
                    avaliacao = null;
                }
                setMinhaAvaliacao(avaliacao || null);

                if (!avaliacao && !abriuAvaliacao.current) {
                    abriuAvaliacao.current = true;
                    setModalAvaliacao(true);
                }
            } else {
                setMinhaAvaliacao(null);
            }

            if (!souEuQuePubliquei && contratadoId) {
                const minhas = await listarCandidaturasDoContratado(contratadoId, {
                    pagina: 0,
                    tamanho: 100,
                });

                const encontrada = (minhas?.conteudo ?? []).find(
                    (item) => item.servico && item.servico.id === idDoServico
                );

                setMinhaCandidatura(encontrada || null);
            } else {
                setMinhaCandidatura(null);
            }
        } catch (e) {
            setErro(e.message);
        } finally {
            setCarregando(false);
        }
    }

    async function aoCandidatar() {
        setErro('');
        setRecado('');

        if (!contratadoId) {
            setErro('Perfil de trabalhador não encontrado.');
            return;
        }

        setAcaoEmAndamento('candidatar');

        try {
            const criada = await candidatar(idDoServico, contratadoId);
            setMinhaCandidatura(criada || { status: 'PENDENTE' });
            setRecado('Candidatura enviada. Aguarde o retorno do contratante.');
        } catch (e) {
            if (e.status === 409) {
                setRecado('Você já enviou candidatura para esta vaga.');
                await carregarServico();
            } else {
                setErro(e.message);
            }
        } finally {
            setAcaoEmAndamento('');
        }
    }

    async function aoAceitar(idDaCandidatura) {
        setErro('');
        setRecado('');
        setAcaoEmAndamento('aceitar-' + idDaCandidatura);

        try {
            await aceitarCandidatura(idDaCandidatura);
            setRecado('Candidatura aceita. O serviço está em andamento.');
            await carregarServico();
        } catch (e) {
            setErro(e.message);
        } finally {
            setAcaoEmAndamento('');
        }
    }

    async function aoCancelar() {
        setErro('');
        setRecado('');
        setAcaoEmAndamento('cancelar');

        try {
            await cancelarServico(idDoServico);
            setRecado('Serviço cancelado.');
            await carregarServico();
        } catch (e) {
            setErro(e.message);
        } finally {
            setAcaoEmAndamento('');
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

    if (carregando) {
        return (
            <Tela>
                <View style={styles.centro}>
                    <ActivityIndicator color={cores.azul} size="large" />
                    <Text style={styles.textoCarregando}>Carregando serviço...</Text>
                </View>
            </Tela>
        );
    }

    if (!servico) {
        return (
            <Tela>
                <View style={styles.centro}>
                    <Text style={styles.textoVazio}>{erro || 'Serviço não encontrado.'}</Text>
                    <Botao titulo="Voltar" variante="claro" onPress={() => router.back()} />
                </View>
            </Tela>
        );
    }

    const idDoContratante = servico.contratante?.usuario?.id;
    const idDoContratado = servico.contratado?.usuario?.id;

    const souContratante = idDoContratante === usuario.id;
    const souContratado = idDoContratado === usuario.id;
    const participei = souContratante || souContratado;

    const estaAberto = servico.status === 'ABERTO';
    const estaEmAndamento = servico.status === 'EM_ANDAMENTO';
    const encerrado = servico.status === 'CONCLUIDO' || servico.status === 'CANCELADO';
    const jaCandidatou = Boolean(minhaCandidatura);
    const temConversa = conversa.total > 0;

    return (
        <Tela>
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.conteudo}
                showsVerticalScrollIndicator={false}
            >
                <Cabecalho titulo="Detalhes do serviço" subtitulo={servico.titulo} />

                <Vidro style={styles.cartao}>
                    <View style={styles.linhaTitulo}>
                        <Text style={styles.titulo}>{servico.titulo}</Text>
                        <EtiquetaStatus status={servico.status} />
                    </View>

                    <Text style={styles.valor}>{formatarDinheiro(servico.valor)}</Text>

                    <View style={styles.linhaInfo}>
                        <Icone nome="calendar-outline" tamanho={15} cor={cores.cinzaTexto} />
                        <Text style={styles.informacao}>
                            {formatarQuando(
                                servico.dataServico,
                                servico.horaInicio,
                                servico.horaFim,
                                servico.periodo
                            )}
                        </Text>
                    </View>

                    {servico.endereco ? (
                        <View style={styles.linhaInfo}>
                            <Icone nome="location-outline" tamanho={15} cor={cores.cinzaTexto} />
                            <Text style={styles.informacao}>{servico.endereco}</Text>
                        </View>
                    ) : null}

                    {servico.descricao ? (
                        <>
                            <View style={styles.divisor} />
                            <Text style={styles.descricao}>{servico.descricao}</Text>
                        </>
                    ) : null}
                </Vidro>

                {participei ? (
                    <Vidro style={[styles.cartao, encerrado ? styles.cartaoEncerrado : null]}>
                        <View style={styles.linhaTitulo}>
                            <View style={styles.linhaTituloConversa}>
                                <Text style={styles.subtitulo}>Conversa</Text>
                                {encerrado ? (
                                    <View style={styles.seloFechado}>
                                        <Icone
                                            nome="lock-closed"
                                            tamanho={11}
                                            cor={cores.cinzaTexto}
                                        />
                                        <Text style={styles.seloFechadoTexto}>Encerrada</Text>
                                    </View>
                                ) : null}
                            </View>

                            {temConversa && !encerrado ? (
                                <View style={styles.selo}>
                                    <Text style={styles.seloTexto}>
                                        {conversa.total}{' '}
                                        {conversa.total === 1 ? 'mensagem' : 'mensagens'}
                                    </Text>
                                </View>
                            ) : null}
                        </View>

                        {temConversa ? (
                            <>
                                <Text style={styles.informacao} numberOfLines={2}>
                                    {conversa.ultima?.conteudo}
                                </Text>
                                <View style={styles.linhaInfo}>
                                    <Icone nome="time-outline" tamanho={13} cor={cores.cinzaTexto} />
                                    <Text style={styles.informacao}>
                                        {formatarHora(conversa.ultima?.dataEnvio)}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <Text style={styles.informacao}>
                                {encerrado
                                    ? 'Nenhuma mensagem foi trocada neste serviço.'
                                    : 'Nenhuma mensagem ainda. Abra a conversa para combinar os detalhes.'}
                            </Text>
                        )}

                        {encerrado ? (
                            <Text style={styles.avisoFechado}>
                                {servico.status === 'CONCLUIDO'
                                    ? 'Este chat está fechado porque o serviço foi finalizado. O histórico continua disponível para leitura.'
                                    : 'Este chat está fechado porque o serviço foi cancelado. O histórico continua disponível para leitura.'}
                            </Text>
                        ) : null}

                        <Botao
                            titulo={
                                encerrado
                                    ? 'Ver histórico da conversa'
                                    : temConversa
                                      ? 'Continuar conversa'
                                      : 'Abrir conversa'
                            }
                            icone={encerrado ? 'lock-closed-outline' : 'chatbubble-ellipses-outline'}
                            variante={encerrado ? 'claro' : temConversa ? 'azul' : 'claro'}
                            onPress={() => router.push('/conversa?id=' + idDoServico)}
                        />
                    </Vidro>
                ) : null}

                {estaAberto && !souContratante && usuario.tipo === 'CONTRATADO' ? (
                    <Vidro style={styles.cartao}>
                        <Text style={styles.subtitulo}>Candidatura</Text>

                        {jaCandidatou ? (
                            <View
                                accessibilityLabel="Candidatura já enviada"
                                style={styles.candidaturaEnviada}
                            >
                                <Icone nome="checkmark-circle" tamanho={20} cor={cores.sucesso} />
                                <View style={styles.candidaturaTexto}>
                                    <Text style={styles.candidaturaTitulo}>
                                        Candidatura enviada
                                    </Text>
                                    <Text style={styles.candidaturaDica}>
                                        Aguarde o retorno do contratante
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.informacao}>
                                    Envie a sua candidatura. O contratante escolhe quem vai
                                    executar.
                                </Text>
                                <Botao
                                    titulo="Enviar candidatura"
                                    icone="send-outline"
                                    carregando={acaoEmAndamento === 'candidatar'}
                                    onPress={aoCandidatar}
                                />
                            </>
                        )}
                    </Vidro>
                ) : null}

                {estaAberto && souContratante ? (
                    <Vidro style={styles.cartao}>
                        <Text style={styles.subtitulo}>
                            Candidaturas recebidas ({candidaturas.length})
                        </Text>

                        {candidaturas.length === 0 ? (
                            <Text style={styles.informacao}>
                                Nenhuma candidatura recebida até o momento.
                            </Text>
                        ) : (
                            candidaturas.map((candidatura) => (
                                <View key={candidatura.id} style={styles.candidatura}>
                                    <View style={styles.avatarCandidato}>
                                        <Text style={styles.avatarLetra}>
                                            {String(candidatura.contratado?.usuario?.nome || 'T')
                                                .charAt(0)
                                                .toUpperCase()}
                                        </Text>
                                    </View>

                                    <View style={styles.areaTexto}>
                                        <Text style={styles.nomeTrabalhador}>
                                            {primeiroNome(candidatura.contratado?.usuario?.nome) ||
                                                'Trabalhador'}
                                        </Text>
                                        <Text style={styles.informacao} numberOfLines={2}>
                                            {candidatura.contratado?.servicos || 'Sem descrição'}
                                        </Text>
                                        <EtiquetaStatus status={candidatura.status} />
                                    </View>

                                    {candidatura.status === 'PENDENTE' ? (
                                        <Botao
                                            titulo="Aceitar"
                                            compacto
                                            carregando={
                                                acaoEmAndamento === 'aceitar-' + candidatura.id
                                            }
                                            onPress={() => aoAceitar(candidatura.id)}
                                        />
                                    ) : null}
                                </View>
                            ))
                        )}
                    </Vidro>
                ) : null}

                {estaEmAndamento && participei ? (
                    <Vidro style={styles.cartao}>
                        <Text style={styles.subtitulo}>Serviço em andamento</Text>
                        <Text style={styles.informacao}>
                            Combine os detalhes pelo chat e finalize quando o trabalho terminar.
                        </Text>

                        <Botao
                            titulo="Finalizar serviço"
                            icone="checkmark-circle-outline"
                            variante="amarelo"
                            onPress={() => router.push('/finalizar?id=' + idDoServico)}
                        />
                    </Vidro>
                ) : null}

                {servico.status === 'CONCLUIDO' && participei ? (
                    <Vidro style={styles.cartao}>
                        <View style={styles.linhaTitulo}>
                            <Text style={styles.subtitulo}>
                                {souContratante ? 'Avaliar trabalhador' : 'Avaliar contratante'}
                            </Text>
                            <EtiquetaStatus status={servico.status} />
                        </View>

                        {minhaAvaliacao ? (
                            <>
                                <Text style={styles.informacao}>
                                    Você avaliou{' '}
                                    {souContratante
                                        ? primeiroNome(servico.contratado?.usuario?.nome) ||
                                          'o trabalhador'
                                        : primeiroNome(servico.contratante?.usuario?.nome) ||
                                          'o contratante'}
                                    . A avaliação é definitiva.
                                </Text>

                                <View style={styles.avaliacaoFixada}>
                                    <Estrelas nota={minhaAvaliacao.nota} />
                                    <Text style={styles.notaFixa}>
                                        {minhaAvaliacao.nota} de 5
                                    </Text>
                                </View>

                                {minhaAvaliacao.comentario ? (
                                    <Text style={styles.descricao}>
                                        {minhaAvaliacao.comentario}
                                    </Text>
                                ) : (
                                    <Text style={styles.informacao}>Sem comentário.</Text>
                                )}

                                <View style={styles.bloqueio}>
                                    <Icone
                                        nome="lock-closed-outline"
                                        tamanho={14}
                                        cor={cores.cinzaTexto}
                                    />
                                    <Text style={styles.bloqueioTexto}>
                                        Avaliação enviada. Não é possível editar ou excluir.
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <>
                                <Text style={styles.informacao}>
                                    {souContratante
                                        ? 'Avalie quem executou este serviço.'
                                        : 'Avalie o contratante deste serviço.'}{' '}
                                    As duas partes são avaliadas.
                                </Text>

                                <Botao
                                    titulo={
                                        souContratante
                                            ? 'Avaliar trabalhador'
                                            : 'Avaliar contratante'
                                    }
                                    icone="star-outline"
                                    variante="amarelo"
                                    onPress={() => setModalAvaliacao(true)}
                                />
                            </>
                        )}
                    </Vidro>
                ) : null}

                {participei ? (
                    <Vidro style={styles.cartao}>
                        <Text style={styles.subtitulo}>Precisa de ajuda?</Text>
                        <Text style={styles.informacao}>
                            Encontrou um problema com este serviço, com o pagamento ou com o
                            comportamento de alguém? Envie para a equipe administrativa.
                        </Text>

                        <Botao
                            titulo="Reportar um problema"
                            icone="flag-outline"
                            variante="claro"
                            onPress={() => router.push('/suporte?servicoId=' + idDoServico)}
                        />
                    </Vidro>
                ) : null}

                {bioTrabalhador ? (
                    <Vidro style={styles.cartao}>
                        <Text style={styles.subtitulo}>Sobre o trabalhador</Text>

                        <View style={styles.linhaBio}>
                            <View style={styles.avatarCandidato}>
                                <Text style={styles.avatarLetra}>
                                    {String(bioTrabalhador.nome || 'T').charAt(0).toUpperCase()}
                                </Text>
                            </View>

                            <View style={styles.areaTexto}>
                                <Text style={styles.nomeTrabalhador}>
                                    {(bioTrabalhador.nome || '') +
                                        ' ' +
                                        (bioTrabalhador.sobrenome || '')}
                                </Text>
                                <Estrelas nota={bioTrabalhador.mediaAvaliacao} />
                            </View>
                        </View>

                        {bioTrabalhador.servicos ? (
                            <Text style={styles.informacao}>{bioTrabalhador.servicos}</Text>
                        ) : null}

                        {bioTrabalhador.descricao ? (
                            <Text style={styles.descricao}>{bioTrabalhador.descricao}</Text>
                        ) : null}

                        {bioTrabalhador.disponibilidade ? (
                            <View style={styles.linhaInfo}>
                                <Icone nome="time-outline" tamanho={14} cor={cores.cinzaTexto} />
                                <Text style={styles.informacao}>
                                    {bioTrabalhador.disponibilidade}
                                </Text>
                            </View>
                        ) : null}

                        {bioTrabalhador.cidade ? (
                            <View style={styles.linhaInfo}>
                                <Icone
                                    nome="location-outline"
                                    tamanho={14}
                                    cor={cores.cinzaTexto}
                                />
                                <Text style={styles.informacao}>
                                    {bioTrabalhador.cidade}/{bioTrabalhador.uf}
                                </Text>
                            </View>
                        ) : null}
                    </Vidro>
                ) : null}

                {bioContratante && !souContratante ? (
                    <Vidro style={styles.cartao}>
                        <Text style={styles.subtitulo}>Sobre o contratante</Text>

                        <Text style={styles.nomeTrabalhador}>
                            {(bioContratante.nome || '') + ' ' + (bioContratante.sobrenome || '')}
                        </Text>

                        <View style={styles.linhaInfo}>
                            <Icone nome="person-outline" tamanho={14} cor={cores.cinzaTexto} />
                            <Text style={styles.informacao}>
                                {bioContratante.tipoPessoa === 'PESSOA_JURIDICA'
                                    ? 'Pessoa jurídica'
                                    : 'Pessoa física'}
                            </Text>
                        </View>

                        {bioContratante.cidade ? (
                            <View style={styles.linhaInfo}>
                                <Icone
                                    nome="location-outline"
                                    tamanho={14}
                                    cor={cores.cinzaTexto}
                                />
                                <Text style={styles.informacao}>
                                    {bioContratante.cidade}/{bioContratante.uf}
                                </Text>
                            </View>
                        ) : null}
                    </Vidro>
                ) : null}

                {souContratante &&
                servico.status !== 'CONCLUIDO' &&
                servico.status !== 'CANCELADO' ? (
                    <Vidro style={styles.cartao}>
                        <Botao
                            titulo="Cancelar serviço"
                            icone="close-circle-outline"
                            variante="perigo"
                            carregando={acaoEmAndamento === 'cancelar'}
                            onPress={aoCancelar}
                        />
                    </Vidro>
                ) : null}

                <View style={styles.espaco} />
            </ScrollView>

            <ModalAvaliacao
                visivel={modalAvaliacao}
                servico={servico}
                onFechar={() => setModalAvaliacao(false)}
                onAvaliada={(avaliacao) => {
                    setMinhaAvaliacao(avaliacao || { nota: 0 });
                    setModalAvaliacao(false);
                }}
            />

            <Aviso
                visivel={publicado && !erro}
                titulo="Serviço publicado"
                mensagem="O anúncio está no ar e já pode receber candidaturas."
                tipo="sucesso"
                aoFechar={() => setPublicado(false)}
            />

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
    conteudo: { padding: espacos.lg, paddingBottom: espacos.xxl },
    centro: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: espacos.xl,
        gap: espacos.md,
    },
    textoCarregando: { color: cores.cinzaTexto, fontSize: 14 },
    textoVazio: { color: cores.cinzaTexto, fontSize: 14, textAlign: 'center' },
    cartao: { padding: espacos.lg, marginBottom: espacos.md, gap: espacos.sm },
    cartaoEncerrado: { backgroundColor: '#f7f7fa', borderColor: cores.borda },
    linhaTitulo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: espacos.sm,
    },
    linhaTituloConversa: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm },
    titulo: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: cores.preto,
        letterSpacing: -0.3,
    },
    subtitulo: { fontSize: 15, fontWeight: '700', color: cores.preto },
    valor: { fontSize: 22, fontWeight: '700', color: cores.azul },
    linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    informacao: { fontSize: 13, color: cores.cinzaTexto, flexShrink: 1, lineHeight: 19 },
    divisor: { height: 1, backgroundColor: cores.borda, marginVertical: espacos.sm },
    descricao: { fontSize: 15, color: cores.grafite, lineHeight: 21 },
    selo: {
        backgroundColor: cores.azulClaro,
        borderRadius: raios.pilula,
        paddingHorizontal: 9,
        paddingVertical: 3,
    },
    seloTexto: { fontSize: 11, fontWeight: '700', color: cores.azul },
    seloFechado: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: cores.borda,
        borderRadius: raios.pilula,
        paddingHorizontal: 9,
        paddingVertical: 3,
    },
    seloFechadoTexto: { fontSize: 11, fontWeight: '700', color: cores.cinzaTexto },
    avisoFechado: {
        fontSize: 12,
        color: cores.cinzaTexto,
        backgroundColor: cores.branco,
        borderRadius: raios.pequeno,
        padding: espacos.md,
        lineHeight: 18,
    },
    candidaturaEnviada: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.sm,
        backgroundColor: cores.sucessoClaro,
        borderWidth: 1,
        borderColor: cores.sucesso,
        borderRadius: raios.medio,
        padding: espacos.md,
    },
    candidaturaTexto: { flex: 1, gap: 2 },
    candidaturaTitulo: { fontSize: 14, fontWeight: '700', color: cores.sucesso },
    candidaturaDica: { fontSize: 12, color: cores.sucesso },
    candidatura: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: raios.pequeno,
        padding: espacos.md,
        marginTop: espacos.sm,
        gap: espacos.sm,
    },
    areaTexto: { flex: 1, gap: 4 },
    linhaBio: { flexDirection: 'row', alignItems: 'center', gap: espacos.md },
    avatarCandidato: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: cores.azulClaro,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLetra: { color: cores.azul, fontSize: 15, fontWeight: '700' },
    nomeTrabalhador: { fontSize: 15, fontWeight: '700', color: cores.preto },
    linhaEstrelas: { flexDirection: 'row', gap: 2 },
    avaliacaoFixada: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.sm,
        backgroundColor: cores.sucessoClaro,
        borderRadius: raios.pequeno,
        padding: espacos.md,
    },
    notaFixa: { fontSize: 14, fontWeight: '700', color: cores.preto },
    bloqueio: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bloqueioTexto: { fontSize: 11, color: cores.cinzaTexto, flexShrink: 1 },
    espaco: { height: espacos.sm },
});
