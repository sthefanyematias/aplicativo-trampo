
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import Botao from '../components/Botao';
import Cabecalho from '../components/Cabecalho';
import EtiquetaStatus from '../components/EtiquetaStatus';
import Icone from '../components/Icone';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import { avaliar, buscarMinhaAvaliacao, buscarServico } from '../services/api';
import { cores, espacos, raios } from '../theme/cores';
import { primeiroNome } from '../utils/formato';

const NOTAS = [1, 2, 3, 4, 5];

const DESCRICOES = {
    1: 'Muito ruim',
    2: 'Ruim',
    3: 'Regular',
    4: 'Bom',
    5: 'Excelente',
};

export default function TelaAvaliar() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const idDoServico = Number(id);

    const [servico, setServico] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [nota, setNota] = useState(0);
    const [comentario, setComentario] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    const [enviado, setEnviado] = useState(false);
    const [minhaAvaliacao, setMinhaAvaliacao] = useState(null);

    useEffect(() => {
        if (usuario) {
            carregarServico();
        }
    }, [usuario]);

    async function carregarServico() {
        try {
            const dados = await buscarServico(idDoServico);
            setServico(dados);

            if (dados.status === 'CONCLUIDO' && dados.contratado) {
                const idContratante = dados.contratante?.usuario?.id;
                const idContratado = dados.contratado?.usuario?.id;

                if (usuario.id === idContratante || usuario.id === idContratado) {
                    try {
                        const salva = await buscarMinhaAvaliacao(idDoServico);
                        if (salva) {
                            setMinhaAvaliacao(salva);
                            setNota(Number(salva.nota) || 0);
                            setComentario(salva.comentario || '');
                            setEnviado(true);
                        }
                    } catch {
                        setMinhaAvaliacao(null);
                    }
                }
            }
        } catch (e) {
            setErro(e.message);
        } finally {
            setCarregando(false);
        }
    }

    async function aoEnviar() {
        setErro('');

        if (minhaAvaliacao) {
            setErro('Esta avaliação já foi enviada e não pode ser alterada.');
            return;
        }

        if (nota === 0) {
            setErro('Selecione uma nota de 1 a 5 estrelas.');
            return;
        }

        const idDoContratante = servico?.contratante?.usuario?.id;
        const idDoContratado = servico?.contratado?.usuario?.id;

        let idDeQuemVouAvaliar = null;

        if (usuario.id === idDoContratante) {
            idDeQuemVouAvaliar = idDoContratado;
        } else if (usuario.id === idDoContratado) {
            idDeQuemVouAvaliar = idDoContratante;
        }

        if (!idDeQuemVouAvaliar) {
            setErro('Não foi possível identificar o participante a ser avaliado.');
            return;
        }

        setEnviando(true);

        try {
            await avaliar(idDoServico, usuario.id, idDeQuemVouAvaliar, {
                nota: nota,
                comentario: comentario.trim() || null,
            });
            setEnviado(true);
            try {
                setMinhaAvaliacao(await buscarMinhaAvaliacao(idDoServico));
            } catch {
                setMinhaAvaliacao({ nota });
            }
        } catch (e) {
            if (e.status === 409) {
                setErro('Esta avaliação já foi enviada e não pode ser alterada.');
                try {
                    setMinhaAvaliacao(await buscarMinhaAvaliacao(idDoServico));
                } catch {
                    setMinhaAvaliacao({ nota });
                }
            } else {
                setErro(e.message);
            }
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

    const souContratante = usuario.id === servico.contratante?.usuario?.id;
    const souContratado = usuario.id === servico.contratado?.usuario?.id;
    const participei = souContratante || souContratado;
    const estaConcluido = servico.status === 'CONCLUIDO';

    const pessoaAvaliada = souContratante
        ? servico.contratado?.usuario
        : servico.contratante?.usuario;

    const papelDaPessoa = souContratante ? 'trabalhador' : 'contratante';

    if (!participei) {
        return (
            <Tela>
                <View style={styles.centro}>
                    <Text style={styles.textoVazio}>Você não participou deste serviço.</Text>
                    <Botao titulo="Voltar" variante="claro" onPress={() => router.back()} />
                </View>
            </Tela>
        );
    }

    if (!estaConcluido) {
        return (
            <Tela>
                <View style={styles.centro}>
                    <Text style={styles.textoVazio}>
                        A avaliação é liberada após a conclusão do serviço.
                    </Text>
                    <Botao titulo="Voltar" variante="claro" onPress={() => router.back()} />
                </View>
            </Tela>
        );
    }

    return (
        <Tela>
            <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
                <Cabecalho
                    titulo={souContratante ? 'Avaliar trabalhador' : 'Avaliar contratante'}
                    subtitulo={servico.titulo}
                />

                <Vidro style={styles.cartao}>
                    <EtiquetaStatus status={servico.status} />
                    <Text style={styles.informacao}>
                        Avaliação de {primeiroNome(pessoaAvaliada?.nome) || 'participante'},{' '}
                        {papelDaPessoa} deste serviço.
                    </Text>
                </Vidro>

                {enviado || minhaAvaliacao ? (
                    <Vidro style={styles.sucesso}>
                        <View style={styles.linhaSucesso}>
                            <Icone nome="checkmark-circle" tamanho={22} cor={cores.sucesso} />
                            <Text style={styles.sucessoTitulo}>Avaliação registrada</Text>
                        </View>

                        <Text style={styles.informacao}>
                            Obrigado por contribuir com a reputação da plataforma.
                        </Text>

                        <View style={styles.avaliacaoBloqueada}>
                            <View style={styles.estrelasFixas}>
                                {NOTAS.map((numero) => (
                                    <Icone
                                        key={numero}
                                        nome={
                                            numero <= Number(minhaAvaliacao?.nota || nota)
                                                ? 'star'
                                                : 'star-outline'
                                        }
                                        tamanho={18}
                                        cor={
                                            numero <= Number(minhaAvaliacao?.nota || nota)
                                                ? cores.amareloEscuro
                                                : cores.borda
                                        }
                                    />
                                ))}
                            </View>

                            {minhaAvaliacao?.comentario ? (
                                <Text style={styles.comentarioFixo}>
                                    {minhaAvaliacao.comentario}
                                </Text>
                            ) : (
                                <Text style={styles.informacao}>Sem comentário.</Text>
                            )}

                            <View style={styles.bloqueio}>
                                <Icone
                                    nome="lock-closed-outline"
                                    tamanho={13}
                                    cor={cores.cinzaTexto}
                                />
                                <Text style={styles.bloqueioTexto}>
                                    Avaliação definitiva. Não é possível editar ou excluir.
                                </Text>
                            </View>
                        </View>

                        <Botao
                            titulo="Voltar ao serviço"
                            onPress={() => router.replace('/servico?id=' + idDoServico)}
                        />
                        <Botao
                            titulo="Voltar para o início"
                            variante="claro"
                            onPress={() => router.replace('/home')}
                        />
                    </Vidro>
                ) : (
                    <Vidro style={styles.cartao}>
                        <Text style={styles.rotulo}>Nota</Text>

                        <View style={styles.linhaEstrelas}>
                            {NOTAS.map((numero) => {
                                const ativa = numero <= nota;

                                return (
                                    <Pressable
                                        key={numero}
                                        accessibilityRole="button"
                                        accessibilityLabel={numero + ' estrelas'}
                                        onPress={() => setNota(numero)}
                                        style={({ pressed }) =>
                                            pressed ? styles.estrelaPressionada : null
                                        }
                                    >
                                        <Icone
                                            nome={ativa ? 'star' : 'star-outline'}
                                            tamanho={34}
                                            cor={ativa ? cores.amareloEscuro : cores.borda}
                                        />
                                    </Pressable>
                                );
                            })}
                        </View>

                        <Text style={styles.descricaoNota}>
                            {nota === 0
                                ? 'Toque em uma estrela para avaliar'
                                : nota + ' de 5 · ' + DESCRICOES[nota]}
                        </Text>

                        <Text style={styles.rotulo}>Comentário</Text>

                        <TextInput
                            style={styles.areaTexto}
                            value={comentario}
                            onChangeText={setComentario}
                            placeholder="Descreva como foi a experiência (opcional)"
                            placeholderTextColor={cores.cinzaTexto}
                            multiline
                            maxLength={500}
                        />

                        <Botao
                            titulo="Enviar avaliação"
                            carregando={enviando}
                            desabilitado={nota === 0}
                            onPress={aoEnviar}
                        />
                    </Vidro>
                )}
            </ScrollView>

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
        marginBottom: espacos.md,
    },
    rotulo: {
        fontSize: 14,
        fontWeight: '600',
        color: cores.grafite,
        marginTop: espacos.sm,
    },
    informacao: {
        fontSize: 13,
        color: cores.cinzaTexto,
    },
    linhaEstrelas: {
        flexDirection: 'row',
        gap: espacos.sm,
    },
    estrelaPressionada: {
        transform: [{ scale: 0.9 }],
    },
    descricaoNota: {
        fontSize: 13,
        fontWeight: '600',
        color: cores.azul,
    },
    areaTexto: {
        minHeight: 96,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: raios.pequeno,
        padding: espacos.md,
        fontSize: 14,
        color: cores.preto,
        textAlignVertical: 'top',
        backgroundColor: cores.branco,
    },
    sucesso: {
        backgroundColor: cores.sucessoClaro,
        borderColor: cores.sucesso,
        gap: espacos.md,
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
    avaliacaoBloqueada: {
        backgroundColor: cores.branco,
        borderRadius: 12,
        padding: espacos.md,
        gap: espacos.sm,
    },
    estrelasFixas: { flexDirection: 'row', gap: 2 },
    comentarioFixo: { fontSize: 14, color: cores.grafite, lineHeight: 20 },
    bloqueio: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    bloqueioTexto: { fontSize: 11, color: cores.cinzaTexto, flexShrink: 1 },
});
