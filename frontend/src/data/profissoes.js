const LISTA = [
    { valor: 'PEDREIRO', rotulo: 'Pedreiro(a)' },
    { valor: 'SERVENTE', rotulo: 'Servente de obras' },
    { valor: 'PINTOR', rotulo: 'Pintor(a)' },
    { valor: 'ELETRICISTA', rotulo: 'Eletricista' },
    { valor: 'ENCANADOR', rotulo: 'Encanador(a) / Hidráulico' },
    { valor: 'MARCENEIRO', rotulo: 'Marceneiro(a)' },
    { valor: 'GESSEIRO', rotulo: 'Gesseiro(a)' },
    { valor: 'AZULEJISTA', rotulo: 'Azulejista' },
    { valor: 'SERRALHEIRO', rotulo: 'Serralheiro(a)' },
    { valor: 'TELHADISTA', rotulo: 'Telhadista' },
    { valor: 'VIDRACEIRO', rotulo: 'Vidraceiro(a)' },
    { valor: 'FAXINEIRA', rotulo: 'Faxineira(o) / Diarista' },
    { valor: 'PASSADEIRA', rotulo: 'Passadeira(o)' },
    { valor: 'BABA', rotulo: 'Babá' },
    { valor: 'CUIDADOR_IDOSOS', rotulo: 'Cuidador(a) de idosos' },
    { valor: 'COZINHEIRA', rotulo: 'Cozinheira(o)' },
    { valor: 'MOTORISTA_VAN', rotulo: 'Motorista de van escolar' },
    { valor: 'MOTORISTA_APP', rotulo: 'Motorista de aplicativo' },
    { valor: 'MOTOBOY', rotulo: 'Motoboy / Entregador(a)' },
    { valor: 'JARDINEIRO', rotulo: 'Jardineiro(a)' },
    { valor: 'AR_CONDICIONADO', rotulo: 'Técnico(a) de ar-condicionado' },
    { valor: 'INFORMATICA', rotulo: 'Técnico(a) de informática' },
    { valor: 'MANICURE', rotulo: 'Manicure / Pedicure' },
    { valor: 'CABELEIREIRO', rotulo: 'Cabeleireiro(a)' },
    { valor: 'BARBEIRO', rotulo: 'Barbeiro(a)' },
    { valor: 'COSTUREIRA', rotulo: 'Costureira(o)' },
    { valor: 'FOTOGRAFO', rotulo: 'Fotógrafo(a)' },
    { valor: 'PROFESSOR', rotulo: 'Professor(a) particular' },
    { valor: 'PERSONAL', rotulo: 'Personal trainer' },
    { valor: 'GARCOM', rotulo: 'Garçom / Garçonete' },
    { valor: 'CHURRASQUEIRO', rotulo: 'Churrasqueiro(a)' },
    { valor: 'MUDANCAS', rotulo: 'Mudanças / Carregador' },
    { valor: 'PISCINA', rotulo: 'Limpeza de piscina' },
    { valor: 'MARIDO_DE_ALUGUEL', rotulo: 'Marido de aluguel / Reparos gerais' },
];

const OUTROS = { valor: 'OUTROS', rotulo: 'Outros' };

export const PROFISSOES = [...LISTA]
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR', { sensitivity: 'base' }))
    .concat(OUTROS);

export const DIAS_SEMANA = [
    { valor: 'SEG', rotulo: 'Seg' },
    { valor: 'TER', rotulo: 'Ter' },
    { valor: 'QUA', rotulo: 'Qua' },
    { valor: 'QUI', rotulo: 'Qui' },
    { valor: 'SEX', rotulo: 'Sex' },
    { valor: 'SAB', rotulo: 'Sáb' },
    { valor: 'DOM', rotulo: 'Dom' },
];

export const FAIXAS_HORARIO = [
    { valor: 'MANHA', rotulo: 'Manhã (06:00 às 12:00)' },
    { valor: 'TARDE', rotulo: 'Tarde (12:00 às 18:00)' },
    { valor: 'NOITE', rotulo: 'Noite (18:00 às 22:00)' },
    { valor: 'COMERCIAL', rotulo: 'Comercial (08:00 às 17:00)' },
    { valor: 'INTEGRAL', rotulo: 'Integral (08:00 às 18:00)' },
    { valor: 'FLEXIVEL', rotulo: 'Flexível (a combinar)' },
];

export function rotuloDaProfissao(valor) {
    const encontrada = PROFISSOES.find((item) => item.valor === valor);
    return encontrada ? encontrada.rotulo : '';
}

export function montarDisponibilidade(dias, faixas) {
    const nomes = DIAS_SEMANA.filter((dia) => dias.includes(dia.valor)).map((dia) => dia.rotulo);

    const rotulos = FAIXAS_HORARIO.filter((faixa) => faixas.includes(faixa.valor)).map(
        (faixa) => faixa.rotulo
    );

    if (!nomes.length || !rotulos.length) return '';

    return nomes.join(', ') + ' | ' + rotulos.join(', ');
}

export function separarDisponibilidade(texto) {
    if (!texto) return { dias: [], faixas: [] };

    const partes = String(texto).split('|');
    if (partes.length < 2) return { dias: [], faixas: [] };

    const diasTexto = partes[0];
    const faixasTexto = partes[1];

    const dias = DIAS_SEMANA.filter((dia) => diasTexto.includes(dia.rotulo)).map((dia) => dia.valor);

    const faixas = FAIXAS_HORARIO.filter((faixa) => faixasTexto.includes(faixa.rotulo)).map(
        (faixa) => faixa.valor
    );

    return { dias: dias, faixas: faixas };
}

export function separarProfissao(texto) {
    if (!texto) return { profissao: '', outro: '' };

    const limpo = String(texto).trim();

    if (limpo.toLowerCase().startsWith('outros:')) {
        return { profissao: 'OUTROS', outro: limpo.substring(7).trim() };
    }

    const encontrada = PROFISSOES.find((item) => item.rotulo === limpo);

    if (encontrada) return { profissao: encontrada.valor, outro: '' };

    return { profissao: 'OUTROS', outro: limpo };
}