import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import BarraInferior from '../components/BarraInferior';
import Botao from '../components/Botao';
import Cabecalho from '../components/Cabecalho';
import CampoTexto from '../components/CampoTexto';
import Icone from '../components/Icone';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import { meuPerfilContratante, publicarServico } from '../services/api';
import { cores, espacos } from '../theme/cores';
import { mascararData, mascararHora, montarEndereco, nomePeriodo } from '../utils/formato';

function transformarValor(texto) {
    const limpo = String(texto).replace(/\./g, '').replace(',', '.');
    const numero = Number(limpo);
    if (isNaN(numero)) return 0;
    return numero;
}

function transformarData(texto) {
    const partes = String(texto).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!partes) return null;
    return partes[3] + '-' + partes[2] + '-' + partes[1];
}

function dataValida(texto) {
    const partes = String(texto).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!partes) return false;

    const dia = Number(partes[1]);
    const mes = Number(partes[2]);
    const ano = Number(partes[3]);

    if (dia < 1 || dia > 31) return false;
    if (mes < 1 || mes > 12) return false;
    if (ano < 2024 || ano > 2100) return false;

    return true;
}

function lerHora(texto) {
    const digitos = String(texto ?? '').replace(/\D/g, '');

    if (!digitos) return null;
    if (digitos.length > 4) return null;

    const hora = Number(digitos.slice(0, 2));
    const minuto = digitos.length <= 2 ? 0 : Number(digitos.slice(2, 4).padEnd(2, '0'));

    if (isNaN(hora) || isNaN(minuto)) return null;
    if (hora > 23) return null;
    if (minuto > 59) return null;

    return { hora: hora, minuto: minuto, total: hora * 60 + minuto };
}

function normalizarHora(texto) {
    const lido = lerHora(texto);

    if (!lido) return String(texto ?? '');

    return String(lido.hora).padStart(2, '0') + ':' + String(lido.minuto).padStart(2, '0');
}

function horaParaBackend(texto) {
    const lido = lerHora(texto);

    if (!lido) return null;

    return (
        String(lido.hora).padStart(2, '0') +
        ':' +
        String(lido.minuto).padStart(2, '0') +
        ':00'
    );
}

function periodoDe(texto) {
    const lido = lerHora(texto);
    if (!lido) return null;

    if (lido.hora < 12) return 'MANHA';
    if (lido.hora < 18) return 'TARDE';
    return 'NOITE';
}

function duracaoEmTexto(inicio, fim) {
    const primeiro = lerHora(inicio);
    const segundo = lerHora(fim);

    if (!primeiro || !segundo) return '';

    const diferenca = segundo.total - primeiro.total;
    if (diferenca <= 0) return '';

    const horas = Math.floor(diferenca / 60);
    const minutos = diferenca % 60;

    if (horas === 0) return minutos + ' min';
    if (minutos === 0) return horas + 'h';
    return horas + 'h ' + minutos + ' min';
}

