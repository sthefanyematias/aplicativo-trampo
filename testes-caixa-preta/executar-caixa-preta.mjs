
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_SENHA = process.env.ADMIN_SENHA || '';

const SAIDA = path.resolve(process.cwd());
const DIR_EVIDENCIAS = path.join(SAIDA, 'evidencias');
const SUFIXO = String(Date.now()).slice(-7);
const SENHA = process.env.TESTE_SENHA || 'Trampo@2026';

const resultados = [];
const estado = {};
let adminToken = null;

function garantirDiretorios() {
  fs.mkdirSync(DIR_EVIDENCIAS, { recursive: true });
}

async function api(metodo, caminho, opcoes = {}) {
  const headers = { Accept: 'application/json' };
  if (opcoes.corpo !== undefined) headers['Content-Type'] = 'application/json';

  const token = opcoes.tokenBruto !== undefined ? opcoes.tokenBruto : opcoes.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  const iniciou = Date.now();

  let resposta;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers,
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
      signal: AbortSignal.timeout(20000),
    });
  } catch (erro) {
    return {
      status: 0,
      json: null,
      texto: '',
      erroRede: erro?.message || String(erro),
      duracaoMs: Date.now() - iniciou,
    };
  }

  const texto = await resposta.text().catch(() => '');
  let json = null;
  if (texto) {
    try {
      json = JSON.parse(texto);
    } catch {
      json = null;
    }
  }

  return {
    status: resposta.status,
    json,
    texto,
    duracaoMs: Date.now() - iniciou,
  };
}

function resumirTexto(valor, limite = 180) {
  if (valor === null || valor === undefined) return '';
  const texto = typeof valor === 'string' ? valor : JSON.stringify(valor);
  const limpo = texto.replace(/\s+/g, ' ').trim();
  return limpo.length > limite ? `${limpo.slice(0, limite)}...` : limpo;
}

function mensagemDaResposta(resposta) {
  const corpo = resposta.json;
  if (!corpo) return resumirTexto(resposta.texto, 120) || '(corpo vazio)';
  if (typeof corpo === 'object') {
    const chave = corpo.mensagem || corpo.message || corpo.erro || corpo.error;
    if (chave) return String(chave);
    if (Array.isArray(corpo)) return `${corpo.length} registro(s) retornado(s)`;
    if (corpo.conteudo && Array.isArray(corpo.conteudo)) {
      return `pagina com ${corpo.conteudo.length} registro(s) de ${corpo.total ?? '?'}`;
    }
    if (corpo.id !== undefined) return `registro id ${corpo.id}`;
    if (corpo.total !== undefined) return `total ${corpo.total}`;
  }
  return resumirTexto(resposta.texto, 120);
}

