import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import ControleDeslizante from '../components/ControleDeslizante';
import Icone from '../components/Icone';
import Seletor from '../components/Seletor';
import SeletorDias from '../components/SeletorDias';
import SeletorFaixas from '../components/SeletorFaixas';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import { PROFISSOES, montarDisponibilidade, rotuloDaProfissao } from '../data/profissoes';
import { cadastrar, login } from '../services/api';
import { buscarCep } from '../services/cep';
import { obterLocalizacao } from '../services/localizacao';
import { cores, espacos, raios } from '../theme/cores';
import { limparNome, mascararCep, mascararCpfCnpj, mascararTelefone, validarCnpj, validarCpf } from '../utils/formato';

const TIPOS = [
    { valor: 'CONTRATANTE', icone: 'document-text-outline', titulo: 'Sou contratante', descricao: 'Contrato serviços', cor: cores.azul, corFundo: cores.azul, corTexto: cores.branco },
    { valor: 'CONTRATADO', icone: 'construct-outline', titulo: 'Sou trabalhador', descricao: 'Presto serviços', cor: cores.amareloEscuro, corFundo: cores.amarelo, corTexto: cores.preto },
];

function emailValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor ?? '').trim());
}

function limparNumero(valor) {
    return String(valor ?? '').replace(/[^0-9A-Za-z/]/g, '').slice(0, 10);
}

