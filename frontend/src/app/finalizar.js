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
import { buscarMinhaAvaliacao, buscarServico, concluirServico } from '../services/api';
import { cores, espacos } from '../theme/cores';
import { formatarDinheiro, formatarQuando, nomeCompleto } from '../utils/formato';

export default function TelaFinalizar() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const idDoServico = Number(id);
    const aberturaAutomatica = useRef(false);

    const [servico, setServico] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [finalizando, setFinalizando] = useState(false);
    const [erro, setErro] = useState('');
    const [concluido, setConcluido] = useState(false);
    const [minhaAvaliacao, setMinhaAvaliacao] = useState(null);
    const [modalVisivel, setModalVisivel] = useState(false);

    useEffect(() => {
        if (usuario) {
            carregarServico();
        }
    }, [usuario, id]);

    async function carregarServico() {
        try {
            const dados = await buscarServico(idDoServico);
            setServico(dados);

            if (dados.status === 'CONCLUIDO') {
                setConcluido(true);

                let avaliacao = null;
                try {
                    avaliacao = await buscarMinhaAvaliacao(idDoServico);
                } catch {
                    avaliacao = null;
                }

                setMinhaAvaliacao(avaliacao || null);

                if (!avaliacao && !aberturaAutomatica.current) {
                    aberturaAutomatica.current = true;
                    setModalVisivel(true);
                }
            }
        } catch (e) {
            setErro(e.message);
        } finally {
            setCarregando(false);
        }
    }

    async function aoFinalizar() {
        setErro('');
        setFinalizando(true);

        try {
            await concluirServico(idDoServico);
            setConcluido(true);
            await carregarServico();

            if (!aberturaAutomatica.current) {
                aberturaAutomatica.current = true;
                setModalVisivel(true);
            }
        } catch (e) {
            setErro(e.message);
        } finally {
            setFinalizando(false);
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

    const estaEmAndamento = servico.status === 'EM_ANDAMENTO';
    const souContratante = usuario.id === servico.contratante?.usuario?.id;
    const souContratado = usuario.id === servico.contratado?.usuario?.id;
    const pessoaAvaliada = souContratante
        ? servico.contratado?.usuario
        : servico.contratante?.usuario;
    const papelAvaliado = souContratante ? 'trabalhador' : 'contratante';

    return (
        <Tela>
            <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
                <Cabecalho
                    titulo={concluido ? 'Serviço finalizado' : 'Finalizar serviço'}
                    subtitulo={
                        concluido
                            ? 'A conversa deste serviço foi encerrada'
                            : 'Confira os dados antes de concluir'
                    }
                />

                <Vidro style={styles.cartao}>
                    <View style={styles.linhaTitulo}>
                        <Text style={styles.tituloServico}>{servico.titulo}</Text>
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

                    <View style={styles.linhaInfo}>
                        <Icone nome="person-outline" tamanho={15} cor={cores.cinzaTexto} />
                        <Text style={styles.informacao}>
                            Contratante: {nomeCompleto(servico.contratante?.usuario)}
                        </Text>
                    </View>

                    <View style={styles.linhaInfo}>
                        <Icone nome="construct-outline" tamanho={15} cor={cores.cinzaTexto} />
                        <Text style={styles.informacao}>
                            Trabalhador: {nomeCompleto(servico.contratado?.usuario)}
                        </Text>
                    </View>

                    {servico.endereco ? (
                        <View style={styles.linhaInfo}>
                            <Icone nome="location-outline" tamanho={15} cor={cores.cinzaTexto} />
                            <Text style={styles.informacao}>{servico.endereco}</Text>
                        </View>
                    ) : null}
                </Vidro>

                {concluido ? (
                    <Vidro style={styles.sucesso}>
                        <View style={styles.linhaSucesso}>
                            <Icone nome="checkmark-circle" tamanho={22} cor={cores.sucesso} />
                            <Text style={styles.sucessoTitulo}>Serviço concluído</Text>
                        </View>

                        <Text style={styles.informacao}>
                            A conversa ficou fechada para novas mensagens. As duas partes podem se
                            avaliar, e a avaliação enviada não pode ser alterada.
                        </Text>

                        {minhaAvaliacao ? (
                            <View style={styles.avaliacaoEnviada}>
                                <View style={styles.linhaSucesso}>
                                    <Icone
                                        nome="checkmark-done-circle"
                                        tamanho={18}
                                        cor={cores.sucesso}
                                    />
                                    <Text style={styles.avaliacaoTitulo}>
                                        Sua avaliação foi registrada
                                    </Text>
                                </View>
                                <Text style={styles.informacao}>
                                    Você avaliou {papelAvaliado} com nota{' '}
                                    {minhaAvaliacao.nota} de 5. Obrigado por contribuir.
                                </Text>
                            </View>
                        ) : (
                            <Botao
                                titulo={
                                    souContratante ? 'Avaliar trabalhador' : 'Avaliar contratante'
                                }
                                icone="star-outline"
                                variante="azul"
                                onPress={() => setModalVisivel(true)}
                            />
                        )}
                    </Vidro>
                ) : null}

                {estaEmAndamento && !concluido ? (
                    <Vidro style={styles.cartao}>
                        <Text style={styles.aviso}>
                            Ao confirmar, o serviço passa para concluído, a conversa é encerrada e a
                            avaliação é liberada para as duas partes. Esta ação não pode ser
                            revertida.
                        </Text>

                        <Botao
                            titulo="Confirmar conclusão"
                            icone="checkmark-circle-outline"
                            variante="sucesso"
                            carregando={finalizando}
                            onPress={aoFinalizar}
                        />
                    </Vidro>
                ) : null}

                {!estaEmAndamento && !concluido ? (
                    <Vidro style={styles.cartao}>
                        <Text style={styles.aviso}>
                            Este serviço não está em andamento e não pode ser finalizado.
                        </Text>
                    </Vidro>
                ) : null}

                <Botao
                    titulo="Voltar para o início"
                    variante="claro"
                    onPress={() => router.replace('/home')}
                />
            </ScrollView>

            <ModalAvaliacao
                visivel={modalVisivel}
                servico={servico}
                onFechar={() => setModalVisivel(false)}
                onAvaliada={(avaliacao) => {
                    setMinhaAvaliacao(avaliacao || { nota: 0 });
                    setModalVisivel(false);
                }}
            />

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
    conteudo: {
        padding: espacos.lg,
        paddingBottom: espacos.xl,
        gap: espacos.md,
    },
    centro: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: espacos.xl,
        gap: espacos.md,
    },
    textoVazio: {
        color: cores.cinzaTexto,
        fontSize: 14,
        textAlign: 'center',
    },
    cartao: {
        padding: espacos.lg,
        gap: espacos.sm,
    },
    linhaTitulo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: espacos.sm,
    },
    tituloServico: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: cores.preto,
    },
    valor: {
        fontSize: 22,
        fontWeight: '700',
        color: cores.azul,
    },
    linhaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    informacao: {
        fontSize: 13,
        color: cores.cinzaTexto,
        flexShrink: 1,
        lineHeight: 19,
    },
    aviso: {
        fontSize: 13,
        color: cores.alerta,
        backgroundColor: cores.alertaClaro,
        borderRadius: 8,
        padding: espacos.md,
        lineHeight: 19,
    },
    sucesso: {
        backgroundColor: cores.sucessoClaro,
        borderColor: cores.sucesso,
        gap: espacos.md,
        padding: espacos.lg,
    },
    linhaSucesso: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.sm,
    },
    sucessoTitulo: {
        fontSize: 16,
        fontWeight: '700',
        color: cores.sucesso,
    },
    avaliacaoEnviada: {
        backgroundColor: cores.branco,
        borderRadius: 12,
        padding: espacos.md,
        gap: espacos.xs,
    },
    avaliacaoTitulo: {
        fontSize: 13,
        fontWeight: '700',
        color: cores.sucesso,
    },
});
