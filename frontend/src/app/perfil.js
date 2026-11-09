
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import BarraInferior from '../components/BarraInferior';
import Botao from '../components/Botao';
import Cabecalho from '../components/Cabecalho';
import CampoTexto from '../components/CampoTexto';
import ControleDeslizante from '../components/ControleDeslizante';
import Icone from '../components/Icone';
import Seletor from '../components/Seletor';
import SeletorDias from '../components/SeletorDias';
import SeletorFaixas from '../components/SeletorFaixas';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import { PROFISSOES, montarDisponibilidade, rotuloDaProfissao, separarDisponibilidade, separarProfissao } from '../data/profissoes';
import { atualizarPerfilContratado, atualizarPerfilContratante, meuPerfilContratado, meuPerfilContratante } from '../services/api';
import { buscarCep } from '../services/cep';
import { obterLocalizacao } from '../services/localizacao';
import { cores, espacos, raios } from '../theme/cores';
import { limparNome, mascararCep, mascararCpfCnpj, mascararTelefone, montarEndereco } from '../utils/formato';

function limparNumero(valor) {
    return String(valor ?? '').replace(/[^0-9A-Za-z/]/g, '').slice(0, 10);
}

export default function TelaPerfil() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao, atualizarPerfil, sair } = useAuth();

    const [nome, setNome] = useState('');
    const [sobrenome, setSobrenome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [tipoPessoa, setTipoPessoa] = useState('PESSOA_FISICA');
    const [cpfCnpj, setCpfCnpj] = useState('');

    const [profissao, setProfissao] = useState('');
    const [profissaoOutro, setProfissaoOutro] = useState('');
    const [dias, setDias] = useState([]);
    const [faixas, setFaixas] = useState([]);
    const [raioBuscaKm, setRaioBuscaKm] = useState(10);
    const [descricao, setDescricao] = useState('');

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
    const [mostrarCoordenadas, setMostrarCoordenadas] = useState(false);

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [buscandoGps, setBuscandoGps] = useState(false);
    const [erro, setErro] = useState('');
    const [recado, setRecado] = useState('');

    const ehContratante = usuario?.tipo === 'CONTRATANTE';
    const ehContratado = usuario?.tipo === 'CONTRATADO';

    useEffect(() => {
        if (!usuario) {
            setCarregando(false);
            return;
        }

        setNome(usuario.nome || '');
        setSobrenome(usuario.sobrenome || '');
        setTelefone(mascararTelefone(usuario.telefone || ''));
        carregarPerfil();
    }, [usuario]);

    async function carregarPerfil() {
        try {
            const dados = ehContratante ? await meuPerfilContratante() : await meuPerfilContratado();

            setCep(mascararCep(dados.cep || ''));
            setCepConsultado(String(dados.cep || '').replace(/\D/g, ''));
            setLogradouro(dados.logradouro || '');
            setNumero(dados.numero || '');
            setComplemento(dados.complemento || '');
            setBairro(dados.bairro || '');
            setCidade(dados.cidade || '');
            setUf(dados.uf || '');
            setEnderecoTravado(Boolean(dados.logradouro));
            setLatitude(dados.latitude ?? null);
            setLongitude(dados.longitude ?? null);

            if (ehContratante) {
                const tipo = dados.tipoPessoa || 'PESSOA_FISICA';
                setTipoPessoa(tipo);
                setCpfCnpj(mascararCpfCnpj(dados.cpfCnpj || '', tipo));
            }

            if (ehContratado) {
                const p = separarProfissao(dados.servicos);
                setProfissao(p.profissao);
                setProfissaoOutro(p.outro);

                const d = separarDisponibilidade(dados.disponibilidade);
                setDias(d.dias);
                setFaixas(d.faixas);

                setRaioBuscaKm(Math.round(Number(dados.raioBuscaKm ?? 10)));
                setDescricao(dados.descricao || '');
            }
        } catch (e) {
            setErro(e.message);
        } finally {
            setCarregando(false);
        }
    }

    function aoDigitarCep(texto) {
        const mascarado = mascararCep(texto);
        setCep(mascarado);

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
            setErro(e.message);
        } finally {
            setBuscandoCep(false);
        }
    }

    async function atualizarLocalizacao() {
        setBuscandoGps(true);

        try {
            const local = await obterLocalizacao();
            setLatitude(local.latitude);
            setLongitude(local.longitude);
            setMostrarCoordenadas(false);
            setRecado('Localização atualizada. Salve para confirmar.');
        } catch {
            setMostrarCoordenadas(true);
            setErro('Não foi possível acessar o GPS. Informe as coordenadas.');
        } finally {
            setBuscandoGps(false);
        }
    }

    function aplicarCoordenadas() {
        const valorLat = Number(String(coordLat).replace(',', '.'));
        const valorLon = Number(String(coordLon).replace(',', '.'));

        if (isNaN(valorLat) || isNaN(valorLon)) {
            setErro('Informe latitude e longitude em números.');
            return;
        }

        setLatitude(valorLat);
        setLongitude(valorLon);
        setMostrarCoordenadas(false);
        setRecado('Coordenadas aplicadas. Salve para confirmar.');
    }

    async function aoSalvar() {
        setErro('');
        setRecado('');

        if (nome.trim().length < 2 || sobrenome.trim().length < 2) return setErro('Informe o nome e o sobrenome.');
        if (telefone.replace(/\D/g, '').length < 10) return setErro('Informe o telefone com DDD.');
        if (cep.replace(/\D/g, '').length !== 8 || !logradouro.trim() || !numero.trim()) return setErro('Preencha o endereço completo.');
        if (!bairro.trim() || !cidade.trim() || uf.trim().length !== 2) return setErro('Informe o bairro, a cidade e a UF.');
        if (latitude === null || longitude === null) {
            setMostrarCoordenadas(true);
            return setErro('Capture a sua localização ou informe as coordenadas.');
        }

        if (ehContratado) {
            if (!profissao) return setErro('Selecione a sua profissão.');
            if (profissao === 'OUTROS' && profissaoOutro.trim().length < 3) return setErro('Descreva a sua profissão.');
            if (dias.length === 0) return setErro('Selecione pelo menos um dia de atendimento.');
            if (faixas.length === 0) return setErro('Selecione pelo menos uma faixa de horário.');
            if (!descricao.trim()) return setErro('Descreva a sua experiência.');
        }

        setSalvando(true);

        try {
            await atualizarPerfil({ nome: nome.trim(), sobrenome: sobrenome.trim(), telefone: telefone.replace(/\D/g, '') });

            if (ehContratante) {
                await atualizarPerfilContratante({
                    tipoPessoa, cpfCnpj: cpfCnpj.replace(/\D/g, ''), cep: cep.replace(/\D/g, ''),
                    logradouro: logradouro.trim(), numero: numero.trim(), complemento: complemento.trim() || null,
                    bairro: bairro.trim(), cidade: cidade.trim(), uf: uf.trim().toUpperCase(), latitude, longitude,
                });
            }

            if (ehContratado) {
                await atualizarPerfilContratado({
                    descricao: descricao.trim(),
                    servicos: profissao === 'OUTROS' ? 'Outros: ' + profissaoOutro.trim() : rotuloDaProfissao(profissao),
                    disponibilidade: montarDisponibilidade(dias, faixas),
                    cep: cep.replace(/\D/g, ''), logradouro: logradouro.trim(), numero: numero.trim(),
                    complemento: complemento.trim() || null, bairro: bairro.trim(), cidade: cidade.trim(),
                    uf: uf.trim().toUpperCase(), latitude, longitude, raioBuscaKm,
                });
            }

            setRecado('Dados salvos com sucesso.');
        } catch (e) {
            setErro(e.message);
        } finally {
            setSalvando(false);
        }
    }

    if (carregandoSessao) {
        return (
            <Tela cor={cores.branco}>
                <View style={styles.centro}><ActivityIndicator color={cores.azul} size="large" /></View>
            </Tela>
        );
    }

    if (!usuario) return <Redirect href="/login" />;

    return (
        <Tela cor={cores.branco}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <Cabecalho titulo="Meu perfil" subtitulo={usuario.email} mostrarVoltar={false} />

                    <View style={styles.identidade}>
                        <View style={styles.avatar}><Text style={styles.avatarLetra}>{String(usuario.nome || 'T').charAt(0).toUpperCase()}</Text></View>
                        <View style={styles.identidadeTexto}>
                            <Text style={styles.nomeUsuario}>{((usuario.nome || '') + ' ' + (usuario.sobrenome || '')).trim()}</Text>
                            <Text style={styles.informacao}>{ehContratante ? 'Contratante' : 'Trabalhador'}</Text>
                        </View>
                    </View>

                    {carregando ? <ActivityIndicator color={cores.azul} style={styles.carregando} /> : null}

                    <Text style={styles.secao}>Dados pessoais</Text>
                    <Vidro style={styles.formulario}>
                        <CampoTexto label="Nome" valor={nome} onChange={(v) => setNome(limparNome(v))} autoCapitalize="words" maxLength={40} placeholder="Seu nome" />
                        <CampoTexto label="Sobrenome" valor={sobrenome} onChange={(v) => setSobrenome(limparNome(v))} autoCapitalize="words" maxLength={40} placeholder="Seu sobrenome" />
                        <CampoTexto label="Telefone" valor={telefone} onChange={(v) => setTelefone(mascararTelefone(v))} keyboard="phone-pad" maxLength={15} placeholder="(11) 99999-9999" />
                    </Vidro>

                    <Text style={styles.secao}>Endereço</Text>
                    <Vidro style={styles.formulario}>
                        <CampoTexto label="CEP" valor={cep} onChange={aoDigitarCep} placeholder="00000-000" keyboard="number-pad" maxLength={9} editable={!buscandoCep} />
                        {buscandoCep ? <Text style={styles.dica}>Consultando o CEP...</Text> : null}
                        <CampoTexto label="Logradouro" valor={logradouro} onChange={setLogradouro} placeholder="Rua, avenida..." editable={!enderecoTravado} />
                        <CampoTexto label="Número" valor={numero} onChange={(v) => setNumero(limparNumero(v))} placeholder="123" maxLength={10} />
                        <CampoTexto label="Complemento" valor={complemento} onChange={setComplemento} placeholder="Apto, bloco, casa (opcional)" maxLength={40} />
                        <CampoTexto label="Bairro" valor={bairro} onChange={setBairro} placeholder="Bairro" editable={!enderecoTravado} />
                        <View style={styles.linhaDupla}>
                            <View style={styles.coluna}><CampoTexto label="Cidade" valor={cidade} onChange={setCidade} placeholder="Cidade" editable={!enderecoTravado} /></View>
                            <View style={styles.colunaUf}><CampoTexto label="UF" valor={uf} onChange={setUf} placeholder="SP" maxLength={2} editable={!enderecoTravado} /></View>
                        </View>
                    </Vidro>

                    <Text style={styles.secao}>Localização</Text>
                    <Vidro style={styles.localCartao}>
                        <View style={styles.localTopo}>
                            <View style={[styles.localPin, { backgroundColor: latitude !== null ? cores.sucessoClaro : cores.alertaClaro }]}>
                                <Icone nome="navigate" tamanho={22} cor={latitude !== null ? cores.sucesso : cores.alerta} />
                            </View>

                            <View style={styles.localTextos}>
                                <Text style={styles.localTitulo}>
                                    {latitude !== null ? 'Localização ativa' : 'Localização pendente'}
                                </Text>
                                <Text style={styles.dica}>
                                    {latitude !== null
                                        ? 'Usada para mostrar serviços perto de você.'
                                        : 'Ative para receber serviços próximos.'}
                                </Text>
                            </View>

                            <View style={[styles.localSelo, { backgroundColor: latitude !== null ? cores.sucessoClaro : cores.alertaClaro }]}>
                                <Text style={[styles.localSeloTexto, { color: latitude !== null ? cores.sucesso : cores.alerta }]}>
                                    {latitude !== null ? 'Ativa' : 'Pendente'}
                                </Text>
                            </View>
                        </View>

                        {latitude !== null ? (
                            <View style={styles.localCoordenadas}>
                                <Icone nome="pin-outline" tamanho={13} cor={cores.cinzaTexto} />
                                <Text style={styles.localCoordenadasTexto} numberOfLines={1}>
                                    {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                                </Text>
                                <Icone nome="checkmark-circle" tamanho={14} cor={cores.sucesso} />
                            </View>
                        ) : null}

                        <Botao
                            titulo={buscandoGps ? 'Buscando sua localização...' : 'Usar minha localização atual'}
                            icone="locate-outline"
                            carregando={buscandoGps}
                            onPress={atualizarLocalizacao}
                        />

                        <Pressable
                            accessibilityRole="button"
                            onPress={() => setMostrarCoordenadas((valor) => !valor)}
                            style={({ pressed }) => [styles.localAlternar, pressed ? styles.atalhoPressionado : null]}
                        >
                            <Icone nome="create-outline" tamanho={15} cor={cores.azul} />
                            <Text style={styles.localAlternarTexto}>
                                {mostrarCoordenadas ? 'Ocultar coordenadas manuais' : 'Informar coordenadas manualmente'}
                            </Text>
                            <Icone nome={mostrarCoordenadas ? 'chevron-up' : 'chevron-down'} tamanho={15} cor={cores.cinzaTexto} />
                        </Pressable>

                        {mostrarCoordenadas ? (
                            <View style={styles.areaCoordenadas}>
                                <Text style={styles.dica}>
                                    Se o GPS não funcionar, informe a latitude e a longitude do seu endereço.
                                </Text>
                                <View style={styles.linhaDupla}>
                                    <View style={styles.coluna}><CampoTexto label="Latitude" valor={coordLat} onChange={setCoordLat} placeholder="-23.5505" keyboard="numbers-and-punctuation" /></View>
                                    <View style={styles.coluna}><CampoTexto label="Longitude" valor={coordLon} onChange={setCoordLon} placeholder="-46.6333" keyboard="numbers-and-punctuation" /></View>
                                </View>
                                <Botao titulo="Aplicar coordenadas" variante="claro" compacto onPress={aplicarCoordenadas} />
                            </View>
                        ) : null}
                    </Vidro>

                    {ehContratante ? (
                        <>
                            <Text style={styles.secao}>Documento</Text>
                            <Vidro style={styles.formulario}>
                                <Text style={styles.rotulo}>Tipo de pessoa</Text>
                                <Text style={styles.documentoTipo}>{tipoPessoa === 'PESSOA_JURIDICA' ? 'Pessoa jurídica' : 'Pessoa física'}</Text>
                                <CampoTexto label={tipoPessoa === 'PESSOA_JURIDICA' ? 'CNPJ' : 'CPF'} valor={cpfCnpj} onChange={() => {}} editable={false} />
                                <View style={styles.avisoDocumento}>
                                    <Icone nome="lock-closed-outline" tamanho={14} cor={cores.cinzaTexto} />
                                    <Text style={styles.dica}>O documento não pode ser alterado após o cadastro.</Text>
                                </View>
                            </Vidro>
                        </>
                    ) : null}

                    {ehContratado ? (
                        <>
                            <Text style={styles.secao}>Dados de trabalhador</Text>
                            <Vidro style={styles.formulario}>
                                <CampoTexto label="Sobre você" valor={descricao} onChange={setDescricao} multiline autoCapitalize="sentences" maxLength={500} placeholder="Experiência e diferenciais" />
                                <Seletor label="Profissão" valor={profissao} opcoes={PROFISSOES} onChange={setProfissao} placeholder="Selecione a sua profissão" />
                                {profissao === 'OUTROS' ? (
                                    <CampoTexto label="Qual profissão?" valor={profissaoOutro} onChange={setProfissaoOutro} autoCapitalize="sentences" maxLength={60} placeholder="Descreva a sua profissão" />
                                ) : null}
                                <SeletorDias label="Dias de atendimento" selecionados={dias} onChange={setDias} />
                                <SeletorFaixas label="Faixas de horário" selecionadas={faixas} onChange={setFaixas} />
                                <ControleDeslizante label="Raio de atendimento" valor={raioBuscaKm} min={1} max={50} passo={1} sufixo="km" onChange={setRaioBuscaKm} />
                            </Vidro>
                        </>
                    ) : null}

                    <View style={styles.espaco} />
                    <Botao titulo="Salvar alterações" onPress={aoSalvar} carregando={salvando} />

                    <View style={styles.atalhos}>
                        <Pressable accessibilityRole="button" onPress={() => router.push('/historico')} style={({ pressed }) => [styles.atalho, pressed ? styles.atalhoPressionado : null]}>
                            <Icone nome="time-outline" tamanho={18} cor={cores.azul} />
                            <Text style={styles.atalhoTexto}>Histórico</Text>
                            <Icone nome="chevron-forward" tamanho={16} cor={cores.cinzaTexto} />
                        </Pressable>
                        <Pressable accessibilityRole="button" onPress={() => router.push('/avaliacoes')} style={({ pressed }) => [styles.atalho, pressed ? styles.atalhoPressionado : null]}>
                            <Icone nome="star-outline" tamanho={18} cor={cores.azul} />
                            <Text style={styles.atalhoTexto}>Avaliações recebidas</Text>
                            <Icone nome="chevron-forward" tamanho={16} cor={cores.cinzaTexto} />
                        </Pressable>
                        <Pressable accessibilityRole="button" onPress={() => router.push('/notificacoes')} style={({ pressed }) => [styles.atalho, pressed ? styles.atalhoPressionado : null]}>
                            <Icone nome="notifications-outline" tamanho={18} cor={cores.azul} />
                            <Text style={styles.atalhoTexto}>Notificações</Text>
                            <Icone nome="chevron-forward" tamanho={16} cor={cores.cinzaTexto} />
                        </Pressable>
                        <Pressable accessibilityRole="button" onPress={() => router.push('/suporte')} style={({ pressed }) => [styles.atalho, pressed ? styles.atalhoPressionado : null]}>
                            <Icone nome="headset-outline" tamanho={18} cor={cores.sucesso} />
                            <Text style={styles.atalhoTexto}>Ajuda e suporte</Text>
                            <Icone nome="chevron-forward" tamanho={16} cor={cores.cinzaTexto} />
                        </Pressable>
                        <Pressable accessibilityRole="button" onPress={sair} style={({ pressed }) => [styles.atalho, pressed ? styles.atalhoPressionado : null]}>
                            <Icone nome="log-out-outline" tamanho={18} cor={cores.erro} />
                            <Text style={[styles.atalhoTexto, styles.atalhoTextoPerigo]}>Sair da conta</Text>
                            <Icone nome="chevron-forward" tamanho={16} cor={cores.cinzaTexto} />
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <BarraInferior abaAtiva="perfil" tipo={usuario.tipo} />

            <Aviso visivel={Boolean(erro)} mensagem={erro} tipo="erro" aoFechar={() => setErro('')} />
            <Aviso visivel={Boolean(recado)} mensagem={recado} tipo="sucesso" aoFechar={() => setRecado('')} />
        </Tela>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    conteudo: { padding: espacos.lg, paddingBottom: espacos.md },
    identidade: { flexDirection: 'row', alignItems: 'center', gap: espacos.md, marginBottom: espacos.lg },
    avatar: { width: 52, height: 52, borderRadius: raios.pilula, backgroundColor: cores.azul, alignItems: 'center', justifyContent: 'center' },
    avatarLetra: { color: cores.branco, fontSize: 20, fontWeight: '700' },
    identidadeTexto: { flex: 1, gap: 2 },
    nomeUsuario: { fontSize: 17, fontWeight: '700', color: cores.preto },
    carregando: { marginBottom: espacos.md },
    secao: { fontSize: 16, fontWeight: '700', color: cores.preto, marginTop: espacos.md, marginBottom: espacos.sm },
    formulario: { padding: espacos.lg },
    linhaDupla: { flexDirection: 'row', gap: espacos.md },
    coluna: { flex: 1 },
    colunaUf: { width: 90 },
    dica: { fontSize: 12, color: cores.cinzaTexto },
    localCartao: { padding: espacos.lg, gap: espacos.md },
    localTopo: { flexDirection: 'row', alignItems: 'center', gap: espacos.md },
    localPin: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    localTextos: { flex: 1, gap: 3 },
    localTitulo: { fontSize: 15, fontWeight: '700', color: cores.preto },
    localSelo: { borderRadius: raios.pilula, paddingHorizontal: 9, paddingVertical: 3 },
    localSeloTexto: { fontSize: 10, fontWeight: '700' },
    localCoordenadas: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: cores.cinza, borderRadius: raios.pequeno, paddingHorizontal: espacos.md, paddingVertical: espacos.sm },
    localCoordenadasTexto: { flex: 1, fontSize: 11, color: cores.cinzaTexto },
    localAlternar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: espacos.xs },
    localAlternarTexto: { fontSize: 12, fontWeight: '600', color: cores.azul },
    rotulo: { fontSize: 13, color: cores.cinzaTexto, fontWeight: '600' },
    documentoTipo: { fontSize: 15, fontWeight: '600', color: cores.preto, marginBottom: espacos.md },
    avisoDocumento: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    areaCoordenadas: { gap: espacos.sm, marginTop: espacos.sm },
    informacao: { fontSize: 12, color: cores.cinzaTexto },
    espaco: { height: espacos.md },
    atalhos: { marginTop: espacos.lg, gap: espacos.sm },
    atalho: { flexDirection: 'row', alignItems: 'center', gap: espacos.md, backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.borda, borderRadius: raios.medio, paddingVertical: espacos.md, paddingHorizontal: espacos.lg },
    atalhoPressionado: { backgroundColor: cores.cinza },
    atalhoTexto: { flex: 1, fontSize: 14, fontWeight: '600', color: cores.preto },
    atalhoTextoPerigo: { color: cores.erro },
});