export default function Cadastro() {
    const router = useRouter();
    const { usuario, entrar } = useAuth();

    const [tipo, setTipo] = useState('CONTRATANTE');
    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [senha, setSenha] = useState('');

    const [cep, setCep] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [numero, setNumero] = useState('');
    const [complemento, setComplemento] = useState('');
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');
    const [uf, setUf] = useState('');
    const [enderecoTravado, setEnderecoTravado] = useState(false);
    const [buscandoCep, setBuscandoCep] = useState(false);
    const [cepConsultado, setCepConsultado] = useState('');

    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [coordLat, setCoordLat] = useState('');
    const [coordLon, setCoordLon] = useState('');
    const [localizacaoFalhou, setLocalizacaoFalhou] = useState(false);

    const [tipoPessoa, setTipoPessoa] = useState('PESSOA_FISICA');
    const [cpfCnpj, setCpfCnpj] = useState('');

    const [profissao, setProfissao] = useState('');
    const [profissaoOutro, setProfissaoOutro] = useState('');
    const [dias, setDias] = useState([]);
    const [faixas, setFaixas] = useState([]);
    const [raioBuscaKm, setRaioBuscaKm] = useState(10);
    const [descricao, setDescricao] = useState('');

    const [erro, setErro] = useState('');
    const [erros, setErros] = useState({});
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const local = await obterLocalizacao();
                setLatitude(local.latitude);
                setLongitude(local.longitude);
            } catch {
                setLocalizacaoFalhou(true);
            }
        })();
    }, []);

    if (usuario) return <Redirect href="/home" />;

    function limparErro(campo) {
        if (!erros[campo]) return;
        setErros((atual) => ({ ...atual, [campo]: undefined }));
    }

    function aoDigitarCep(texto) {
        const mascarado = mascararCep(texto);
        setCep(mascarado);
        setErro('');
        limparErro('cep');

        const numeros = mascarado.replace(/\D/g, '');

        if (numeros.length === 8) {
            if (numeros !== cepConsultado) buscarEndereco(numeros);
            return;
        }

        setEnderecoTravado(false);
        setCepConsultado('');
    }

    async function buscarEndereco(numeros) {
        setBuscandoCep(true);

        try {
            const dados = await buscarCep(numeros);
            setCepConsultado(numeros);
            setLogradouro(dados.logradouro || '');
            setBairro(dados.bairro || '');
            setCidade(dados.cidade || '');
            setUf(dados.uf || '');
            setEnderecoTravado(Boolean(dados.logradouro && dados.bairro && dados.cidade && dados.uf));
        } catch (e) {
            setCepConsultado('');
            setEnderecoTravado(false);
            setErros((atual) => ({ ...atual, cep: e.message }));
        } finally {
            setBuscandoCep(false);
        }
    }

    function trocarTipoPessoa(novo) {
        setTipoPessoa(novo);
        setCpfCnpj(mascararCpfCnpj(cpfCnpj, novo));
        limparErro('cpf');
    }

    function aplicarCoordenadas() {
        const valorLat = Number(String(coordLat).replace(',', '.'));
        const valorLon = Number(String(coordLon).replace(',', '.'));

        if (isNaN(valorLat) || isNaN(valorLon)) {
            setErro('Informe latitude e longitude em números.');
            return;
        }

        if (valorLat < -90 || valorLat > 90) {
            setErro('A latitude deve estar entre -90 e 90.');
            return;
        }

        if (valorLon < -180 || valorLon > 180) {
            setErro('A longitude deve estar entre -180 e 180.');
            return;
        }

        setLatitude(valorLat);
        setLongitude(valorLon);
        setLocalizacaoFalhou(false);
    }

    function validar() {
        const novos = {};

        if (nome.trim().length < 2) novos.nome = 'Informe o nome.';
        if (sobrenome.trim().length < 2) novos.sobrenome = 'Informe o sobrenome.';
        if (!emailValido(email)) novos.email = 'Informe um e-mail válido.';
        if (telefone.replace(/\D/g, '').length < 10) novos.telefone = 'Informe o telefone com DDD.';
        if (senha.length < 8) novos.senha = 'A senha deve ter pelo menos 8 caracteres.';
        if (cep.replace(/\D/g, '').length !== 8) novos.cep = 'Informe um CEP válido.';
        if (!logradouro.trim() || !bairro.trim() || !cidade.trim() || uf.length !== 2) novos.cep = 'Não foi possível obter o endereço deste CEP.';
        if (!numero.trim()) novos.numero = 'Informe o número do endereço.';

        if (tipo === 'CONTRATANTE') {
            const digitos = cpfCnpj.replace(/\D/g, '');

            if (tipoPessoa === 'PESSOA_JURIDICA') {
                if (digitos.length !== 14) novos.cpf = 'O CNPJ deve ter 14 dígitos.';
                else if (!validarCnpj(digitos)) novos.cpf = 'CNPJ inválido.';
            } else if (digitos.length !== 11) {
                novos.cpf = 'O CPF deve ter 11 dígitos.';
            } else if (!validarCpf(digitos)) {
                novos.cpf = 'CPF inválido.';
            }
        }

        if (tipo === 'CONTRATADO') {
            if (!profissao) novos.profissao = 'Selecione a sua profissão.';
            if (profissao === 'OUTROS' && profissaoOutro.trim().length < 3) novos.profissao = 'Descreva a sua profissão.';
            if (dias.length === 0) novos.dias = 'Selecione pelo menos um dia.';
            if (faixas.length === 0) novos.faixas = 'Selecione pelo menos uma faixa de horário.';
            if (!descricao.trim()) novos.descricao = 'Descreva a sua experiência.';
        }

        setErros(novos);

        if (Object.keys(novos).length > 0) {
            setErro('Revise os campos destacados.');
            return false;
        }

        if (latitude === null || longitude === null) {
            setLocalizacaoFalhou(true);
            setErro('Não foi possível obter a sua localização. Informe as coordenadas.');
            return false;
        }

        return true;
    }

    async function aoCadastrar() {
        setErro('');
        if (!validar()) return;

        setCarregando(true);

        try {
            await cadastrar({
                nome, sobrenome, email, telefone, senha, tipo, cep, logradouro, numero, complemento, bairro, cidade, uf,
                latitude, longitude,
                raioBuscaKm: tipo === 'CONTRATADO' ? raioBuscaKm : null,
                tipoPessoa: tipo === 'CONTRATANTE' ? tipoPessoa : null,
                cpfCnpj: tipo === 'CONTRATANTE' ? cpfCnpj : null,
                servicos: tipo === 'CONTRATADO' ? (profissao === 'OUTROS' ? 'Outros: ' + profissaoOutro.trim() : rotuloDaProfissao(profissao)) : null,
                disponibilidade: tipo === 'CONTRATADO' ? montarDisponibilidade(dias, faixas) : null,
                descricao: tipo === 'CONTRATADO' ? descricao : null,
            });

            const dados = await login(email, senha);
            await entrar(dados);
        } catch (e) {
            if (e.status === 409) {
                setErros((atual) => ({ ...atual, email: 'Este e-mail já está cadastrado.' }));
                setErro('Este e-mail já está cadastrado. Entre com a sua conta.');
            } else {
                setErro(e.message);
            }
        } finally {
            setCarregando(false);
        }
    }

    return (
        <Tela cor={cores.branco}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <Text style={styles.titulo}>Criar conta</Text>
                    <Text style={styles.subtitulo}>Leva menos de dois minutos</Text>
                    <Text style={styles.label}>Como você vai usar o Trampo?</Text>

                    <View style={styles.linhaTipos}>
                        {TIPOS.map((opcao) => {
                            const ativo = tipo === opcao.valor;
                            return (
                                <Pressable
                                    key={opcao.valor}
                                    accessibilityRole="radio"
                                    accessibilityLabel={opcao.titulo}
                                    accessibilityState={{ selected: ativo }}
                                    onPress={() => setTipo(opcao.valor)}
                                    style={({ pressed }) => [styles.tipo, ativo ? { backgroundColor: opcao.corFundo, borderColor: opcao.cor } : null, pressed ? styles.tipoPressionado : null]}
                                >
                                    <Icone nome={opcao.icone} tamanho={24} cor={ativo ? opcao.corTexto : cores.cinzaTexto} />
                                    <Text style={[styles.tipoTexto, ativo ? { color: opcao.corTexto } : null]}>{opcao.titulo}</Text>
                                    <Text style={[styles.tipoDescricao, ativo ? { color: opcao.corTexto } : null]}>{opcao.descricao}</Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <Text style={styles.secao}>Dados pessoais</Text>

                    <Vidro style={styles.formulario}>
                        <CampoTexto label="Nome" valor={nome} onChange={(v) => { setNome(limparNome(v)); limparErro('nome'); }} placeholder="Seu nome" autoCapitalize="words" maxLength={40} error={erros.nome} />
                        <CampoTexto label="Sobrenome" valor={sobrenome} onChange={(v) => { setSobrenome(limparNome(v)); limparErro('sobrenome'); }} placeholder="Seu sobrenome" autoCapitalize="words" maxLength={40} error={erros.sobrenome} />
                        <CampoTexto label="E-mail" valor={email} onChange={(v) => { setEmail(v); limparErro('email'); }} placeholder="seu@email.com" keyboard="email-address" error={erros.email} />
                        <CampoTexto label="Telefone" valor={telefone} onChange={(v) => { setTelefone(mascararTelefone(v)); limparErro('telefone'); }} placeholder="(11) 99999-9999" keyboard="phone-pad" maxLength={15} error={erros.telefone} />
                        <CampoTexto label="Senha" valor={senha} onChange={(v) => { setSenha(v); limparErro('senha'); }} placeholder="Mínimo de 8 caracteres" secure maxLength={60} error={erros.senha} />
                    </Vidro>

                    <Text style={styles.secao}>Endereço</Text>

                    <Vidro style={styles.formulario}>
                        <CampoTexto label="CEP" valor={cep} onChange={aoDigitarCep} placeholder="00000-000" keyboard="number-pad" maxLength={9} editable={!buscandoCep} error={erros.cep} />
                        {buscandoCep ? <Text style={styles.dica}>Consultando o CEP...</Text> : null}
                        <CampoTexto label="Logradouro" valor={logradouro} onChange={setLogradouro} placeholder="Rua, avenida..." editable={!enderecoTravado} />
                        <CampoTexto label="Número" valor={numero} onChange={(v) => { setNumero(limparNumero(v)); limparErro('numero'); }} placeholder="123" maxLength={10} error={erros.numero} />
                        <CampoTexto label="Complemento" valor={complemento} onChange={setComplemento} placeholder="Apto, bloco, casa (opcional)" maxLength={40} />
                        <CampoTexto label="Bairro" valor={bairro} onChange={setBairro} placeholder="Bairro" editable={!enderecoTravado} />
                        <View style={styles.linhaDupla}>
                            <View style={styles.coluna}><CampoTexto label="Cidade" valor={cidade} onChange={setCidade} placeholder="Cidade" editable={!enderecoTravado} /></View>
                            <View style={styles.colunaUf}><CampoTexto label="UF" valor={uf} onChange={setUf} placeholder="SP" maxLength={2} editable={!enderecoTravado} /></View>
                        </View>
                    </Vidro>

                    {localizacaoFalhou ? (
                        <>
                            <Text style={styles.secao}>Localização</Text>
                            <Vidro style={styles.formulario}>
                                <Text style={styles.alerta}>Não foi possível acessar o GPS. Informe as coordenadas do seu endereço.</Text>
                                <View style={styles.linhaDupla}>
                                    <View style={styles.coluna}><CampoTexto label="Latitude" valor={coordLat} onChange={setCoordLat} placeholder="-23.5505" keyboard="numbers-and-punctuation" /></View>
                                    <View style={styles.coluna}><CampoTexto label="Longitude" valor={coordLon} onChange={setCoordLon} placeholder="-46.6333" keyboard="numbers-and-punctuation" /></View>
                                </View>
                                <Botao titulo="Aplicar coordenadas" variante="claro" compacto onPress={aplicarCoordenadas} />
                            </Vidro>
                        </>
                    ) : null}

                    {tipo === 'CONTRATANTE' ? (
                        <>
                            <Text style={styles.secao}>Documento</Text>
                            <Vidro style={styles.formulario}>
                                <Text style={styles.rotulo}>Tipo de pessoa</Text>
                                <View style={styles.linhaDupla}>
                                    <Pressable accessibilityRole="radio" accessibilityState={{ selected: tipoPessoa === 'PESSOA_FISICA' }} onPress={() => trocarTipoPessoa('PESSOA_FISICA')} style={[styles.opcao, tipoPessoa === 'PESSOA_FISICA' ? styles.opcaoAtiva : null]}>
                                        <Text style={styles.textoOpcao}>Pessoa física</Text>
                                    </Pressable>
                                    <Pressable accessibilityRole="radio" accessibilityState={{ selected: tipoPessoa === 'PESSOA_JURIDICA' }} onPress={() => trocarTipoPessoa('PESSOA_JURIDICA')} style={[styles.opcao, tipoPessoa === 'PESSOA_JURIDICA' ? styles.opcaoAtiva : null]}>
                                        <Text style={styles.textoOpcao}>Pessoa jurídica</Text>
                                    </Pressable>
                                </View>
                                <CampoTexto
                                    label={tipoPessoa === 'PESSOA_JURIDICA' ? 'CNPJ' : 'CPF'}
                                    valor={cpfCnpj}
                                    onChange={(v) => { setCpfCnpj(mascararCpfCnpj(v, tipoPessoa)); limparErro('cpf'); }}
                                    placeholder={tipoPessoa === 'PESSOA_JURIDICA' ? '00.000.000/0000-00' : '000.000.000-00'}
                                    keyboard="number-pad"
                                    maxLength={tipoPessoa === 'PESSOA_JURIDICA' ? 18 : 14}
                                    error={erros.cpf}
                                />
                            </Vidro>
                        </>
                    ) : (
                        <>
                            <Text style={styles.secao}>Dados de trabalhador</Text>
                            <Vidro style={styles.formulario}>
                                <Seletor label="Profissão" valor={profissao} opcoes={PROFISSOES} onChange={(v) => { setProfissao(v); limparErro('profissao'); }} placeholder="Selecione a sua profissão" error={erros.profissao} />
                                {profissao === 'OUTROS' ? (
                                    <CampoTexto label="Qual profissão?" valor={profissaoOutro} onChange={(v) => { setProfissaoOutro(v); limparErro('profissao'); }} placeholder="Descreva a sua profissão" autoCapitalize="sentences" maxLength={60} />
                                ) : null}
                                <SeletorDias label="Dias de atendimento" selecionados={dias} onChange={(v) => { setDias(v); limparErro('dias'); }} error={erros.dias} />
                                <SeletorFaixas label="Faixas de horário" selecionadas={faixas} onChange={(v) => { setFaixas(v); limparErro('faixas'); }} error={erros.faixas} />
                                <ControleDeslizante label="Raio de atendimento" valor={raioBuscaKm} min={1} max={50} passo={1} sufixo="km" onChange={setRaioBuscaKm} />
                                <CampoTexto label="Sobre você" valor={descricao} onChange={(v) => { setDescricao(v); limparErro('descricao'); }} placeholder="Experiência e diferenciais" multiline autoCapitalize="sentences" maxLength={500} error={erros.descricao} />
                            </Vidro>
                        </>
                    )}

                    <View style={styles.espaco} />
                    <Botao titulo="Criar conta" onPress={aoCadastrar} carregando={carregando} />

                    <Pressable accessibilityRole="button" onPress={() => router.replace('/login')} disabled={carregando} style={styles.linkArea}>
                        <Text style={styles.link}>Já tenho uma conta</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>

            <Aviso visivel={Boolean(erro)} mensagem={erro} tipo="erro" aoFechar={() => setErro('')} />
        </Tela>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    conteudo: { flexGrow: 1, padding: espacos.lg, paddingBottom: espacos.xxl },
    titulo: { fontSize: 26, fontWeight: '700', color: cores.preto, marginTop: espacos.md, letterSpacing: -0.5 },
    subtitulo: { fontSize: 14, color: cores.cinzaTexto, marginTop: espacos.xs, marginBottom: espacos.xl },
    label: { fontSize: 14, fontWeight: '600', color: cores.grafite, marginBottom: espacos.sm },
    linhaTipos: { flexDirection: 'row', gap: espacos.md, marginBottom: espacos.md },
    tipo: { flex: 1, borderWidth: 1, borderColor: cores.borda, borderRadius: raios.medio, paddingVertical: espacos.lg, paddingHorizontal: espacos.sm, alignItems: 'center', backgroundColor: cores.branco, gap: 4 },
    tipoPressionado: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    tipoTexto: { color: cores.grafite, fontWeight: '700', fontSize: 13, textAlign: 'center', marginTop: 2 },
    tipoDescricao: { color: cores.cinzaTexto, fontSize: 11, textAlign: 'center' },
    secao: { fontSize: 16, fontWeight: '700', color: cores.preto, marginTop: espacos.lg, marginBottom: espacos.sm },
    formulario: { padding: espacos.lg },
    linhaDupla: { flexDirection: 'row', gap: espacos.md },
    coluna: { flex: 1 },
    colunaUf: { width: 90 },
    dica: { fontSize: 12, color: cores.cinzaTexto, marginTop: -8, marginBottom: 10 },
    alerta: { fontSize: 13, color: cores.alerta },
    rotulo: { fontSize: 14, fontWeight: '600', color: cores.grafite, marginBottom: espacos.sm },
    opcao: { flex: 1, borderWidth: 1, borderColor: cores.borda, borderRadius: raios.medio, paddingVertical: espacos.md, alignItems: 'center', backgroundColor: cores.branco, marginBottom: espacos.md },
    opcaoAtiva: { borderColor: cores.azul, backgroundColor: cores.azulClaro },
    textoOpcao: { fontSize: 13, fontWeight: '600', color: cores.preto },
    espaco: { height: espacos.lg },
    linkArea: { marginTop: espacos.xl, alignSelf: 'center', paddingVertical: espacos.sm, paddingHorizontal: espacos.md },
    link: { color: cores.azul, fontWeight: '600', textAlign: 'center', fontSize: 14 },
});