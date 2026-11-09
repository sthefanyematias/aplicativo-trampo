
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ALVO_PADRAO = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const BASE_URL = (
    process.env.EXPO_PUBLIC_API_URL || `http://${ALVO_PADRAO}:8080`
).replace(/\/+$/, '');

const TIMEOUT_PADRAO = 15000;
const CHAVE_TOKEN = 'trampo.token';
const EH_WEB = Platform.OS === 'web';

let tokenAtual = null;
let handlerSessaoExpirada = null;

export function definirToken(token) {
    tokenAtual = token;
}

export function aoExpirarSessao(fn) {
    handlerSessaoExpirada = fn;
}

export class ErroApi extends Error {
    constructor(mensagem, status = 0, dados = null) {
        super(mensagem);
        this.name = 'ErroApi';
        this.status = status;
        this.dados = dados;
    }
}

export async function salvarTokenSalvo(token) {
    if (!token) return;
    try {
        if (EH_WEB) {
            globalThis.localStorage?.setItem(CHAVE_TOKEN, token);
            return;
        }
        await SecureStore.setItemAsync(CHAVE_TOKEN, token);
    } catch {
    }
}

export async function lerTokenSalvo() {
    try {
        if (EH_WEB) return globalThis.localStorage?.getItem(CHAVE_TOKEN) ?? null;
        return await SecureStore.getItemAsync(CHAVE_TOKEN);
    } catch {
        return null;
    }
}

export async function limparTokenSalvo() {
    try {
        if (EH_WEB) {
            globalThis.localStorage?.removeItem(CHAVE_TOKEN);
            return;
        }
        await SecureStore.deleteItemAsync(CHAVE_TOKEN);
    } catch {
    }
}

const MENSAGENS_STATUS = {
    400: 'Os dados enviados são inválidos.',
    401: 'Sua sessão expirou. Entre novamente.',
    403: 'Você não tem permissão para esta ação.',
    404: 'Registro não encontrado.',
    405: 'Esta operação não é permitida.',
    409: 'Já existe um registro com estes dados.',
    500: 'Falha interna no servidor. Tente novamente em instantes.',
};

function montarQuery(params = {}) {
    const pares = Object.entries(params).filter(
        ([, valor]) => valor !== undefined && valor !== null && valor !== ''
    );

    if (!pares.length) return '';

    return `?${pares
        .map(([chave, valor]) => `${encodeURIComponent(chave)}=${encodeURIComponent(valor)}`)
        .join('&')}`;
}

export async function requisicao(
    caminho,
    { metodo = 'GET', corpo, query, autenticada = true, timeout = TIMEOUT_PADRAO } = {}
) {
    const headers = { Accept: 'application/json' };
    if (corpo !== undefined) headers['Content-Type'] = 'application/json';
    if (autenticada && tokenAtual) headers.Authorization = `Bearer ${tokenAtual}`;

    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), timeout);

    let resposta;
    try {
        resposta = await fetch(`${BASE_URL}${caminho}${montarQuery(query)}`, {
            method: metodo,
            headers,
            body: corpo === undefined ? undefined : JSON.stringify(corpo),
            signal: controle.signal,
        });
    } catch (e) {
        if (e && e.name === 'AbortError') {
            throw new ErroApi('O servidor demorou para responder. Tente novamente.');
        }
        throw new ErroApi('Não foi possível conectar ao servidor. Verifique a sua conexão.');
    } finally {
        clearTimeout(timer);
    }

    const texto = await resposta.text().catch(() => '');

    let dados = null;
    if (texto) {
        try {
            dados = JSON.parse(texto);
        } catch {
            dados = null;
        }
    }

    if (resposta.ok) return dados;

    const mensagem =
        (dados && typeof dados.mensagem === 'string' && dados.mensagem.trim()) ||
        MENSAGENS_STATUS[resposta.status] ||
        `Não foi possível concluir a operação (erro ${resposta.status}).`;

    if (resposta.status === 401 && autenticada) {
        tokenAtual = null;
        if (typeof handlerSessaoExpirada === 'function') handlerSessaoExpirada();
    }

    throw new ErroApi(mensagem, resposta.status, dados);
}

