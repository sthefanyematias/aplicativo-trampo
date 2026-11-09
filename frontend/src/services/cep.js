export async function buscarCep(cep) {
    const numeros = String(cep ?? '').replace(/\D/g, '');

    if (numeros.length !== 8) {
        throw new Error('Digite um CEP com 8 números.');
    }

    let resposta;

    try {
        resposta = await fetch('https://viacep.com.br/ws/' + numeros + '/json/');
    } catch {
        throw new Error('Não foi possível consultar o CEP. Verifique sua conexão.');
    }

    if (!resposta.ok) {
        throw new Error('Não foi possível consultar o CEP.');
    }

    const dados = await resposta.json();

    if (!dados || dados.erro) {
        throw new Error('CEP não encontrado.');
    }

    return {
        cep: numeros,
        logradouro: dados.logradouro || '',
        bairro: dados.bairro || '',
        cidade: dados.localidade || '',
        uf: dados.uf || '',
    };
}