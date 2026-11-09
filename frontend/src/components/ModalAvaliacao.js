import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Botao from './Botao';
import Icone from './Icone';
import { useAuth } from '../context/AuthContext';
import { avaliar, buscarMinhaAvaliacao } from '../services/api';
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

function Estrelas({ nota, tamanho = 16 }) {
    const cheias = Math.round(Number(nota) || 0);

    return (
        <View style={styles.linhaEstrelas}>
            {NOTAS.map((numero) => (
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

export default function ModalAvaliacao({ visivel, servico, onFechar, onAvaliada }) {
    const { usuario } = useAuth();

    const [nota, setNota] = useState(0);
    const [comentario, setComentario] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    const [minhaAvaliacao, setMinhaAvaliacao] = useState(null);

    const souContratante = usuario?.id === servico?.contratante?.usuario?.id;
    const souContratado = usuario?.id === servico?.contratado?.usuario?.id;

    const pessoaAvaliada = souContratante
        ? servico?.contratado?.usuario
        : servico?.contratante?.usuario;

    const titulo = souContratante
        ? 'Avaliar trabalhador'
        : souContratado
          ? 'Avaliar contratante'
          : 'Avaliar participante';

    const nomePessoa = primeiroNome(pessoaAvaliada?.nome) || 'participante';

    useEffect(() => {
        if (!visivel || !servico?.id) return;

        let ativo = true;
        setErro('');
        setCarregando(true);

        buscarMinhaAvaliacao(servico.id)
            .then((dados) => {
                if (!ativo) return;
                setMinhaAvaliacao(dados || null);
                if (dados) {
                    setNota(Number(dados.nota) || 0);
                    setComentario(dados.comentario || '');
                }
            })
            .catch(() => {
                if (ativo) setMinhaAvaliacao(null);
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });

        return () => {
            ativo = false;
        };
    }, [visivel, servico?.id]);

    async function enviar() {
        setErro('');

        if (nota === 0) {
            setErro('Escolha uma nota de 1 a 5 estrelas.');
            return;
        }

        if (!pessoaAvaliada?.id) {
            setErro('Não foi possível identificar o participante a ser avaliado.');
            return;
        }

        setEnviando(true);

        try {
            const salva = await avaliar(servico.id, usuario.id, pessoaAvaliada.id, {
                nota,
                comentario: comentario.trim() || null,
            });
            setMinhaAvaliacao(salva || { nota, comentario });
            if (typeof onAvaliada === 'function') onAvaliada(salva);
        } catch (e) {
            if (e.status === 409) {
                try {
                    const existente = await buscarMinhaAvaliacao(servico.id);
                    setMinhaAvaliacao(existente || { nota });
                    setErro('Esta avaliação já foi enviada e não pode ser alterada.');
                } catch {
                    setErro('Esta avaliação já foi enviada e não pode ser alterada.');
                }
            } else {
                setErro(e.message);
            }
        } finally {
            setEnviando(false);
        }
    }

    function fechar() {
        if (typeof onFechar === 'function') onFechar();
    }

    if (!servico) return null;

    return (
        <Modal visible={Boolean(visivel)} transparent animationType="fade" onRequestClose={fechar}>
            <View style={styles.fundo}>
                <Pressable
                    accessibilityLabel="Fechar avaliação"
                    style={styles.areaFechar}
                    onPress={fechar}
                />

                <View style={styles.caixa}>
                    <View style={styles.alca} />

                    <View style={styles.cabecalho}>
                        <View style={styles.iconeTitulo}>
                            <Icone nome="star" tamanho={20} cor={cores.amareloEscuro} />
                        </View>

                        <View style={styles.cabecalhoTexto}>
                            <Text style={styles.titulo}>{titulo}</Text>
                            <Text style={styles.subtitulo} numberOfLines={1}>
                                {servico.titulo}
                            </Text>
                        </View>

                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Fechar"
                            onPress={fechar}
                            hitSlop={8}
                            style={styles.fechar}
                        >
                            <Icone nome="close" tamanho={20} cor={cores.cinzaTexto} />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.rolagem}
                        contentContainerStyle={styles.conteudo}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {carregando ? (
                            <View style={styles.carregando}>
                                <ActivityIndicator color={cores.azul} />
                            </View>
                        ) : minhaAvaliacao ? (
                            <View style={styles.bloqueado}>
                                <View style={styles.linhaBloqueio}>
                                    <Icone
                                        nome="checkmark-circle"
                                        tamanho={22}
                                        cor={cores.sucesso}
                                    />
                                    <Text style={styles.bloqueioTitulo}>Avaliação enviada</Text>
                                </View>

                                <Text style={styles.informacao}>
                                    Você avaliou {nomePessoa}. A avaliação é definitiva e não pode
                                    ser editada ou excluída.
                                </Text>

                                <View style={styles.estrelasCentro}>
                                    <Estrelas nota={minhaAvaliacao.nota} tamanho={28} />
                                </View>

                                <Text style={styles.notaFixa}>
                                    {minhaAvaliacao.nota} de 5 ·{' '}
                                    {DESCRICOES[minhaAvaliacao.nota] || ''}
                                </Text>

                                {minhaAvaliacao.comentario ? (
                                    <View style={styles.comentarioCaixa}>
                                        <Text style={styles.comentarioTexto}>
                                            {minhaAvaliacao.comentario}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.informacao}>Sem comentário.</Text>
                                )}

                                <View style={styles.trava}>
                                    <Icone
                                        nome="lock-closed-outline"
                                        tamanho={14}
                                        cor={cores.cinzaTexto}
                                    />
                                    <Text style={styles.travaTexto}>
                                        Avaliação registrada. Não é possível alterar.
                                    </Text>
                                </View>

                                <Botao titulo="Fechar" variante="claro" onPress={fechar} />
                            </View>
                        ) : (
                            <>
                                <View style={styles.pessoa}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarLetra}>
                                            {String(pessoaAvaliada?.nome || 'P')
                                                .charAt(0)
                                                .toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.pessoaTexto}>
                                        <Text style={styles.pessoaNome}>
                                            {((pessoaAvaliada?.nome || '') +
                                                ' ' +
                                                (pessoaAvaliada?.sobrenome || '')).trim() ||
                                                'Participante'}
                                        </Text>
                                        <Text style={styles.informacao}>
                                            {souContratante ? 'Trabalhador' : 'Contratante'} deste
                                            serviço
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.pergunta}>
                                    Como foi trabalhar com {nomePessoa}?
                                </Text>

                                <View style={styles.estrelasCentro}>
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
                                                    tamanho={38}
                                                    cor={
                                                        ativa
                                                            ? cores.amareloEscuro
                                                            : cores.borda
                                                    }
                                                />
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                <Text style={styles.descricaoNota}>
                                    {nota === 0
                                        ? 'Toque nas estrelas para avaliar'
                                        : nota + ' de 5 · ' + DESCRICOES[nota]}
                                </Text>

                                <TextInput
                                    style={styles.areaTexto}
                                    value={comentario}
                                    onChangeText={setComentario}
                                    placeholder="Conte como foi a experiência (opcional)"
                                    placeholderTextColor={cores.cinzaTexto}
                                    multiline
                                    maxLength={500}
                                />

                                <View style={styles.trava}>
                                    <Icone
                                        nome="information-circle-outline"
                                        tamanho={14}
                                        cor={cores.cinzaTexto}
                                    />
                                    <Text style={styles.travaTexto}>
                                        Depois de enviar, a avaliação não poderá ser editada.
                                    </Text>
                                </View>

                                <Botao
                                    titulo="Enviar avaliação"
                                    carregando={enviando}
                                    desabilitado={nota === 0}
                                    onPress={enviar}
                                />

                                <Pressable
                                    accessibilityRole="button"
                                    onPress={fechar}
                                    style={styles.agoraNao}
                                >
                                    <Text style={styles.agoraNaoTexto}>Avaliar depois</Text>
                                </Pressable>
                            </>
                        )}

                        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    fundo: {
        flex: 1,
        backgroundColor: 'rgba(21, 22, 26, 0.5)',
        justifyContent: 'flex-end',
    },
    areaFechar: { flex: 1 },
    caixa: {
        backgroundColor: cores.branco,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        maxHeight: '90%',
        paddingTop: espacos.sm,
    },
    alca: {
        alignSelf: 'center',
        width: 44,
        height: 5,
        borderRadius: 3,
        backgroundColor: cores.borda,
    },
    cabecalho: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.sm,
        paddingHorizontal: espacos.lg,
        paddingTop: espacos.md,
    },
    iconeTitulo: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 222, 89, 0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cabecalhoTexto: { flex: 1, gap: 2 },
    titulo: { fontSize: 18, fontWeight: '700', color: cores.preto },
    subtitulo: { fontSize: 12, color: cores.cinzaTexto },
    fechar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: cores.cinza,
    },
    rolagem: { marginTop: espacos.sm },
    conteudo: { padding: espacos.lg, paddingBottom: espacos.xxl, gap: espacos.md },
    carregando: { paddingVertical: espacos.xxl, alignItems: 'center' },
    pessoa: { flexDirection: 'row', alignItems: 'center', gap: espacos.md },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: cores.azulClaro,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarLetra: { color: cores.azul, fontSize: 18, fontWeight: '700' },
    pessoaTexto: { flex: 1, gap: 2 },
    pessoaNome: { fontSize: 16, fontWeight: '700', color: cores.preto },
    pergunta: { fontSize: 15, fontWeight: '600', color: cores.grafite },
    informacao: { fontSize: 13, color: cores.cinzaTexto, lineHeight: 19 },
    linhaEstrelas: { flexDirection: 'row', gap: 2 },
    estrelasCentro: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: espacos.sm,
        paddingVertical: espacos.sm,
    },
    estrelaPressionada: { transform: [{ scale: 0.9 }] },
    descricaoNota: {
        fontSize: 13,
        fontWeight: '600',
        color: cores.azul,
        textAlign: 'center',
    },
    areaTexto: {
        minHeight: 90,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: raios.pequeno,
        padding: espacos.md,
        fontSize: 14,
        color: cores.preto,
        textAlignVertical: 'top',
        backgroundColor: cores.branco,
    },
    trava: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    travaTexto: { fontSize: 11, color: cores.cinzaTexto, flexShrink: 1 },
    agoraNao: { alignItems: 'center', paddingVertical: espacos.sm },
    agoraNaoTexto: { fontSize: 13, fontWeight: '600', color: cores.cinzaTexto },
    erro: {
        fontSize: 13,
        color: cores.erro,
        backgroundColor: cores.erroClaro,
        borderRadius: raios.pequeno,
        padding: espacos.md,
    },
    bloqueado: { gap: espacos.md },
    linhaBloqueio: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm },
    bloqueioTitulo: { fontSize: 17, fontWeight: '700', color: cores.sucesso },
    notaFixa: {
        fontSize: 14,
        fontWeight: '700',
        color: cores.preto,
        textAlign: 'center',
    },
    comentarioCaixa: {
        backgroundColor: cores.cinza,
        borderRadius: raios.pequeno,
        padding: espacos.md,
    },
    comentarioTexto: { fontSize: 14, color: cores.grafite, lineHeight: 20 },
});