export function login(email, senha) {
    return requisicao('/auth/login', {
        metodo: 'POST',
        autenticada: false,
        corpo: { email: String(email).trim().toLowerCase(), senha },
    });
}

export function cadastrar(dados) {
    return requisicao('/usuarios', {
        metodo: 'POST',
        autenticada: false,
        corpo: {
            nome: String(dados.nome).trim(),
            sobrenome: String(dados.sobrenome).trim(),
            email: String(dados.email).trim().toLowerCase(),
            telefone: String(dados.telefone ?? '').replace(/\D/g, ''),
            senha: dados.senha,
            tipo: dados.tipo,
            cep: String(dados.cep ?? '').replace(/\D/g, ''),
            logradouro: String(dados.logradouro ?? '').trim(),
            numero: String(dados.numero ?? '').trim(),
            complemento: dados.complemento ? String(dados.complemento).trim() : null,
            bairro: String(dados.bairro ?? '').trim(),
            cidade: String(dados.cidade ?? '').trim(),
            uf: String(dados.uf ?? '').trim().toUpperCase(),
            latitude: dados.latitude,
            longitude: dados.longitude,
            raioBuscaKm: dados.raioBuscaKm ?? null,
            tipoPessoa: dados.tipoPessoa ?? null,
            cpfCnpj: dados.cpfCnpj ? String(dados.cpfCnpj).replace(/\D/g, '') : null,
            servicos: dados.servicos ?? null,
            disponibilidade: dados.disponibilidade ?? null,
            descricao: dados.descricao ?? null,
        },
    });
}

export function me() {
    return requisicao('/auth/me');
}

export function atualizarMe({ nome, sobrenome, telefone }) {
    return requisicao('/usuarios/me', {
        metodo: 'PUT',
        corpo: { nome, sobrenome, telefone },
    });
}

export function meuPerfilContratante() {
    return requisicao('/contratantes/me');
}

export function atualizarPerfilContratante(dados) {
    return requisicao('/contratantes/me', { metodo: 'PUT', corpo: dados });
}

export function meuPerfilContratado() {
    return requisicao('/contratados/me');
}

export function atualizarPerfilContratado(dados) {
    return requisicao('/contratados/me', { metodo: 'PUT', corpo: dados });
}

export function buscarContratado(id) {
    return requisicao(`/contratados/${id}`);
}

export function buscarContratante(id) {
    return requisicao(`/contratantes/${id}`);
}

export async function carregarUsuarioAtual() {
    return await me();
}

export function listarServicosAbertos({ pagina = 0, tamanho = 20 } = {}) {
    return requisicao('/servicos/abertos', { query: { page: pagina, size: tamanho } });
}

export function listarServicosProximos({ latitude, longitude, raioKm, pagina = 0, tamanho = 20 }) {
    return requisicao('/servicos/proximos', {
        query: { latitude, longitude, raioKm, page: pagina, size: tamanho },
    });
}

export function buscarServico(id) {
    return requisicao(`/servicos/${id}`);
}

export function publicarServico(contratanteId, dados) {
    return requisicao(`/servicos/contratante/${contratanteId}`, { metodo: 'POST', corpo: dados });
}

export function atualizarServico(id, dados) {
    return requisicao(`/servicos/${id}`, { metodo: 'PUT', corpo: dados });
}

export function concluirServico(id) {
    return requisicao(`/servicos/${id}/concluir`, { metodo: 'PUT' });
}

export function cancelarServico(id) {
    return requisicao(`/servicos/${id}/cancelar`, { metodo: 'PUT' });
}

export function excluirServico(id) {
    return requisicao(`/servicos/${id}`, { metodo: 'DELETE' });
}

export function listarServicosDoContratante(contratanteId, { pagina = 0, tamanho = 20 } = {}) {
    return requisicao(`/servicos/contratante/${contratanteId}`, {
        query: { page: pagina, size: tamanho },
    });
}

export function listarServicosDoContratado(contratadoId, { pagina = 0, tamanho = 20 } = {}) {
    return requisicao(`/servicos/contratado/${contratadoId}`, {
        query: { page: pagina, size: tamanho },
    });
}

