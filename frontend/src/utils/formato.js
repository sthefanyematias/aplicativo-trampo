export function formatarDinheiro(valor) {
    const numero = Number(valor);
    if (isNaN(numero)) return 'R$ 0,00';
    return 'R$ ' + numero.toFixed(2).replace('.', ',');
}

export function formatarData(texto) {
    if (!texto) return '';
    const partes = String(texto).split('T')[0].split('-');
    if (partes.length !== 3) return '';
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

export function formatarHora(texto) {
    if (!texto) return '';
    const partes = String(texto).split('T');
    const hora = partes.length > 1 ? partes[1] : String(texto);
    return hora.substring(0, 5);
}

export function nomePeriodo(periodo) {
    if (periodo === 'MANHA') return 'Manhã';
    if (periodo === 'TARDE') return 'Tarde';
    if (periodo === 'NOITE') return 'Noite';
    return '';
}

export function formatarQuando(data, horaInicio, horaFim, periodo) {
    const partes = [];
    const dia = formatarData(data);
    const inicio = formatarHora(horaInicio);
    const fim = formatarHora(horaFim);
    const nome = nomePeriodo(periodo);

    if (dia) partes.push(dia);
    if (inicio && fim) partes.push(inicio + ' às ' + fim);
    if (nome) partes.push('(' + nome + ')');

    return partes.join(' · ');
}

export function primeiroNome(nome) {
    if (!nome) return '';
    return String(nome).trim().split(' ')[0];
}

export function nomeCompleto(pessoa) {
    if (!pessoa) return 'Não informado';
    return ((pessoa.nome || '') + ' ' + (pessoa.sobrenome || '')).trim() || 'Não informado';
}

export function montarEndereco(perfil) {
    if (!perfil) return '';

    const partes = [];
    const linha = [perfil.logradouro, perfil.numero].filter(Boolean).join(', ');

    if (linha) partes.push(linha);
    if (perfil.complemento) partes.push(perfil.complemento);
    if (perfil.bairro) partes.push(perfil.bairro);

    const cidade = [perfil.cidade, perfil.uf].filter(Boolean).join('/');
    if (cidade) partes.push(cidade);

    return partes.join(' - ');
}

export function limparNome(valor) {
    return String(valor ?? '')
        .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' ]/g, '')
        .replace(/\s{2,}/g, ' ');
}

export function mascararTelefone(valor) {
    const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 11);
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 6) return '(' + digitos.slice(0, 2) + ') ' + digitos.slice(2);
    if (digitos.length <= 10) {
        return '(' + digitos.slice(0, 2) + ') ' + digitos.slice(2, 6) + '-' + digitos.slice(6);
    }
    return '(' + digitos.slice(0, 2) + ') ' + digitos.slice(2, 7) + '-' + digitos.slice(7);
}

export function mascararCpfCnpj(valor, tipoPessoa) {
    const ehJuridica = tipoPessoa === 'PESSOA_JURIDICA';
    const limite = ehJuridica ? 14 : 11;
    const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, limite);

    if (ehJuridica) {
        if (digitos.length <= 2) return digitos;
        if (digitos.length <= 5) return digitos.slice(0, 2) + '.' + digitos.slice(2);
        if (digitos.length <= 8) {
            return digitos.slice(0, 2) + '.' + digitos.slice(2, 5) + '.' + digitos.slice(5);
        }
        if (digitos.length <= 12) {
            return (
                digitos.slice(0, 2) +
                '.' +
                digitos.slice(2, 5) +
                '.' +
                digitos.slice(5, 8) +
                '/' +
                digitos.slice(8)
            );
        }
        return (
            digitos.slice(0, 2) +
            '.' +
            digitos.slice(2, 5) +
            '.' +
            digitos.slice(5, 8) +
            '/' +
            digitos.slice(8, 12) +
            '-' +
            digitos.slice(12)
        );
    }

    if (digitos.length <= 3) return digitos;
    if (digitos.length <= 6) return digitos.slice(0, 3) + '.' + digitos.slice(3);
    if (digitos.length <= 9) {
        return digitos.slice(0, 3) + '.' + digitos.slice(3, 6) + '.' + digitos.slice(6);
    }
    return (
        digitos.slice(0, 3) +
        '.' +
        digitos.slice(3, 6) +
        '.' +
        digitos.slice(6, 9) +
        '-' +
        digitos.slice(9)
    );
}

export function validarCpf(valor) {
    const cpf = String(valor ?? '').replace(/\D/g, '');

    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += Number(cpf[i]) * (10 - i);
    }

    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== Number(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += Number(cpf[i]) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;

    return resto === Number(cpf[10]);
}

export function validarCnpj(valor) {
    const cnpj = String(valor ?? '').replace(/\D/g, '');

    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    function calcularDigito(base) {
        let peso = base.length - 7;
        let soma = 0;

        for (let i = 0; i < base.length; i++) {
            soma += Number(base[i]) * peso;
            peso -= 1;
            if (peso < 2) peso = 9;
        }

        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    const primeiro = calcularDigito(cnpj.substring(0, 12));
    if (primeiro !== Number(cnpj[12])) return false;

    const segundo = calcularDigito(cnpj.substring(0, 13));
    return segundo === Number(cnpj[13]);
}

export function mascararCep(valor) {
    const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 8);
    if (digitos.length <= 5) return digitos;
    return digitos.slice(0, 5) + '-' + digitos.slice(5);
}

export function mascararData(valor) {
    const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 8);
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 4) return digitos.slice(0, 2) + '/' + digitos.slice(2);
    return digitos.slice(0, 2) + '/' + digitos.slice(2, 4) + '/' + digitos.slice(4);
}

export function mascararHora(valor) {
    const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, 4);
    if (digitos.length <= 2) return digitos;
    return digitos.slice(0, 2) + ':' + digitos.slice(2);
}