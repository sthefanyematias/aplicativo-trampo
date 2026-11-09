import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Aviso from '../components/Aviso';
import BarraInferior from '../components/BarraInferior';
import Botao from '../components/Botao';
import Cabecalho from '../components/Cabecalho';
import CampoTexto from '../components/CampoTexto';
import EtiquetaStatus from '../components/EtiquetaStatus';
import Icone from '../components/Icone';
import Tela from '../components/Tela';
import Vidro from '../components/Vidro';
import { useAuth } from '../context/AuthContext';
import { listarServicosProximos, meuPerfilContratado } from '../services/api';
import { obterLocalizacao } from '../services/localizacao';
import { cores, espacos } from '../theme/cores';
import { formatarDinheiro, formatarQuando, montarEndereco } from '../utils/formato';

export default function TelaProximos() {
    const router = useRouter();
    const { usuario, carregando: carregandoSessao } = useAuth();

    const [ponto, setPonto] = useState(null);
    const [endereco, setEndereco] = useState('');
    const [raio, setRaio] = useState('10');

    const [servicos, setServicos] = useState([]);
    const [buscou, setBuscou] = useState(false);
    const [carregandoPerfil, setCarregandoPerfil] = useState(true);
    const [carregando, setCarregando] = useState(false);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (usuario) {
            iniciar();
        }
    }, [usuario]);

    async function iniciar() {
        try {
            const perfil = await meuPerfilContratado();
            setEndereco(montarEndereco(perfil));
            setRaio(String(Math.round(Number(perfil.raioBuscaKm ?? 10))));

            if (perfil.latitude !== null && perfil.longitude !== null) {
                setPonto({ latitude: perfil.latitude, longitude: perfil.longitude });
                await buscarCom(
                    perfil.latitude,
                    perfil.longitude,
                    Number(perfil.raioBuscaKm ?? 10)
                );
            } else {
                await usarGps();
            }
        } catch (e) {
            if (e.status !== 404) setErro(e.message);
            await usarGps();
        } finally {
            setCarregandoPerfil(false);
        }
    }

    async function usarGps() {
        try {
            const local = await obterLocalizacao();
            setPonto(local);
            await buscarCom(local.latitude, local.longitude, transformarRaio(raio));
        } catch (e) {
            setErro(e.message);
            setCarregandoPerfil(false);
        }
    }

    function transformarRaio(texto) {
        const numero = Number(String(texto).replace(',', '.'));
        if (isNaN(numero) || numero <= 0) return 10;
        return numero;
    }

    async function buscarCom(latitude, longitude, raioKm) {
        setErro('');
        setCarregando(true);

        try {
            const pagina = await listarServicosProximos({
                latitude,
                longitude,
                raioKm,
                pagina: 0,
                tamanho: 50,
            });
            setServicos(pagina?.conteudo ?? []);
            setBuscou(true);
        } catch (e) {
            setServicos([]);
            setErro(e.message);
        } finally {
            setCarregando(false);
            setAtualizando(false);
        }
    }

    function aoBuscar() {
        if (!ponto) {
            setErro('Localização indisponível. Toque em "Usar minha localização".');
            return;
        }

        buscarCom(ponto.latitude, ponto.longitude, transformarRaio(raio));
    }

    function aoPuxarParaAtualizar() {
        if (!buscou) return;
        setAtualizando(true);
        aoBuscar();
    }

    if (carregandoSessao) {
        return (
            <Tela>
                <View style={styles.centro}>
                    <ActivityIndicator color={cores.azul} size="large" />
                </View>
            </Tela>
        );
    }

    if (!usuario) return <Redirect href="/login" />;

    return (
        <Tela>
            <FlatList
                contentContainerStyle={styles.conteudo}
                data={servicos}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={atualizando}
                        onRefresh={aoPuxarParaAtualizar}
                        tintColor={cores.azul}
                        colors={[cores.azul]}
                    />
                }
                ListHeaderComponent={
                    <View>
                        <Cabecalho
                            titulo="Perto de mim"
                            subtitulo="Serviços dentro do seu raio de atendimento"
                            mostrarVoltar={false}
                        />

                        <Vidro style={styles.formulario}>
                            <Text style={styles.rotulo}>Sua localização</Text>

                            {endereco ? <Text style={styles.endereco}>{endereco}</Text> : null}

                            {ponto ? (
                                <Text style={styles.coordenadas}>
                                    {ponto.latitude.toFixed(4)}, {ponto.longitude.toFixed(4)}
                                </Text>
                            ) : (
                                <Text style={styles.localPendente}>
                                    Localização não encontrada.
                                </Text>
                            )}

                            <Botao
                                titulo="Usar minha localização"
                                icone="locate-outline"
                                variante="claro"
                                compacto
                                onPress={usarGps}
                            />

                            <CampoTexto
                                label="Raio de busca (km)"
                                valor={raio}
                                onChange={setRaio}
                                placeholder="10"
                                keyboard="decimal-pad"
                            />

                            <Botao
                                titulo="Buscar serviços"
                                carregando={carregando}
                                onPress={aoBuscar}
                            />
                        </Vidro>

                        {buscou && !carregando ? (
                            <Text style={styles.secao}>
                                {servicos.length}{' '}
                                {servicos.length === 1
                                    ? 'serviço encontrado'
                                    : 'serviços encontrados'}
                            </Text>
                        ) : null}
                    </View>
                }
                ListFooterComponent={
                    <View style={styles.rodape}>
                        {carregandoPerfil || carregando ? (
                            <ActivityIndicator color={cores.azul} />
                        ) : (
                            <Botao
                                titulo="Voltar para o início"
                                variante="claro"
                                onPress={() => router.replace('/home')}
                            />
                        )}
                    </View>
                }
                ListEmptyComponent={
                    !buscou || carregando ? null : (
                        <Vidro style={styles.vazio}>
                            <Icone nome="map-outline" tamanho={34} cor={cores.cinzaTexto} />
                            <Text style={styles.textoVazio}>
                                Nenhum serviço disponível neste raio.
                            </Text>
                            <Text style={styles.textoVazio}>
                                Aumente o raio para ampliar a busca.
                            </Text>
                        </Vidro>
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.toque}
                        onPress={() => router.push('/servico?id=' + item.id)}
                    >
                        <Vidro style={styles.cartao}>
                            <View style={styles.linhaTitulo}>
                                <Text style={styles.tituloCartao} numberOfLines={2}>
                                    {item.titulo}
                                </Text>
                                <EtiquetaStatus status={item.status} />
                            </View>

                            {item.descricao ? (
                                <Text style={styles.descricao} numberOfLines={2}>
                                    {item.descricao}
                                </Text>
                            ) : null}

                            <Text style={styles.quando}>
                                {formatarQuando(
                                    item.dataServico,
                                    item.horaInicio,
                                    item.horaFim,
                                    item.periodo
                                )}
                            </Text>

                            <Text style={styles.valor}>{formatarDinheiro(item.valor)}</Text>

                            {item.endereco ? (
                                <View style={styles.linhaEndereco}>
                                    <Icone
                                        nome="location-outline"
                                        tamanho={14}
                                        cor={cores.cinzaTexto}
                                    />
                                    <Text style={styles.informacao} numberOfLines={1}>
                                        {item.endereco}
                                    </Text>
                                </View>
                            ) : null}
                        </Vidro>
                    </TouchableOpacity>
                )}
            />

            <BarraInferior abaAtiva="proximos" tipo={usuario.tipo} />

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
    centro: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    conteudo: {
        padding: espacos.lg,
        paddingBottom: espacos.sm,
    },
    formulario: {
        padding: espacos.lg,
    },
    rotulo: {
        fontSize: 13,
        fontWeight: '600',
        color: cores.cinzaTexto,
    },
    endereco: {
        fontSize: 14,
        fontWeight: '600',
        color: cores.preto,
    },
    coordenadas: {
        fontSize: 12,
        color: cores.sucesso,
        fontWeight: '600',
    },
    localPendente: {
        fontSize: 12,
        fontWeight: '600',
        color: cores.alerta,
    },
    secao: {
        fontSize: 16,
        fontWeight: '700',
        color: cores.preto,
        marginTop: espacos.xl,
        marginBottom: espacos.md,
    },
    toque: {
        marginBottom: espacos.md,
    },
    cartao: {
        padding: espacos.lg,
    },
    linhaTitulo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: espacos.sm,
    },
    tituloCartao: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: cores.preto,
    },
    descricao: {
        fontSize: 14,
        color: cores.cinzaTexto,
    },
    quando: {
        fontSize: 12,
        fontWeight: '600',
        color: cores.grafite,
    },
    valor: {
        fontSize: 18,
        fontWeight: '700',
        color: cores.azul,
    },
    linhaEndereco: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    informacao: {
        flex: 1,
        fontSize: 12,
        color: cores.cinzaTexto,
    },
    vazio: {
        alignItems: 'center',
        gap: espacos.sm,
        paddingVertical: espacos.xl,
    },
    textoVazio: {
        color: cores.cinzaTexto,
        textAlign: 'center',
        fontSize: 13,
    },
    rodape: {
        marginTop: espacos.md,
    },
});