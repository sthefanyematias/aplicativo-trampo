export function apenasDigitos(valor) {
    return String(valor ?? '').replace(/\D/g, '');
}

export function validarCpf(valor) {
    const cpf = apenasDigitos(valor);

    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma = soma + Number(cpf[i]) * (10 - i);
    }

    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== Number(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma = soma + Number(cpf[i]) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;

    return resto === Number(cpf[10]);
}

export function validarCnpj(valor) {
    const cnpj = apenasDigitos(valor);

    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    function calcularDigito(base) {
        const pesos =
            base.length === 12
                ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
                : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        let soma = 0;
        for (let i = 0; i < base.length; i++) {
            soma = soma + Number(base[i]) * pesos[i];
        }

        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    const primeiro = calcularDigito(cnpj.substring(0, 12));
    if (primeiro !== Number(cnpj[12])) return false;

    const segundo = calcularDigito(cnpj.substring(0, 13));
    return segundo === Number(cnpj[13]);
}

export function validarDocumento(valor, tipoPessoa) {
    if (tipoPessoa === 'PESSOA_JURIDICA') return validarCnpj(valor);
    return validarCpf(valor);
}