export default function TelaPublicar() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao, recarregar } = useAuth();

    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [data, setData] = useState('');
    const [horaInicio, setHoraInicio] = useState('');
    const [horaFim, setHoraFim] = useState('');

    const [perfil, setPerfil] = useState(null);
    const [erro, setErro] = useState('');
    const [erros, setErros] = useState({});
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (usuario) {
            carregarPerfil();
        }
    }, [usuario]);

    async function carregarPerfil() {
        try {
            const dados = await meuPerfilContratante();
            setPerfil(dados);
        } catch (e) {
            setErro(e.message);
        }
    }

    if (carregandoSessao) {
        return (
            <Tela cor={cores.branco}>
                <View style={styles.centro} />
            </Tela>
        );
    }

    if (!usuario) return <Redirect href="/login" />;

    const periodo = periodoDe(horaInicio);
    const duracao = duracaoEmTexto(horaInicio, horaFim);
    const horarioCompleto = Boolean(periodo && duracao);

    function validar() {
        const novos = {};

        if (titulo.trim().length < 3) novos.titulo = 'Informe um título.';
        if (descricao.trim().length < 10) novos.descricao = 'Descreva o serviço.';
        if (transformarValor(valor) <= 0) novos.valor = 'Informe um valor maior que zero.';

        if (!data.trim()) {
            novos.data = 'Informe a data.';
        } else if (!dataValida(data)) {
            novos.data = 'Data inválida.';
        }

        if (!lerHora(horaInicio)) {
            novos.horaInicio = 'Informe o horário.';
        }

        if (!lerHora(horaFim)) {
            novos.horaFim = 'Informe o horário.';
        }

        if (!novos.horaInicio && !novos.horaFim) {
            const inicio = lerHora(horaInicio);
            const fim = lerHora(horaFim);

            if (fim.total <= inicio.total) {
                novos.horaFim = 'O término deve ser depois do início.';
            }
        }

        setErros(novos);
        return Object.keys(novos).length === 0;
    }

    async function aoPublicar() {
        setErro('');

        if (!validar()) {
            setErro('Revise os campos destacados.');
            return;
        }

        if (!perfil || perfil.latitude === null || perfil.longitude === null) {
            setErro('Cadastre a sua localização no perfil antes de publicar.');
            return;
        }

        let idDoContratante = usuario.contratanteId;

        if (!idDoContratante) {
            try {
                const dados = await recarregar();
                idDoContratante = dados ? dados.contratanteId : null;
            } catch (e) {
                setErro(e.message);
                return;
            }
        }

        if (!idDoContratante) {
            setErro('Perfil de contratante não encontrado.');
            return;
        }

        setSalvando(true);

        try {
            const criado = await publicarServico(idDoContratante, {
                titulo: titulo.trim(),
                descricao: descricao.trim(),
                valor: transformarValor(valor),
                dataServico: transformarData(data),
                horaInicio: horaParaBackend(horaInicio),
                horaFim: horaParaBackend(horaFim),
                periodo: periodoDe(horaInicio),
                endereco: montarEndereco(perfil),
                latitude: perfil.latitude,
                longitude: perfil.longitude,
            });

            if (criado && criado.id) {
                router.replace('/servico?id=' + criado.id + '&novo=1');
            } else {
                router.replace('/meus-servicos');
            }
        } catch (e) {
            setErro(e.message);
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Tela cor={cores.branco}>
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
                        titulo="Publicar serviço"
                        subtitulo="Descreva o que você precisa"
                        mostrarVoltar={false}
                    />

                    <Vidro style={styles.formulario}>
                        <CampoTexto
                            label="Título"
                            valor={titulo}
                            onChange={(texto) => {
                                setTitulo(texto);
                                setErros((atual) => ({ ...atual, titulo: undefined }));
                            }}
                            placeholder="Instalação de chuveiro elétrico"
                            autoCapitalize="sentences"
                            maxLength={100}
                            error={erros.titulo}
                        />

                        <CampoTexto
                            label="Descrição"
                            valor={descricao}
                            onChange={(texto) => {
                                setDescricao(texto);
                                setErros((atual) => ({ ...atual, descricao: undefined }));
                            }}
                            placeholder="Materiais, medidas e detalhes do local"
                            multiline
                            autoCapitalize="sentences"
                            maxLength={1000}
                            error={erros.descricao}
                        />

                        <CampoTexto
                            label="Valor (R$)"
                            valor={valor}
                            onChange={(texto) => {
                                setValor(texto);
                                setErros((atual) => ({ ...atual, valor: undefined }));
                            }}
                            placeholder="180,00"
                            keyboard="decimal-pad"
                            error={erros.valor}
                        />

                        <CampoTexto
                            label="Data do serviço"
                            valor={data}
                            onChange={(texto) => {
                                setData(mascararData(texto));
                                setErros((atual) => ({ ...atual, data: undefined }));
                            }}
                            placeholder="02/11/2026"
                            keyboard="number-pad"
                            maxLength={10}
                            error={erros.data}
                        />

                        <View style={styles.linhaDupla}>
                            <View style={styles.coluna}>
                                <CampoTexto
                                    label="Início"
                                    valor={horaInicio}
                                    onChange={(texto) => {
                                        setHoraInicio(mascararHora(texto));
                                        setErros((atual) => ({ ...atual, horaInicio: undefined }));
                                    }}
                                    aoSair={() => setHoraInicio(normalizarHora(horaInicio))}
                                    placeholder="08:00"
                                    keyboard="number-pad"
                                    maxLength={5}
                                    error={erros.horaInicio}
                                />
                            </View>
                            <View style={styles.coluna}>
                                <CampoTexto
                                    label="Término"
                                    valor={horaFim}
                                    onChange={(texto) => {
                                        setHoraFim(mascararHora(texto));
                                        setErros((atual) => ({ ...atual, horaFim: undefined }));
                                    }}
                                    aoSair={() => setHoraFim(normalizarHora(horaFim))}
                                    placeholder="12:00"
                                    keyboard="number-pad"
                                    maxLength={5}
                                    error={erros.horaFim}
                                />
                            </View>
                        </View>

                        {horarioCompleto ? (
                            <View style={styles.resumoHorario}>
                                <Icone nome="time-outline" tamanho={16} cor={cores.azul} />
                                <Text style={styles.resumoTexto}>
                                    {nomePeriodo(periodo)} · {duracao} de serviço
                                </Text>
                            </View>
                        ) : null}
                    </Vidro>

                    <Text style={styles.secao}>Local do serviço</Text>

                    <Vidro style={styles.formulario}>
                        <Text style={styles.dica}>
                            O endereço e as coordenadas do seu perfil são usados automaticamente.
                        </Text>

                        <View style={styles.linhaEndereco}>
                            <Icone nome="location-outline" tamanho={18} cor={cores.azul} />
                            <Text style={styles.endereco}>
                                {perfil
                                    ? montarEndereco(perfil) || 'Endereço não cadastrado'
                                    : 'Carregando perfil...'}
                            </Text>
                        </View>

                        {perfil && perfil.latitude !== null ? null : (
                            <Botao
                                titulo="Cadastrar localização"
                                variante="claro"
                                compacto
                                onPress={() => router.push('/perfil')}
                            />
                        )}
                    </Vidro>

                    <View style={styles.espaco} />

                    <Botao titulo="Publicar" onPress={aoPublicar} carregando={salvando} />

                    <View style={styles.espaco} />
                </ScrollView>
            </KeyboardAvoidingView>

            <BarraInferior abaAtiva="publicar" tipo={usuario.tipo} />

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
    flex: {
        flex: 1,
    },
    centro: {
        flex: 1,
    },
    conteudo: {
        padding: espacos.lg,
        paddingBottom: espacos.xl,
    },
    formulario: {
        padding: espacos.lg,
    },
    linhaDupla: {
        flexDirection: 'row',
        gap: espacos.md,
    },
    coluna: {
        flex: 1,
    },
    dica: {
        fontSize: 12,
        color: cores.cinzaTexto,
    },
    resumoHorario: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: cores.azulClaro,
        borderRadius: 8,
        paddingVertical: espacos.md,
        paddingHorizontal: espacos.md,
    },
    resumoTexto: {
        fontSize: 13,
        fontWeight: '600',
        color: cores.azul,
        textAlign: 'center',
    },
    secao: {
        fontSize: 16,
        fontWeight: '700',
        color: cores.preto,
        marginTop: espacos.lg,
        marginBottom: espacos.sm,
    },
    linhaEndereco: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: espacos.sm,
    },
    endereco: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: cores.preto,
    },
    espaco: {
        height: espacos.md,
    },
});