function slug(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function registrar(caso) {
  const veredito = caso.bloqueado
    ? 'BLOQUEADO'
    : caso.passos.every((p) => p.statusValido)
      ? 'APROVADO'
      : 'REPROVADO';

  const statusObtido = caso.passos.map((p) => p.resposta.status).join(' / ');
  const mensagem = caso.passos.map((p) => mensagemDaResposta(p.resposta)).join(' | ');

  const registro = {
    ct: caso.ct,
    requisito: caso.requisito,
    tecnica: caso.tecnica,
    requisicao: caso.requisicao,
    entrada: caso.entrada,
    esperado: caso.esperado,
    statusObtido,
    mensagem,
    veredito,
    observacao: caso.observacao || '',
    arquivo: `CT${caso.ct}_${slug(caso.nome)}.json`,
    passos: caso.passos.map((p) => ({
      descricao: p.descricao,
      esperado: p.esperado,
      status: p.resposta.status,
      mensagem: mensagemDaResposta(p.resposta),
      duracaoMs: p.resposta.duracaoMs,
      corpo: resumirTexto(p.resposta.json ?? p.resposta.texto, 4000),
      resposta: p.resposta.json ?? p.resposta.texto,
    })),
  };

  resultados.push(registro);

  fs.writeFileSync(
    path.join(DIR_EVIDENCIAS, registro.arquivo),
    JSON.stringify(registro, null, 2),
    'utf8'
  );

  const marca = veredito === 'APROVADO' ? 'OK  ' : veredito === 'REPROVADO' ? 'FALHA' : 'BLOQ ';
  console.log(`[${marca}] CT${caso.ct} ${caso.nome} | esperado ${caso.esperado} | obtido ${statusObtido}`);
}

function statusValido(resposta, esperados) {
  return esperados.includes(resposta.status);
}

function corpoContratante(email, nome = 'Geovana', extra = {}) {
  return {
    nome,
    sobrenome: 'Novais',
    email,
    telefone: '11987654321',
    senha: SENHA,
    tipo: 'CONTRATANTE',
    tipoPessoa: 'FISICA',
    cpfCnpj: '12345678909',
    cep: '01310100',
    logradouro: 'Avenida Paulista',
    numero: '1000',
    complemento: 'Apto 51',
    bairro: 'Bela Vista',
    cidade: 'Sao Paulo',
    uf: 'SP',
    latitude: -23.5505,
    longitude: -46.6333,
    ...extra,
  };
}

function corpoContratado(email, nome = 'Ana', extra = {}) {
  return {
    nome,
    sobrenome: 'Ribeiro',
    email,
    telefone: '11912345678',
    senha: SENHA,
    tipo: 'CONTRATADO',
    cep: '04094050',
    logradouro: 'Rua das Diaristas',
    numero: '45',
    bairro: 'Vila Clementino',
    cidade: 'Sao Paulo',
    uf: 'SP',
    latitude: -23.5920,
    longitude: -46.6380,
    raioBuscaKm: 10,
    servicos: 'Diarista, passadoria e organizacao',
    disponibilidade: 'Segunda a sexta, periodo da manha',
    descricao: 'Profissional com cinco anos de experiencia em limpeza residencial.',
    ...extra,
  };
}

function corpoServico(titulo, extra = {}) {
  return {
    titulo,
    descricao: 'Servico de limpeza residencial de apartamento de dois quartos.',
    valor: 180.0,
    dataServico: '2026-12-20',
    horaInicio: '08:00:00',
    horaFim: '12:00:00',
    periodo: 'MANHA',
    ...extra,
  };
}

function distanciaKm(lat1, lon1, lat2, lon2) {
  const raioTerra = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return raioTerra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function cadastrar(corpo) {
  return api('POST', '/usuarios', { corpo });
}

async function login(email, senha) {
  return api('POST', '/auth/login', { corpo: { email, senha } });
}

async function executar() {
  garantirDiretorios();

  console.log(`Executor de caixa preta do Trampo`);
  console.log(`API: ${BASE}`);
  console.log(`Saida: ${SAIDA}`);
  console.log('');

  const sonda = await login('sonda@trampo.test', 'senha-invalida');
  if (sonda.erroRede) {
    console.error(`Falha ao contatar a API em ${BASE}: ${sonda.erroRede}`);
    console.error('Verifique se o backend esta em execucao e se a porta esta correta.');
    process.exit(1);
  }
  if (sonda.status !== 401) {
    console.error(`Esperado 401 na verificacao inicial, obtido ${sonda.status}.`);
    console.error('A URL aponta para outro servico ou o endpoint /auth/login foi alterado.');
    process.exit(1);
  }

  if (ADMIN_EMAIL && ADMIN_SENHA) {
    const respostaAdmin = await login(ADMIN_EMAIL, ADMIN_SENHA);
    if (respostaAdmin.status === 200 && respostaAdmin.json?.token) {
      adminToken = respostaAdmin.json.token;
      console.log('Autenticacao administrativa confirmada.');
    } else {
      console.log(`Aviso: nao foi possivel autenticar o administrador (status ${respostaAdmin.status}).`);
    }
  } else {
    console.log('Aviso: ADMIN_EMAIL e ADMIN_SENHA nao informados; casos administrativos serao registrados como BLOQUEADOS.');
  }
  console.log('');

  const emailContratante = `contratante.${SUFIXO}@trampo.test`;
  const emailContratado = `contratado.${SUFIXO}@trampo.test`;
  const emailContratanteB = `contratante.b.${SUFIXO}@trampo.test`;
  const emailContratadoB = `contratado.b.${SUFIXO}@trampo.test`;

  const respContratante = await cadastrar(corpoContratante(emailContratante));
  const contratante = {
    id: respContratante.json?.contratanteId,
    usuarioId: respContratante.json?.id,
    email: emailContratante,
  };

  registrar({
    ct: '01',
    nome: 'Cadastro_Contratante',
    requisito: 'RF01',
    tecnica: 'Particionamento de equivalencia e tabela de decisao',
    requisicao: 'POST /usuarios',
    entrada: `nome, sobrenome, e-mail ${emailContratante}, telefone, senha com 10 caracteres, tipo CONTRATANTE, tipo de pessoa e CPF, endereco completo, latitude e longitude`,
    esperado: '201',
    passos: [
      {
        descricao: 'Cadastro do contratante com dados validos',
        esperado: '201 Created com usuario e perfil criados',
        statusValido: statusValido(respContratante, [201]),
        resposta: respContratante,
      },
    ],
  });

  const respContratado = await cadastrar(corpoContratado(emailContratado));
  const contratado = {
    id: respContratado.json?.contratadoId,
    usuarioId: respContratado.json?.id,
    email: emailContratado,
  };

  registrar({
    ct: '02',
    nome: 'Cadastro_Contratado',
    requisito: 'RF01',
    tecnica: 'Particionamento de equivalencia e tabela de decisao',
    requisicao: 'POST /usuarios',
    entrada: `servicos, disponibilidade, descricao e raio de busca de 10 km, todos validos, com e-mail ${emailContratado}`,
    esperado: '201',
    passos: [
      {
        descricao: 'Cadastro do contratado com dados validos',
        esperado: '201 Created com usuario e perfil criados',
        statusValido: statusValido(respContratado, [201]),
        resposta: respContratado,
      },
    ],
  });

  const respDuplicado = await cadastrar(corpoContratante(emailContratante));
  registrar({
    ct: '03',
    nome: 'Cadastro_Email_Duplicado',
    requisito: 'RF01',
    tecnica: 'Particionamento de equivalencia',
    requisicao: 'POST /usuarios',
    entrada: `mesmo e-mail ${emailContratante} ja cadastrado no CT01`,
    esperado: '409',
    passos: [
      {
        descricao: 'Tentativa de cadastro com e-mail existente',
        esperado: '409 Conflict com mensagem de e-mail ja cadastrado',
        statusValido: statusValido(respDuplicado, [409]),
        resposta: respDuplicado,
      },
    ],
  });

  const corpoAdmin = corpoContratante(`admin.teste.${SUFIXO}@trampo.test`, 'Administrador');
  corpoAdmin.tipo = 'ADMIN';

  const respAdminPublico = await cadastrar(corpoAdmin);
  registrar({
    ct: '04',
    nome: 'Cadastro_Administrador_Bloqueado',
    requisito: 'RF01',
    tecnica: 'Tabela de decisao',
    requisicao: 'POST /usuarios',
    entrada: 'cadastro com tipo ADMIN pela rota publica',
    esperado: '400',
    passos: [
      {
        descricao: 'Tentativa de criar administrador pela rota publica',
        esperado: '400 Bad Request com recusa da regra de negocio',
        statusValido: statusValido(respAdminPublico, [400]),
        resposta: respAdminPublico,
      },
    ],
  });

  const corpoSenhaCurta = corpoContratado(`senha.curta.${SUFIXO}@trampo.test`);
  corpoSenhaCurta.senha = 'Abc@123';
  const respSenhaCurta = await cadastrar(corpoSenhaCurta);

  const corpoSenhaLimite = corpoContratado(`senha.limite.${SUFIXO}@trampo.test`);
  corpoSenhaLimite.senha = 'Abc@1234';
  const respSenhaLimite = await cadastrar(corpoSenhaLimite);

  registrar({
    ct: '05',
    nome: 'Cadastro_Senha_Curta',
    requisito: 'RF01',
    tecnica: 'Analise de valor limite',
    requisicao: 'POST /usuarios',
    entrada: 'senha com sete caracteres e senha com oito caracteres',
    esperado: '400 / 201',
    passos: [
      {
        descricao: 'Sete caracteres, abaixo do limite',
        esperado: '400 Bad Request',
        statusValido: statusValido(respSenhaCurta, [400]),
        resposta: respSenhaCurta,
      },
      {
        descricao: 'Oito caracteres, no limite da partição valida',
        esperado: '201 Created',
        statusValido: statusValido(respSenhaLimite, [201]),
        resposta: respSenhaLimite,
      },
    ],
  });

  const respContratanteB = await cadastrar(
    corpoContratante(emailContratanteB, 'Patricia', {
      cpfCnpj: '98765432100',
      latitude: -23.6100,
      longitude: -46.6950,
    })
  );
  const contratanteB = {
    id: respContratanteB.json?.contratanteId,
    usuarioId: respContratanteB.json?.id,
    email: emailContratanteB,
  };

  const respContratadoB = await cadastrar(
    corpoContratado(emailContratadoB, 'Bruno', {
      latitude: -23.5850,
      longitude: -46.6500,
      servicos: 'Ajudante de obra e auxiliar de mudanca',
      disponibilidade: 'Sabados e domingos, periodo da tarde',
      descricao: 'Auxiliar de mudanca com experiencia em transporte de moveis.',
    })
  );
  const contratadoB = {
    id: respContratadoB.json?.contratadoId,
    usuarioId: respContratadoB.json?.id,
    email: emailContratadoB,
  };

  console.log(`Perfis criados: contratante ${contratante.id}, contratado ${contratado.id}, contratante B ${contratanteB.id}, contratado B ${contratadoB.id}.`);

  const respLogin = await login(contratante.email, SENHA);
  const tokenContratante = respLogin.json?.token || null;
  const tokenContratado = (await login(contratado.email, SENHA)).json?.token || null;
  const tokenContratanteB = (await login(contratanteB.email, SENHA)).json?.token || null;
  const tokenContratadoB = (await login(contratadoB.email, SENHA)).json?.token || null;

  registrar({
    ct: '06',
    nome: 'Login_Valido',
    requisito: 'RF02',
    tecnica: 'Particionamento de equivalencia',
    requisicao: 'POST /auth/login',
    entrada: `e-mail ${contratante.email} e senha correta`,
    esperado: '200',
    passos: [
      {
        descricao: 'Autenticação com credenciais validas',
        esperado: '200 OK com token JWT no corpo',
        statusValido: statusValido(respLogin, [200]) && Boolean(tokenContratante),
        resposta: respLogin,
      },
    ],
  });

  const respSenhaErrada = await login(contratante.email, 'SenhaErrada@1');
  registrar({
    ct: '07',
    nome: 'Login_Senha_Invalida',
    requisito: 'RF02',
    tecnica: 'Particionamento de equivalencia',
    requisicao: 'POST /auth/login',
    entrada: 'e-mail valido e senha incorreta',
    esperado: '401',
    passos: [
      {
        descricao: 'Autenticação com senha incorreta',
        esperado: '401 Unauthorized',
        statusValido: statusValido(respSenhaErrada, [401]),
        resposta: respSenhaErrada,
      },
    ],
  });

  const respSemToken = await api('GET', '/auth/me');
  registrar({
    ct: '08',
    nome: 'Acesso_Sem_Token',
    requisito: 'RF02',
    tecnica: 'Tabela de decisao',
    requisicao: 'GET /auth/me',
    entrada: 'requisicao sem cabecalho Authorization',
    esperado: '401',
    passos: [
      {
        descricao: 'Chamada a rota protegida sem token',
        esperado: '401 Unauthorized',
        statusValido: statusValido(respSemToken, [401]),
        resposta: respSemToken,
      },
    ],
  });

  const respTokenAdulterado = await api('GET', '/auth/me', { tokenBruto: 'aaaaa.bbbbb.ccccc' });
  registrar({
    ct: '09',
    nome: 'Acesso_Token_Invalido',
    requisito: 'RF02',
    tecnica: 'Tabela de decisao',
    requisicao: 'GET /auth/me',
    entrada: 'cabecalho Authorization com token adulterado',
    esperado: '401',
    passos: [
      {
        descricao: 'Chamada com token invalido',
        esperado: '401 Unauthorized',
        statusValido: statusValido(respTokenAdulterado, [401]),
        resposta: respTokenAdulterado,
      },
    ],
  });

  const respAtualizaMeusDados = await api('PUT', '/usuarios/me', {
    token: tokenContratante,
    corpo: { nome: 'Geovana', sobrenome: 'Novais', telefone: '11999990000' },
  });
  registrar({
    ct: '41',
    nome: 'Atualizar_Meus_Dados',
    requisito: 'RF16',
    tecnica: 'Particionamento de equivalencia',
    requisicao: 'PUT /usuarios/me',
    entrada: 'nome, sobrenome e telefone validos do proprio usuario',
    esperado: '200',
    passos: [
      {
        descricao: 'Atualização dos dados do próprio usuário',
        esperado: '200 OK com os dados atualizados',
        statusValido: statusValido(respAtualizaMeusDados, [200]),
        resposta: respAtualizaMeusDados,
      },
    ],
  });

  const respNomeVazio = await api('PUT', '/usuarios/me', {
    token: tokenContratante,
    corpo: { nome: '', sobrenome: 'Novais', telefone: '11999990000' },
  });
  registrar({
    ct: '42',
    nome: 'Atualizar_Dados_Sem_Nome',
    requisito: 'RF16',
    tecnica: 'Analise de valor limite',
    requisicao: 'PUT /usuarios/me',
    entrada: 'campo nome vazio',
    esperado: '400',
    passos: [
      {
        descricao: 'Atualização com nome vazio',
        esperado: '400 Bad Request com mensagem de campo obrigatorio',
        statusValido: statusValido(respNomeVazio, [400]),
        resposta: respNomeVazio,
      },
    ],
  });

  const corpoContratadoAtualizado = {
    descricao: 'Profissional com cinco anos de experiencia em limpeza residencial e comercial.',
    servicos: 'Diarista, passadoria e organizacao',
    disponibilidade: 'Segunda a sexta, periodo da manha',
    cep: '04094050',
    logradouro: 'Rua das Diaristas',
    numero: '45',
    complemento: 'Casa 2',
    bairro: 'Vila Clementino',
    cidade: 'Sao Paulo',
    uf: 'SP',
    latitude: -23.5920,
    longitude: -46.6380,
    raioBuscaKm: 12,
  };

  const respPerfilContratado = await api('PUT', '/contratados/me', {
    token: tokenContratado,
    corpo: corpoContratadoAtualizado,
  });
  registrar({
    ct: '10',
    nome: 'Perfil_Contratado_Atualizar',
    requisito: 'RF03',
    tecnica: 'Particionamento de equivalencia',
    requisicao: 'PUT /contratados/me',
    entrada: 'atualizacao de descricao, servicos, disponibilidade, endereco e raio de busca',
    esperado: '200',
    passos: [
      {
        descricao: 'Atualização do próprio perfil de contratado',
        esperado: '200 OK com perfil atualizado',
        statusValido: statusValido(respPerfilContratado, [200]),
        resposta: respPerfilContratado,
      },
    ],
  });

  const respPerfilContratante = await api('PUT', '/contratantes/me', {
    token: tokenContratante,
    corpo: {
      tipoPessoa: 'FISICA',
      cpfCnpj: '12345678909',
      cep: '01310100',
      logradouro: 'Avenida Paulista',
      numero: '1000',
      complemento: 'Apto 51',
      bairro: 'Bela Vista',
      cidade: 'Sao Paulo',
      uf: 'SP',
      latitude: -23.5505,
      longitude: -46.6333,
    },
  });
  registrar({
    ct: '12',
    nome: 'Perfil_Contratante_Atualizar',
    requisito: 'RF04',
    tecnica: 'Particionamento de equivalencia',
    requisicao: 'PUT /contratantes/me',
    entrada: 'atualizacao de documento e endereco de referencia',
    esperado: '200',
    passos: [
      {
        descricao: 'Atualização do próprio perfil de contratante',
        esperado: '200 OK com perfil atualizado',
        statusValido: statusValido(respPerfilContratante, [200]),
        resposta: respPerfilContratante,
      },
    ],
  });

  const respServico1 = await api('POST', `/servicos/contratante/${contratante.id}`, {
    token: tokenContratante,
    corpo: corpoServico(`Limpeza de apartamento ${SUFIXO}`),
  });
  const servico1 = { id: respServico1.json?.id };

  registrar({
    ct: '14',
    nome: 'Publicar_Servico',
    requisito: 'RF05',
    tecnica: 'Caso de uso e particionamento de equivalencia',
    requisicao: `POST /servicos/contratante/${contratante.id}`,
    entrada: 'titulo, descricao, valor, data, faixa de horario, periodo e local herdado do perfil',
    esperado: '201',
    passos: [
      {
        descricao: 'Publicação de serviço com dados completos',
        esperado: '201 Created com serviço no estado ABERTO',
        statusValido: statusValido(respServico1, [201]) && respServico1.json?.status === 'ABERTO',
        resposta: respServico1,
      },
    ],
  });

  const respHorarioIgual = await api('POST', `/servicos/contratante/${contratante.id}`, {
    token: tokenContratante,
    corpo: corpoServico(`Horario igual ${SUFIXO}`, { horaInicio: '08:00:00', horaFim: '08:00:00' }),
  });
  const respHorarioAnterior = await api('POST', `/servicos/contratante/${contratante.id}`, {
    token: tokenContratante,
    corpo: corpoServico(`Horario anterior ${SUFIXO}`, { horaInicio: '09:00:00', horaFim: '08:59:00' }),
  });

  registrar({
    ct: '15',
    nome: 'Publicar_Horario_Invalido',
    requisito: 'RF05',
    tecnica: 'Analise de valor limite',
    requisicao: `POST /servicos/contratante/${contratante.id}`,
    entrada: 'horario final igual ao inicial e horario final um minuto antes do inicial',
    esperado: '400 / 400',
    passos: [
      {
        descricao: 'Horário final igual ao inicial',
        esperado: '400 Bad Request',
        statusValido: statusValido(respHorarioIgual, [400]),
        resposta: respHorarioIgual,
      },
      {
        descricao: 'Horário final um minuto antes do inicial',
        esperado: '400 Bad Request',
        statusValido: statusValido(respHorarioAnterior, [400]),
        resposta: respHorarioAnterior,
      },
    ],
  });

  const respServicoLonge = await api('POST', `/servicos/contratante/${contratanteB.id}`, {
    token: tokenContratanteB,
    corpo: corpoServico(`Mudanca residencial ${SUFIXO}`, {
      valor: 450.0,
      dataServico: '2026-12-21',
      horaInicio: '13:00:00',
      horaFim: '18:00:00',
      periodo: 'TARDE',
      latitude: -23.6100,
      longitude: -46.6950,
    }),
  });

  const respServicoMeio = await api('POST', `/servicos/contratante/${contratanteB.id}`, {
    token: tokenContratanteB,
    corpo: corpoServico(`Jardinagem ${SUFIXO}`, {
      valor: 220.0,
      dataServico: '2026-12-22',
      horaInicio: '08:00:00',
      horaFim: '11:00:00',
      periodo: 'MANHA',
      latitude: -23.5600,
      longitude: -46.6400,
    }),
  });
  const servicoMeio = { id: respServicoMeio.json?.id };

  const respProximos = await api(
    'GET',
    `/servicos/proximos?latitude=-23.5505&longitude=-46.6333&raioKm=20&size=50`,
    { token: tokenContratado }
  );
  const listaProximos = Array.isArray(respProximos.json?.conteudo) ? respProximos.json.conteudo : [];
  const idsProximos = listaProximos.map((s) => s.id);
  const posicao1 = idsProximos.indexOf(servico1.id);
  const posicaoMeio = idsProximos.indexOf(servicoMeio.id);

  const distancias = listaProximos.map((s) =>
    s.latitude === null || s.longitude === null
      ? Number.POSITIVE_INFINITY
      : distanciaKm(-23.5505, -46.6333, s.latitude, s.longitude)
  );
  const ordemCrescente = distancias.every((d, i) => i === 0 || distancias[i - 1] <= d + 0.001);
  const ordenado = posicao1 >= 0 && posicaoMeio >= 0 && posicao1 < posicaoMeio && ordemCrescente;

  registrar({
    ct: '20',
    nome: 'Listar_Proximos_Ordenado',
    requisito: 'RF06',
    tecnica: 'Caso de uso e valor limite',
    requisicao: 'GET /servicos/proximos',
    entrada: 'latitude -23.5505, longitude -46.6333 e raio de 20 km',
    esperado: '200',
    passos: [
      {
        descricao: 'Consulta de serviços próximos e conferência da ordenação por distância',
        esperado: '200 OK com os serviços em ordem crescente de distância',
        statusValido: statusValido(respProximos, [200]) && listaProximos.length > 0 && ordenado,
        resposta: respProximos,
      },
    ],
    observacao: `${listaProximos.length} servico(s) retornado(s); distancias em km: ${distancias
      .map((d) => d.toFixed(2))
      .join(', ')}; servico ${servico1.id} na posicao ${posicao1} e servico ${servicoMeio.id} na posicao ${posicaoMeio}.`,
  });

  const respRaioVazio = await api(
    'GET',
    `/servicos/proximos?latitude=-23.7000&longitude=-46.8000&raioKm=1&size=50`,
    { token: tokenContratado }
  );
  const listaVazia = Array.isArray(respRaioVazio.json?.conteudo) && respRaioVazio.json.conteudo.length === 0;

  registrar({
    ct: '21',
    nome: 'Listar_Proximos_Raio_Sem_Resultado',
    requisito: 'RF06',
    tecnica: 'Analise de valor limite',
    requisicao: 'GET /servicos/proximos',
    entrada: 'coordenada sem servicos no entorno e raio de 1 km',
    esperado: '200 com lista vazia',
    passos: [
      {
        descricao: 'Consulta em região sem serviços cadastrados',
        esperado: '200 OK com lista vazia e sem erro',
        statusValido: statusValido(respRaioVazio, [200]) && listaVazia,
        resposta: respRaioVazio,
      },
    ],
  });

  const respCandidatura = await api('POST', `/candidaturas/servico/${servico1.id}/contratado/${contratado.id}`, {
    token: tokenContratado,
  });
  const candidatura1 = { id: respCandidatura.json?.id };

  registrar({
    ct: '22',
    nome: 'Candidatar_Servico_Aberto',
    requisito: 'RF07',
    tecnica: 'Transicao de estados',
    requisicao: `POST /candidaturas/servico/${servico1.id}/contratado/${contratado.id}`,
    entrada: 'candidatura de contratado a servico no estado ABERTO',
    esperado: '201',
    passos: [
      {
        descricao: 'Candidatura a serviço aberto',
        esperado: '201 Created com candidatura PENDENTE',
        statusValido: statusValido(respCandidatura, [201]) && respCandidatura.json?.status === 'PENDENTE',
        resposta: respCandidatura,
      },
    ],
  });

  const respCandidaturaDuplicada = await api(
    'POST',
    `/candidaturas/servico/${servico1.id}/contratado/${contratado.id}`,
    { token: tokenContratado }
  );
  registrar({
    ct: '23',
    nome: 'Candidatar_Duplicada',
    requisito: 'RF07',
    tecnica: 'Tabela de decisao',
    requisicao: `POST /candidaturas/servico/${servico1.id}/contratado/${contratado.id}`,
    entrada: 'segunda candidatura do mesmo contratado ao mesmo servico',
    esperado: '409',
    passos: [
      {
        descricao: 'Segunda candidatura ao mesmo serviço',
        esperado: '409 Conflict',
        statusValido: statusValido(respCandidaturaDuplicada, [409]),
        resposta: respCandidaturaDuplicada,
      },
    ],
  });

  const respCandidaturaMeio = await api(
    'POST',
    `/candidaturas/servico/${servicoMeio.id}/contratado/${contratadoB.id}`,
    { token: tokenContratadoB }
  );

  const respAceite = await api('PUT', `/candidaturas/${candidatura1.id}/aceitar`, {
    token: tokenContratante,
  });
  const servico1AposAceite = await api('GET', `/servicos/${servico1.id}`, { token: tokenContratante });

  registrar({
    ct: '25',
    nome: 'Aceitar_Candidatura',
    requisito: 'RF08',
    tecnica: 'Tabela de decisao e transicao de estados',
    requisicao: `PUT /candidaturas/${candidatura1.id}/aceitar`,
    entrada: 'aceite da candidatura pendente pelo contratante responsavel',
    esperado: '200 / 200',
    passos: [
      {
        descricao: 'Aceite de candidatura pendente',
        esperado: '200 OK com candidatura ACEITA',
        statusValido:
          statusValido(respAceite, [200]) &&
          respAceite.json?.status === 'ACEITA',
        resposta: respAceite,
      },
      {
        descricao: 'Vínculo do contratado e transição para EM_ANDAMENTO',
        esperado: '200 OK com serviço EM_ANDAMENTO e contratado vinculado',
        statusValido:
          statusValido(servico1AposAceite, [200]) &&
          servico1AposAceite.json?.status === 'EM_ANDAMENTO' &&
          Number(servico1AposAceite.json?.contratado?.id) === Number(contratado.id),
        resposta: servico1AposAceite,
      },
    ],
  });

  const respCandidaturaFechada = await api(
    'POST',
    `/candidaturas/servico/${servico1.id}/contratado/${contratadoB.id}`,
    { token: tokenContratadoB }
  );
  registrar({
    ct: '24',
    nome: 'Candidatar_Servico_Fechado',
    requisito: 'RF07',
    tecnica: 'Transicao de estados',
    requisicao: `POST /candidaturas/servico/${servico1.id}/contratado/${contratadoB.id}`,
    entrada: 'candidatura a servico no estado EM_ANDAMENTO',
    esperado: '400',
    passos: [
      {
        descricao: 'Candidatura a serviço que não está aberto',
        esperado: '400 Bad Request',
        statusValido: statusValido(respCandidaturaFechada, [400]),
        resposta: respCandidaturaFechada,
      },
    ],
  });

  const respAceiteRepetido = await api('PUT', `/candidaturas/${candidatura1.id}/aceitar`, {
    token: tokenContratante,
  });
  registrar({
    ct: '26',
    nome: 'Aceitar_Candidatura_Ja_Processada',
    requisito: 'RF08',
    tecnica: 'Tabela de decisao',
    requisicao: `PUT /candidaturas/${candidatura1.id}/aceitar`,
    entrada: 'novo aceite da mesma candidatura, ja ACEITA',
    esperado: '400',
    passos: [
      {
        descricao: 'Aceite de candidatura já processada',
        esperado: '400 Bad Request com mensagem de candidatura já processada',
        statusValido: statusValido(respAceiteRepetido, [400]),
        resposta: respAceiteRepetido,
      },
    ],
  });

  const respAceiteIntruso = await api('PUT', `/candidaturas/${candidatura1.id}/aceitar`, {
    token: tokenContratanteB,
  });
  registrar({
    ct: '27',
    nome: 'Aceitar_Por_Outro_Contratante',
    requisito: 'RF08',
    tecnica: 'Tabela de decisao',
    requisicao: `PUT /candidaturas/${candidatura1.id}/aceitar`,
    entrada: 'aceite por contratante que nao e o responsavel pelo servico',
    esperado: '403',
    passos: [
      {
        descricao: 'Aceite por outro contratante',
        esperado: '403 Forbidden com acesso negado',
        statusValido: statusValido(respAceiteIntruso, [403]),
        resposta: respAceiteIntruso,
      },
    ],
  });

  const respMensagem = await api('POST', `/mensagens/servico/${servico1.id}/remetente/${contratado.usuarioId}`, {
    token: tokenContratado,
    corpo: { conteudo: 'Bom dia, posso chegar as oito horas?' },
  });
  registrar({
    ct: '32',
    nome: 'Enviar_Mensagem',
    requisito: 'RF10',
    tecnica: 'Caso de uso',
    requisicao: `POST /mensagens/servico/${servico1.id}/remetente/${contratado.usuarioId}`,
    entrada: 'mensagem de participante do servico para a outra parte',
    esperado: '201',
    passos: [
      {
        descricao: 'Envio de mensagem por participante',
        esperado: '201 Created com a mensagem registrada',
        statusValido: statusValido(respMensagem, [201]),
        resposta: respMensagem,
      },
    ],
  });

  const respMensagemIntrusa = await api(
    'POST',
    `/mensagens/servico/${servico1.id}/remetente/${contratadoB.usuarioId}`,
    { token: tokenContratadoB, corpo: { conteudo: 'Tenho interesse nesta vaga.' } }
  );
  registrar({
    ct: '33',
    nome: 'Mensagem_Nao_Participante',
    requisito: 'RF10',
    tecnica: 'Tabela de decisao',
    requisicao: `POST /mensagens/servico/${servico1.id}/remetente/${contratadoB.usuarioId}`,
    entrada: 'mensagem de usuario que nao participa do servico',
    esperado: '403',
    passos: [
      {
        descricao: 'Envio de mensagem por não participante',
        esperado: '403 Forbidden com acesso negado',
        statusValido: statusValido(respMensagemIntrusa, [403]),
        resposta: respMensagemIntrusa,
      },
    ],
  });

  const respConversas = await api('GET', '/conversas', { token: tokenContratante });
  const conversaDoServico = Array.isArray(respConversas.json)
    ? respConversas.json.find((c) => Number(c.servicoId ?? c.id) === Number(servico1.id))
    : null;

  registrar({
    ct: '38',
    nome: 'Listar_Conversas',
    requisito: 'RF14',
    tecnica: 'Caso de uso',
    requisicao: 'GET /conversas',
    entrada: 'consulta das conversas do contratante autenticado',
    esperado: '200',
    passos: [
      {
        descricao: 'Listagem das conversas do usuário',
        esperado: '200 OK com titulo do serviço, outra parte e totais',
        statusValido: statusValido(respConversas, [200]) && Boolean(conversaDoServico),
        resposta: respConversas,
      },
    ],
    observacao: conversaDoServico
      ? `Conversa localizada para o servico ${servico1.id}.`
      : 'Conversa do servico nao localizada na resposta.',
  });

  const respLeitura = await api('GET', `/mensagens/servico/${servico1.id}`, { token: tokenContratante });
  const mensagensDoServico = Array.isArray(respLeitura.json?.conteudo) ? respLeitura.json.conteudo : [];
  const recebidas = mensagensDoServico.filter(
    (m) => Number(m.remetente?.id) === Number(contratado.usuarioId)
  );
  const mensagemLida = recebidas.length > 0 && recebidas.every((m) => m.lida === true);
  const respConversasAposLeitura = await api('GET', '/conversas', { token: tokenContratante });
  const conversaAposLeitura = Array.isArray(respConversasAposLeitura.json)
    ? respConversasAposLeitura.json.find((c) => Number(c.servicoId) === Number(servico1.id))
    : null;
  const naoLidasZeradas = conversaAposLeitura ? Number(conversaAposLeitura.naoLidas) === 0 : false;

  registrar({
    ct: '39',
    nome: 'Marcar_Mensagens_Lidas',
    requisito: 'RF14',
    tecnica: 'Transicao de estados',
    requisicao: `GET /mensagens/servico/${servico1.id}`,
    entrada: 'abertura da conversa pelo destinatario',
    esperado: '200',
    passos: [
      {
        descricao: 'Abertura da conversa e marcação das mensagens recebidas como lidas',
        esperado: '200 OK com as mensagens recebidas marcadas como lidas e nenhuma não lida na conversa',
        statusValido: statusValido(respLeitura, [200]) && mensagemLida && naoLidasZeradas,
        resposta: respLeitura,
      },
    ],
  });

  const respCandidaturasServico = await api('GET', `/candidaturas/servico/${servico1.id}`, {
    token: tokenContratante,
  });
  registrar({
    ct: '36',
    nome: 'Consultar_Candidaturas_Do_Servico',
    requisito: 'RF13',
    tecnica: 'Caso de uso',
    requisicao: `GET /candidaturas/servico/${servico1.id}`,
    entrada: 'consulta das candidaturas de um servico pelo contratante responsavel',
    esperado: '200',
    passos: [
      {
        descricao: 'Consulta das candidaturas do serviço',
        esperado: '200 OK com as candidaturas do serviço',
        statusValido: statusValido(respCandidaturasServico, [200]),
        resposta: respCandidaturasServico,
      },
    ],
  });

  const respServicoPendente = await api('POST', `/servicos/contratante/${contratante.id}`, {
    token: tokenContratante,
    corpo: corpoServico(`Passadoria ${SUFIXO}`, {
      valor: 120.0,
      dataServico: '2026-12-23',
      horaInicio: '14:00:00',
      horaFim: '17:00:00',
      periodo: 'TARDE',
    }),
  });
  const servicoPendente = { id: respServicoPendente.json?.id };

  const respCandidaturaPendente = await api(
    'POST',
    `/candidaturas/servico/${servicoPendente.id}/contratado/${contratadoB.id}`,
    { token: tokenContratadoB }
  );
  if (respCandidaturaPendente.status !== 201) {
    console.log(`Aviso: nao foi possivel criar a candidatura pendente do CT37 (status ${respCandidaturaPendente.status}).`);
  }

  const respPendentes = await api('GET', '/candidaturas/pendentes/quantidade', { token: tokenContratante });
  const totalPendentes = Number(respPendentes.json?.total ?? -1);
  registrar({
    ct: '37',
    nome: 'Consultar_Pendentes',
    requisito: 'RF13',
    tecnica: 'Caso de uso',
    requisicao: 'GET /candidaturas/pendentes/quantidade',
    entrada: 'consulta do total de candidaturas pendentes do contratante autenticado',
    esperado: '200',
    passos: [
      {
        descricao: 'Consulta do total de candidaturas pendentes',
        esperado: '200 OK com total igual ou superior a uma candidatura pendente',
        statusValido: statusValido(respPendentes, [200]) && totalPendentes >= 1,
        resposta: respPendentes,
      },
    ],
    observacao: `Total retornado: ${totalPendentes}.`,
  });

  const respServicosContratante = await api('GET', `/servicos/contratante/${contratante.id}?size=50`, {
    token: tokenContratante,
  });
  const conteudoContratante = Array.isArray(respServicosContratante.json?.conteudo)
    ? respServicosContratante.json.conteudo
    : [];
  const ordenadoDesc = conteudoContratante.every(
    (s, i) => i === 0 || new Date(conteudoContratante[i - 1].criadoEm) >= new Date(s.criadoEm)
  );

  registrar({
    ct: '34',
    nome: 'Listar_Servicos_Do_Contratante',
    requisito: 'RF11',
    tecnica: 'Caso de uso',
    requisicao: `GET /servicos/contratante/${contratante.id}`,
    entrada: 'consulta paginada dos servicos publicados pelo proprio contratante',
    esperado: '200',
    passos: [
      {
        descricao: 'Listagem paginada dos serviços do contratante',
        esperado: '200 OK com os serviços em ordem decrescente de criação',
        statusValido: statusValido(respServicosContratante, [200]) && ordenadoDesc,
        resposta: respServicosContratante,
      },
    ],
  });

  const respServicosContratado = await api('GET', `/servicos/contratado/${contratado.id}?size=50`, {
    token: tokenContratado,
  });
  const conteudoContratado = Array.isArray(respServicosContratado.json?.conteudo)
    ? respServicosContratado.json.conteudo
    : [];
  const contemServico1 = conteudoContratado.some((s) => Number(s.id) === Number(servico1.id));

  registrar({
    ct: '35',
    nome: 'Listar_Servicos_Do_Contratado',
    requisito: 'RF12',
    tecnica: 'Caso de uso',
    requisicao: `GET /servicos/contratado/${contratado.id}`,
    entrada: 'consulta paginada dos servicos aceitos pelo proprio contratado',
    esperado: '200',
    passos: [
      {
        descricao: 'Listagem dos serviços aceitos pelo contratado',
        esperado: '200 OK com o serviço aceito na listagem',
        statusValido: statusValido(respServicosContratado, [200]) && contemServico1,
        resposta: respServicosContratado,
      },
    ],
  });

  const respEdicaoEmAndamento = await api('PUT', `/servicos/${servico1.id}`, {
    token: tokenContratante,
    corpo: corpoServico(`Limpeza de apartamento ${SUFIXO}`, { valor: 200.0 }),
  });
  registrar({
    ct: '16',
    nome: 'Editar_Servico_Em_Andamento',
    requisito: 'RF05',
    tecnica: 'Transicao de estados',
    requisicao: `PUT /servicos/${servico1.id}`,
    entrada: 'edicao de servico que ja esta em andamento',
    esperado: '400',
    passos: [
      {
        descricao: 'Edição de serviço já iniciado',
        esperado: '400 Bad Request',
        statusValido: statusValido(respEdicaoEmAndamento, [400]),
        resposta: respEdicaoEmAndamento,
      },
    ],
  });

  const respConcluirAberto = await api('PUT', `/servicos/${servicoMeio.id}/concluir`, {
    token: tokenContratanteB,
  });
  registrar({
    ct: '17',
    nome: 'Concluir_Servico_Aberto',
    requisito: 'RF05',
    tecnica: 'Transicao de estados',
    requisicao: `PUT /servicos/${servicoMeio.id}/concluir`,
    entrada: 'conclusao de servico no estado ABERTO',
    esperado: '400',
    passos: [
      {
        descricao: 'Conclusão de serviço que não está em andamento',
        esperado: '400 Bad Request',
        statusValido: statusValido(respConcluirAberto, [400]),
        resposta: respConcluirAberto,
      },
    ],
  });

  const respConcluir = await api('PUT', `/servicos/${servico1.id}/concluir`, {
    token: tokenContratante,
  });

  const respAvaliacao = await api(
    'POST',
    `/avaliacoes/servico/${servico1.id}/avaliador/${contratante.usuarioId}/avaliado/${contratado.usuarioId}`,
    {
      token: tokenContratante,
      corpo: { nota: 5, comentario: 'Servico impecavel, pontual e muito atenciosa.' },
    }
  );

  const respPerfilAvaliado = await api('GET', `/contratados/${contratado.id}`, { token: tokenContratante });
  const mediaAvaliacao = respPerfilAvaliado.json?.mediaAvaliacao;

  registrar({
    ct: '28',
    nome: 'Avaliar_Servico_Concluido',
    requisito: 'RF09',
    tecnica: 'Caso de uso, tabela de decisao e transicao de estados',
    requisicao: `PUT /servicos/${servico1.id}/concluir e POST /avaliacoes/servico/${servico1.id}/avaliador/${contratante.usuarioId}/avaliado/${contratado.usuarioId}`,
    entrada: 'conclusao do servico e avaliacao com nota 5 e comentario de ate 500 caracteres',
    esperado: '200 / 201 / 200',
    passos: [
      {
        descricao: 'Conclusão do serviço em andamento',
        esperado: '200 OK com o serviço no estado CONCLUIDO',
        statusValido: statusValido(respConcluir, [200]) && respConcluir.json?.status === 'CONCLUIDO',
        resposta: respConcluir,
      },
      {
        descricao: 'Avaliação do serviço concluído',
        esperado: '201 Created com a avaliação registrada',
        statusValido: statusValido(respAvaliacao, [201]),
        resposta: respAvaliacao,
      },
      {
        descricao: 'Recálculo da média do contratado',
        esperado: '200 OK com media igual a 5',
        statusValido: statusValido(respPerfilAvaliado, [200]) && Number(mediaAvaliacao) === 5,
        resposta: respPerfilAvaliado,
      },
    ],
  });

  const respAvaliarAberto = await api(
    'POST',
    `/avaliacoes/servico/${servicoMeio.id}/avaliador/${contratanteB.usuarioId}/avaliado/${contratadoB.usuarioId}`,
    { token: tokenContratanteB, corpo: { nota: 4, comentario: 'Servico ainda nao realizado.' } }
  );
  registrar({
    ct: '29',
    nome: 'Avaliar_Servico_Nao_Concluido',
    requisito: 'RF09',
    tecnica: 'Transicao de estados',
    requisicao: `POST /avaliacoes/servico/${servicoMeio.id}/avaliador/${contratanteB.usuarioId}/avaliado/${contratadoB.usuarioId}`,
    entrada: 'avaliacao de servico no estado ABERTO',
    esperado: '400',
    passos: [
      {
        descricao: 'Avaliação de serviço não concluído',
        esperado: '400 Bad Request',
        statusValido: statusValido(respAvaliarAberto, [400]),
        resposta: respAvaliarAberto,
      },
    ],
  });

  const respAutoavaliacao = await api(
    'POST',
    `/avaliacoes/servico/${servico1.id}/avaliador/${contratante.usuarioId}/avaliado/${contratante.usuarioId}`,
    { token: tokenContratante, corpo: { nota: 5, comentario: 'Avaliando a mim mesmo.' } }
  );
  registrar({
    ct: '30',
    nome: 'Autoavaliacao',
    requisito: 'RF09',
    tecnica: 'Tabela de decisao',
    requisicao: `POST /avaliacoes/servico/${servico1.id}/avaliador/${contratante.usuarioId}/avaliado/${contratante.usuarioId}`,
    entrada: 'avaliacao em que avaliador e avaliado sao o mesmo usuario',
    esperado: '400',
    passos: [
      {
        descricao: 'Tentativa de autoavaliação',
        esperado: '400 Bad Request',
        statusValido: statusValido(respAutoavaliacao, [400]),
        resposta: respAutoavaliacao,
      },
    ],
  });

  const respAvaliacaoDuplicada = await api(
    'POST',
    `/avaliacoes/servico/${servico1.id}/avaliador/${contratante.usuarioId}/avaliado/${contratado.usuarioId}`,
    { token: tokenContratante, corpo: { nota: 3, comentario: 'Segunda avaliacao do mesmo servico.' } }
  );
  registrar({
    ct: '31',
    nome: 'Avaliacao_Duplicada',
    requisito: 'RF09',
    tecnica: 'Tabela de decisao',
    requisicao: `POST /avaliacoes/servico/${servico1.id}/avaliador/${contratante.usuarioId}/avaliado/${contratado.usuarioId}`,
    entrada: 'segunda avaliacao do mesmo avaliador no mesmo servico',
    esperado: '409',
    passos: [
      {
        descricao: 'Segunda avaliação do mesmo avaliador',
        esperado: '409 Conflict',
        statusValido: statusValido(respAvaliacaoDuplicada, [409]),
        resposta: respAvaliacaoDuplicada,
      },
    ],
  });

  const respCancelarConcluido = await api('PUT', `/servicos/${servico1.id}/cancelar`, {
    token: tokenContratante,
  });
  registrar({
    ct: '18',
    nome: 'Cancelar_Servico_Concluido',
    requisito: 'RF05',
    tecnica: 'Transicao de estados',
    requisicao: `PUT /servicos/${servico1.id}/cancelar`,
    entrada: 'cancelamento de servico no estado CONCLUIDO',
    esperado: '400',
    passos: [
      {
        descricao: 'Cancelamento de serviço concluído',
        esperado: '400 Bad Request',
        statusValido: statusValido(respCancelarConcluido, [400]),
        resposta: respCancelarConcluido,
      },
    ],
  });

  const respExcluirComHistorico = await api('DELETE', `/servicos/${servico1.id}`, {
    token: tokenContratante,
  });
  registrar({
    ct: '19',
    nome: 'Excluir_Servico_Com_Historico',
    requisito: 'RF05',
    tecnica: 'Tabela de decisao',
    requisicao: `DELETE /servicos/${servico1.id}`,
    entrada: 'exclusao de servico com candidaturas, mensagens e avaliacao',
    esperado: '409',
    passos: [
      {
        descricao: 'Exclusão de serviço com histórico',
        esperado: '409 Conflict',
        statusValido: statusValido(respExcluirComHistorico, [409]),
        resposta: respExcluirComHistorico,
      },
    ],
  });

  const respExcluirPerfilContratado = await api('DELETE', '/contratados/me', { token: tokenContratado });
  registrar({
    ct: '11',
    nome: 'Perfil_Contratado_Excluir_Com_Vinculo',
    requisito: 'RF03',
    tecnica: 'Tabela de decisao',
    requisicao: 'DELETE /contratados/me',
    entrada: 'exclusao de perfil de contratado com candidaturas e servicos vinculados',
    esperado: '409',
    passos: [
      {
        descricao: 'Exclusão de perfil com vínculo',
        esperado: '409 Conflict',
        statusValido: statusValido(respExcluirPerfilContratado, [409]),
        resposta: respExcluirPerfilContratado,
      },
    ],
  });

  const respExcluirPerfilContratante = await api('DELETE', '/contratantes/me', { token: tokenContratante });
  registrar({
    ct: '13',
    nome: 'Perfil_Contratante_Excluir_Com_Servico',
    requisito: 'RF04',
    tecnica: 'Tabela de decisao',
    requisicao: 'DELETE /contratantes/me',
    entrada: 'exclusao de perfil de contratante com servicos publicados',
    esperado: '409',
    passos: [
      {
        descricao: 'Exclusão de perfil com serviços publicados',
        esperado: '409 Conflict',
        statusValido: statusValido(respExcluirPerfilContratante, [409]),
        resposta: respExcluirPerfilContratante,
      },
    ],
  });

  const respAvaliacoesRecebidas = await api('GET', `/avaliacoes/avaliado/${contratado.usuarioId}?size=50`, {
    token: tokenContratado,
  });
  const avaliacoes = Array.isArray(respAvaliacoesRecebidas.json?.conteudo)
    ? respAvaliacoesRecebidas.json.conteudo
    : [];
  const mediasConferem = avaliacoes.length >= 1 && Number(mediaAvaliacao) === 5;

  registrar({
    ct: '40',
    nome: 'Consultar_Avaliacoes_Media',
    requisito: 'RF15',
    tecnica: 'Caso de uso',
    requisicao: `GET /avaliacoes/avaliado/${contratado.usuarioId}`,
    entrada: 'consulta das avaliacoes recebidas e conferencia da media no perfil',
    esperado: '200',
    passos: [
      {
        descricao: 'Consulta das avaliações recebidas',
        esperado: '200 OK com as avaliações e média coerente no perfil',
        statusValido: statusValido(respAvaliacoesRecebidas, [200]) && mediasConferem,
        resposta: respAvaliacoesRecebidas,
      },
    ],
    observacao: `Media no perfil: ${mediaAvaliacao}. Avaliacoes recebidas: ${avaliacoes.length}.`,
  });

  const respPublicoContratado = await api('GET', `/contratados/${contratado.id}`, { token: tokenContratadoB });
  const respPublicoContratante = await api('GET', `/contratantes/${contratante.id}`, { token: tokenContratadoB });
  const chavesProibidas = ['senha', 'cpfCnpj', 'cpf', 'cnpj', 'telefone'];
  const vazouDadoSensivel =
    respPublicoContratado.json &&
    chavesProibidas.some((chave) => Object.prototype.hasOwnProperty.call(respPublicoContratado.json, chave));
  const vazouDadoSensivelContratante =
    respPublicoContratante.json &&
    chavesProibidas.some((chave) => Object.prototype.hasOwnProperty.call(respPublicoContratante.json, chave));

  registrar({
    ct: '43',
    nome: 'Consultar_Perfil_Publico',
    requisito: 'RF17',
    tecnica: 'Caso de uso e particionamento de equivalencia',
    requisicao: `GET /contratados/${contratado.id} e GET /contratantes/${contratante.id}`,
    entrada: 'consulta do perfil publico de contratante e de contratado',
    esperado: '200 / 200',
    passos: [
      {
        descricao: 'Perfil público do contratado',
        esperado: '200 OK sem senha, documento ou telefone',
        statusValido:
          statusValido(respPublicoContratado, [200]) &&
          !vazouDadoSensivel &&
          Boolean(respPublicoContratado.json?.nome),
        resposta: respPublicoContratado,
      },
      {
        descricao: 'Perfil público do contratante',
        esperado: '200 OK sem senha, documento ou telefone',
        statusValido: statusValido(respPublicoContratante, [200]) && !vazouDadoSensivelContratante,
        resposta: respPublicoContratante,
      },
    ],
  });

  if (adminToken) {
    const respResumo = await api('GET', '/admin/resumo', { token: adminToken });
    const resumo = respResumo.json || {};
    const camposResumo = [
      'usuarios',
      'contratados',
      'contratantes',
      'servicosAbertos',
      'servicosEmAndamento',
      'servicosConcluidos',
      'servicosCancelados',
      'candidaturasPendentes',
      'avaliacoes',
    ];
    const resumoCompleto = camposResumo.every((campo) => resumo[campo] !== undefined);

    registrar({
      ct: '44',
      nome: 'Resumo_Administrativo',
      requisito: 'RF18',
      tecnica: 'Caso de uso',
      requisicao: 'GET /admin/resumo',
      entrada: 'consulta do resumo geral pelo administrador autenticado',
      esperado: '200',
      passos: [
        {
          descricao: 'Consulta do resumo geral',
          esperado: '200 OK com totais de usuarios, perfis, servicos, candidaturas e avaliacoes',
          statusValido: statusValido(respResumo, [200]) && resumoCompleto,
          resposta: respResumo,
        },
      ],
    });
  } else {
    bloquear('44', 'Resumo_Administrativo', 'RF18', 'Caso de uso', 'GET /admin/resumo',
      'consulta do resumo geral pelo administrador', '200',
      'Credenciais administrativas nao informadas.');
  }

  const respAdminNegado = await api('GET', '/admin/resumo', { token: tokenContratante });
  registrar({
    ct: '45',
    nome: 'Acesso_Admin_Negado',
    requisito: 'RF18',
    tecnica: 'Tabela de decisao',
    requisicao: 'GET /admin/resumo',
    entrada: 'acesso ao resumo com perfil de contratante',
    esperado: '403',
    passos: [
      {
        descricao: 'Acesso ao resumo com perfil indevido',
        esperado: '403 Forbidden',
        statusValido: statusValido(respAdminNegado, [403]),
        resposta: respAdminNegado,
      },
    ],
  });

  const respReporte = await api('POST', '/reportes', {
    token: tokenContratante,
    corpo: {
      assunto: 'PROBLEMA_COM_SERVICO',
      descricao: 'O profissional nao compareceu no horario combinado para o servico.',
      servicoId: servico1.id,
    },
  });
  const reporteId = respReporte.json?.id;

  registrar({
    ct: '47',
    nome: 'Suporte_Abrir_Solicitacao',
    requisito: 'RF19',
    tecnica: 'Caso de uso',
    requisicao: 'POST /reportes',
    entrada: 'assunto, descricao e servico de que o usuario participa',
    esperado: '201',
    passos: [
      {
        descricao: 'Abertura de solicitação de suporte',
        esperado: '201 Created com status ABERTO',
        statusValido: statusValido(respReporte, [201]) && respReporte.json?.status === 'ABERTO',
        resposta: respReporte,
      },
    ],
  });

  const respReporteIntruso = await api('POST', '/reportes', {
    token: tokenContratanteB,
    corpo: {
      assunto: 'PROBLEMA_COM_SERVICO',
      descricao: 'Tentativa de abrir solicitacao vinculada a servico de terceiro.',
      servicoId: servico1.id,
    },
  });
  const respReporteInexistente = await api('POST', '/reportes', {
    token: tokenContratante,
    corpo: {
      assunto: 'OUTRO',
      descricao: 'Tentativa de abrir solicitacao vinculada a servico inexistente.',
      servicoId: 99999999,
    },
  });

  registrar({
    ct: '48',
    nome: 'Suporte_Servico_Sem_Participacao',
    requisito: 'RF19',
    tecnica: 'Tabela de decisao',
    requisicao: 'POST /reportes',
    entrada: 'servico de terceiro e servico inexistente',
    esperado: '403 / 404',
    passos: [
      {
        descricao: 'Solicitação vinculada a serviço de que não participa',
        esperado: '403 Forbidden',
        statusValido: statusValido(respReporteIntruso, [403]),
        resposta: respReporteIntruso,
      },
      {
        descricao: 'Solicitação vinculada a serviço inexistente',
        esperado: '404 Not Found',
        statusValido: statusValido(respReporteInexistente, [404]),
        resposta: respReporteInexistente,
      },
    ],
  });

  const respAcessoNegadoSuporte = await api('GET', '/reportes', { token: tokenContratante });
  registrar({
    ct: '50',
    nome: 'Suporte_Acesso_Negado',
    requisito: 'RF19',
    tecnica: 'Tabela de decisao',
    requisicao: 'GET /reportes',
    entrada: 'consulta da lista geral de solicitacoes com perfil de contratante',
    esperado: '403',
    passos: [
      {
        descricao: 'Consulta da lista geral com perfil indevido',
        esperado: '403 Forbidden',
        statusValido: statusValido(respAcessoNegadoSuporte, [403]),
        resposta: respAcessoNegadoSuporte,
      },
    ],
  });

  if (adminToken && reporteId) {
    const respAnalise = await api('PUT', `/reportes/${reporteId}/analisar`, { token: adminToken });
    const respResolucao = await api('PUT', `/reportes/${reporteId}/resolver`, {
      token: adminToken,
      corpo: { resposta: 'Solicitacao analisada e resolvida pela equipe de suporte.' },
    });
    const respAbertos = await api('GET', '/reportes/abertos/quantidade', { token: adminToken });

    registrar({
      ct: '49',
      nome: 'Suporte_Admin_Resolver',
      requisito: 'RF19',
      tecnica: 'Caso de uso e transicao de estados',
      requisicao: `PUT /reportes/${reporteId}/analisar e PUT /reportes/${reporteId}/resolver`,
      entrada: 'inicio de analise e resolucao da solicitacao pelo administrador',
      esperado: '200 / 200 / 200',
      passos: [
        {
          descricao: 'Início da análise',
          esperado: '200 OK com status EM_ANALISE',
          statusValido: statusValido(respAnalise, [200]) && respAnalise.json?.status === 'EM_ANALISE',
          resposta: respAnalise,
        },
        {
          descricao: 'Resolução com resposta',
          esperado: '200 OK com status RESOLVIDO e resposta registrada',
          statusValido: statusValido(respResolucao, [200]) && respResolucao.json?.status === 'RESOLVIDO',
          resposta: respResolucao,
        },
        {
          descricao: 'Total de solicitações abertas e em análise',
          esperado: '200 OK com total atualizado',
          statusValido: statusValido(respAbertos, [200]),
          resposta: respAbertos,
        },
      ],
    });
  } else {
    bloquear('49', 'Suporte_Admin_Resolver', 'RF19', 'Caso de uso e transicao de estados',
      `PUT /reportes/${reporteId}/analisar e resolver`,
      'analise e resolucao da solicitacao pelo administrador', '200',
      'Credenciais administrativas nao informadas ou solicitacao nao criada.');
  }

  const respNotificacoes = await api('GET', '/notificacoes', { token: tokenContratado });
  const listaNotificacoes = Array.isArray(respNotificacoes.json) ? respNotificacoes.json : [];
  const respNaoLidas = await api('GET', '/notificacoes/nao-lidas/quantidade', { token: tokenContratado });
  const totalNaoLidas = Number(respNaoLidas.json?.total ?? -1);

  registrar({
    ct: '51',
    nome: 'Notificacoes_Listar',
    requisito: 'RF20',
    tecnica: 'Caso de uso',
    requisicao: 'GET /notificacoes e GET /notificacoes/nao-lidas/quantidade',
    entrada: 'consulta das notificacoes do contratado apos receber uma avaliacao',
    esperado: '200 / 200',
    passos: [
      {
        descricao: 'Listagem das notificações',
        esperado: '200 OK com as notificações em ordem decrescente de criação',
        statusValido: statusValido(respNotificacoes, [200]) && listaNotificacoes.length >= 1,
        resposta: respNotificacoes,
      },
      {
        descricao: 'Total de não lidas',
        esperado: '200 OK com total igual ou superior a um',
        statusValido: statusValido(respNaoLidas, [200]) && totalNaoLidas >= 1,
        resposta: respNaoLidas,
      },
    ],
    observacao: `Notificacoes: ${listaNotificacoes.length}. Nao lidas: ${totalNaoLidas}.`,
  });

  const notificacaoAlvo = listaNotificacoes.find((n) => n.lida === false);

  if (notificacaoAlvo) {
    const respMarcarUma = await api('PUT', `/notificacoes/${notificacaoAlvo.id}/ler`, { token: tokenContratado });
    const respMarcarTodas = await api('PUT', '/notificacoes/ler-todas', { token: tokenContratado });
    const respNaoLidasFinal = await api('GET', '/notificacoes/nao-lidas/quantidade', { token: tokenContratado });

    registrar({
      ct: '52',
      nome: 'Notificacao_Marcar_Lida',
      requisito: 'RF20',
      tecnica: 'Transicao de estados',
      requisicao: `PUT /notificacoes/${notificacaoAlvo.id}/ler e PUT /notificacoes/ler-todas`,
      entrada: 'marcacao de uma notificacao e de todas como lidas',
      esperado: '200 / 204',
      passos: [
        {
          descricao: 'Marcação de uma notificação como lida',
          esperado: '200 OK com lida igual a verdadeiro',
          statusValido: statusValido(respMarcarUma, [200]) && respMarcarUma.json?.lida === true,
          resposta: respMarcarUma,
        },
        {
          descricao: 'Marcação de todas como lidas',
          esperado: '204 No Content',
          statusValido: statusValido(respMarcarTodas, [204]),
          resposta: respMarcarTodas,
        },
        {
          descricao: 'Total de não lidas após a marcação',
          esperado: '200 OK com total igual a zero',
          statusValido:
            statusValido(respNaoLidasFinal, [200]) && Number(respNaoLidasFinal.json?.total) === 0,
          resposta: respNaoLidasFinal,
        },
      ],
    });

    const respNotificacaoDeOutro = await api('PUT', `/notificacoes/${notificacaoAlvo.id}/ler`, {
      token: tokenContratadoB,
    });
    registrar({
      ct: '53',
      nome: 'Notificacao_De_Outro_Usuario',
      requisito: 'RF20',
      tecnica: 'Tabela de decisao',
      requisicao: `PUT /notificacoes/${notificacaoAlvo.id}/ler`,
      entrada: 'marcacao de notificacao pertencente a outro usuario',
      esperado: '403',
      passos: [
        {
          descricao: 'Marcação de notificação de outro usuário',
          esperado: '403 Forbidden',
          statusValido: statusValido(respNotificacaoDeOutro, [403]),
          resposta: respNotificacaoDeOutro,
        },
      ],
    });
  } else {
    bloquear('52', 'Notificacao_Marcar_Lida', 'RF20', 'Transicao de estados', 'PUT /notificacoes/{id}/ler',
      'marcacao de notificacao como lida', '200', 'Nenhuma notificacao nao lida disponivel para o contratado.');
    bloquear('53', 'Notificacao_De_Outro_Usuario', 'RF20', 'Tabela de decisao', 'PUT /notificacoes/{id}/ler',
      'marcacao de notificacao de outro usuario', '403', 'Nenhuma notificacao disponivel para o teste.');
  }

  if (adminToken) {
    const respDesativar = await api('PUT', `/usuarios/${contratadoB.usuarioId}`, {
      token: adminToken,
      corpo: {
        nome: 'Bruno',
        sobrenome: 'Alves',
        telefone: '11912345678',
        tipo: 'CONTRATADO',
        ativo: false,
      },
    });
    const respLoginDesativado = await login(emailContratadoB, SENHA);

    registrar({
      ct: '46',
      nome: 'Admin_Desativar_Usuario',
      requisito: 'RF18',
      tecnica: 'Transicao de estados',
      requisicao: `PUT /usuarios/${contratadoB.usuarioId}`,
      entrada: 'desativacao do cadastro pelo administrador e nova tentativa de autenticacao',
      esperado: '200 / 401',
      passos: [
        {
          descricao: 'Desativação do usuário',
          esperado: '200 OK com ativo igual a falso e registro preservado',
          statusValido: statusValido(respDesativar, [200]) && respDesativar.json?.ativo === false,
          resposta: respDesativar,
        },
        {
          descricao: 'Autenticação do usuário desativado',
          esperado: '401 Unauthorized',
          statusValido: statusValido(respLoginDesativado, [401]),
          resposta: respLoginDesativado,
        },
      ],
    });
  } else {
    bloquear('46', 'Admin_Desativar_Usuario', 'RF18', 'Transicao de estados', 'PUT /usuarios/{id}',
      'desativacao de usuario pelo administrador', '200', 'Credenciais administrativas nao informadas.');
  }

  resultados.sort((a, b) => Number(a.ct) - Number(b.ct));

  gerarCsv();
  gerarHtml();

  const aprovados = resultados.filter((r) => r.veredito === 'APROVADO').length;
  const reprovados = resultados.filter((r) => r.veredito === 'REPROVADO').length;
  const bloqueados = resultados.filter((r) => r.veredito === 'BLOQUEADO').length;

  console.log('');
  console.log('Resumo da execucao');
  console.log(`Casos registrados: ${resultados.length}`);
  console.log(`Aprovados: ${aprovados}`);
  console.log(`Reprovados: ${reprovados}`);
  console.log(`Bloqueados: ${bloqueados}`);

  if (reprovados > 0) {
    console.log('');
    console.log('Casos reprovados, candidatos a registro de defeito na secao 3.4:');
    resultados
      .filter((r) => r.veredito === 'REPROVADO')
      .forEach((r) => console.log(`  CT${r.ct} ${r.requisito} | esperado ${r.esperado} | obtido ${r.statusObtido} | ${r.mensagem}`));
  }

  console.log('');
  console.log(`Arquivos gerados em ${SAIDA}: resultados.csv, relatorio-execucao.html e a pasta evidencias.`);
}

function bloquear(ct, nome, requisito, tecnica, requisicao, entrada, esperado, motivo) {
  const registro = {
    ct,
    nome,
    requisito,
    tecnica,
    requisicao,
    entrada,
    esperado,
    statusObtido: 'nao executado',
    mensagem: motivo,
    veredito: 'BLOQUEADO',
    observacao: motivo,
    arquivo: `CT${ct}_${slug(nome)}.json`,
    passos: [],
  };
  resultados.push(registro);
  fs.writeFileSync(path.join(DIR_EVIDENCIAS, registro.arquivo), JSON.stringify(registro, null, 2), 'utf8');
  console.log(`[BLOQ ] CT${ct} ${nome} | ${motivo}`);
}

function gerarCsv() {
  const cabecalho = [
    'Caso',
    'Requisito',
    'Tecnica',
    'Requisicao',
    'Entrada',
    'Resultado esperado',
    'Status obtido',
    'Mensagem obtida',
    'Veredito',
    'Arquivo de evidencia',
  ];

  const linhas = resultados.map((r) => [
    `CT${r.ct}`,
    r.requisito,
    r.tecnica,
    r.requisicao,
    r.entrada,
    r.esperado,
    r.statusObtido,
    r.mensagem,
    r.veredito,
    r.arquivo,
  ]);

  const csv = [cabecalho, ...linhas]
    .map((linha) => linha.map((valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');

  fs.writeFileSync(path.join(SAIDA, 'resultados.csv'), `\uFEFF${csv}`, 'utf8');
}

function gerarHtml() {
  const dataExecucao = new Date().toLocaleString('pt-BR');
  const aprovados = resultados.filter((r) => r.veredito === 'APROVADO').length;
  const reprovados = resultados.filter((r) => r.veredito === 'REPROVADO').length;
  const bloqueados = resultados.filter((r) => r.veredito === 'BLOQUEADO').length;

  const linhas = resultados
    .map(
      (r) => `
      <tr class="${r.veredito.toLowerCase()}">
        <td>CT${r.ct}</td>
        <td>${r.requisito}</td>
        <td>${r.tecnica}</td>
        <td class="entrada">${r.entrada}</td>
        <td class="centro">${r.esperado}</td>
        <td class="centro">${r.statusObtido}</td>
        <td>${r.mensagem}</td>
        <td class="centro"><strong>${r.veredito}</strong></td>
      </tr>`
    )
    .join('');

  const detalhes = resultados
    .filter((r) => r.veredito !== 'APROVADO')
    .map(
      (r) => `
      <section class="detalhe">
        <h3>CT${r.ct} ${r.requisito} ${r.veredito}</h3>
        <p><strong>Requisicao:</strong> ${r.requisicao}</p>
        <p><strong>Entrada:</strong> ${r.entrada}</p>
        <p><strong>Esperado:</strong> ${r.esperado} &nbsp; <strong>Obtido:</strong> ${r.statusObtido}</p>
        <p><strong>Mensagem:</strong> ${r.mensagem}</p>
        ${r.observacao ? `<p><strong>Observacao:</strong> ${r.observacao}</p>` : ''}
        ${r.passos
          .map(
            (p) => `
          <div class="passo">
            <p><strong>${p.descricao}</strong> (esperado ${p.esperado}, obtido ${p.status}, ${p.duracaoMs} ms)</p>
            <pre>${String(p.corpo ?? '').replace(/</g, '&lt;')}</pre>
          </div>`
          )
          .join('')}
      </section>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Relatorio de execucao dos testes de caixa preta</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #1b1b1b; margin: 32px; font-size: 11px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 14px; margin-top: 28px; border-bottom: 1px solid #999; padding-bottom: 4px; }
  h3 { font-size: 12px; }
  p { margin: 4px 0; line-height: 1.45; }
  table { border-collapse: collapse; width: 100%; margin-top: 10px; }
  th, td { border: 1px solid #bbb; padding: 4px 5px; vertical-align: top; text-align: left; }
  th { background: #eee; font-size: 10px; }
  td.centro { text-align: center; white-space: nowrap; }
  td.entrada { max-width: 260px; }
  tr.reprovado td { background: #fbe9e7; }
  tr.bloqueado td { background: #fdf6e3; }
  .resumo span { display: inline-block; margin-right: 18px; }
  .detalhe { margin-top: 18px; page-break-inside: avoid; }
  pre { background: #f5f5f5; border: 1px solid #ddd; padding: 6px; white-space: pre-wrap; word-break: break-word; font-size: 9px; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>
  <h1>Relatorio de execucao dos testes de caixa preta</h1>
  <p><strong>Sistema:</strong> Trampo &nbsp; <strong>API:</strong> ${BASE} &nbsp; <strong>Execucao:</strong> ${dataExecucao}</p>
  <p class="resumo">
    <span><strong>Casos:</strong> ${resultados.length}</span>
    <span><strong>Aprovados:</strong> ${aprovados}</span>
    <span><strong>Reprovados:</strong> ${reprovados}</span>
    <span><strong>Bloqueados:</strong> ${bloqueados}</span>
  </p>

  <h2>Tabela de rastreabilidade dos casos</h2>
  <table>
    <thead>
      <tr>
        <th>Caso</th><th>Req.</th><th>Tecnica</th><th>Entrada</th>
        <th>Esperado</th><th>Obtido</th><th>Mensagem</th><th>Veredito</th>
      </tr>
    </thead>
    <tbody>${linhas}</tbody>
  </table>

  <h2>Detalhamento dos casos nao aprovados</h2>
  ${detalhes || '<p>Nenhum caso reprovado ou bloqueado nesta execucao.</p>'}
</body>
</html>`;

  fs.writeFileSync(path.join(SAIDA, 'relatorio-execucao.html'), html, 'utf8');
}

executar().catch((erro) => {
  console.error('');
  console.error('A execucao foi interrompida por um erro nao tratado.');
  console.error(erro);
  process.exit(1);
});