export function candidatar(servicoId, contratadoId) {
    return requisicao(`/candidaturas/servico/${servicoId}/contratado/${contratadoId}`, {
        metodo: 'POST',
    });
}

export function aceitarCandidatura(id) {
    return requisicao(`/candidaturas/${id}/aceitar`, { metodo: 'PUT' });
}

export function listarCandidaturasPorServico(servicoId, { pagina = 0, tamanho = 20 } = {}) {
    return requisicao(`/candidaturas/servico/${servicoId}`, {
        query: { page: pagina, size: tamanho },
    });
}

export function listarCandidaturasDoContratado(contratadoId, { pagina = 0, tamanho = 20 } = {}) {
    return requisicao(`/candidaturas/contratado/${contratadoId}`, {
        query: { page: pagina, size: tamanho },
    });
}

export function listarCandidaturasPendentes({ pagina = 0, tamanho = 30 } = {}) {
    return requisicao('/candidaturas/pendentes', {
        query: { page: pagina, size: tamanho },
    });
}

export function contarCandidaturasPendentes() {
    return requisicao('/candidaturas/pendentes/quantidade');
}

export function listarMensagens(servicoId, { pagina = 0, tamanho = 50 } = {}) {
    return requisicao(`/mensagens/servico/${servicoId}`, {
        query: { page: pagina, size: tamanho },
    });
}

export function enviarMensagem(servicoId, remetenteId, conteudo) {
    return requisicao(`/mensagens/servico/${servicoId}/remetente/${remetenteId}`, {
        metodo: 'POST',
        corpo: { conteudo },
    });
}

export function listarConversas() {
    return requisicao('/conversas');
}

export function avaliar(servicoId, avaliadorId, avaliadoId, { nota, comentario }) {
    return requisicao(
        `/avaliacoes/servico/${servicoId}/avaliador/${avaliadorId}/avaliado/${avaliadoId}`,
        { metodo: 'POST', corpo: { nota, comentario } }
    );
}

export function listarAvaliacoes(avaliadoId, { pagina = 0, tamanho = 20 } = {}) {
    return requisicao(`/avaliacoes/avaliado/${avaliadoId}`, {
        query: { page: pagina, size: tamanho },
    });
}

export function buscarMinhaAvaliacao(servicoId) {
    return requisicao(`/avaliacoes/servico/${servicoId}/minha`);
}

export function jaAvalieiServico(servicoId) {
    return requisicao(`/avaliacoes/servico/${servicoId}/ja-avaliei`);
}

export function listarNotificacoes() {
    return requisicao('/notificacoes');
}

export function contarNotificacoesNaoLidas() {
    return requisicao('/notificacoes/nao-lidas/quantidade');
}

export function marcarNotificacaoLida(id) {
    return requisicao(`/notificacoes/${id}/ler`, { metodo: 'PUT' });
}

export function marcarTodasNotificacoesLidas() {
    return requisicao('/notificacoes/ler-todas', { metodo: 'PUT' });
}

export function criarReporte(dados) {
    return requisicao('/reportes', { metodo: 'POST', corpo: dados });
}

export function listarMeusReportes() {
    return requisicao('/reportes/meus');
}

export function listarReportes() {
    return requisicao('/reportes');
}

export function contarReportesAbertos() {
    return requisicao('/reportes/abertos/quantidade');
}

export function iniciarAnaliseReporte(id) {
    return requisicao(`/reportes/${id}/analisar`, { metodo: 'PUT' });
}

export function resolverReporte(id, resposta) {
    return requisicao(`/reportes/${id}/resolver`, { metodo: 'PUT', corpo: { resposta } });
}

export function resumoAdministrativo() {
    return requisicao('/admin/resumo');
}

export function listarUsuarios({ pagina = 0, tamanho = 30 } = {}) {
    return requisicao('/usuarios', { query: { page: pagina, size: tamanho } });
}

export function listarTodosServicos({ pagina = 0, tamanho = 30 } = {}) {
    return requisicao('/servicos', { query: { page: pagina, size: tamanho } });
}
