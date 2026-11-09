import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icone from './Icone';
import { listarConversas } from '../services/api';
import { cores, espacos, raios, sombras, vidro } from '../theme/cores';

const ABAS = {
    CONTRATANTE: [
        { chave: 'home', rotulo: 'Início', icone: 'home', vazio: 'home-outline', rota: '/home' },
        {
            chave: 'servicos',
            rotulo: 'Serviços',
            icone: 'briefcase',
            vazio: 'briefcase-outline',
            rota: '/meus-servicos',
        },
        {
            chave: 'conversas',
            rotulo: 'Conversas',
            icone: 'chatbubbles',
            vazio: 'chatbubbles-outline',
            rota: '/conversas',
        },
        {
            chave: 'perfil',
            rotulo: 'Perfil',
            icone: 'person',
            vazio: 'person-outline',
            rota: '/perfil',
        },
    ],
    CONTRATADO: [
        { chave: 'home', rotulo: 'Início', icone: 'home', vazio: 'home-outline', rota: '/home' },
        {
            chave: 'vagas',
            rotulo: 'Vagas',
            icone: 'navigate',
            vazio: 'navigate-outline',
            rota: '/proximos',
        },
        {
            chave: 'conversas',
            rotulo: 'Conversas',
            icone: 'chatbubbles',
            vazio: 'chatbubbles-outline',
            rota: '/conversas',
        },
        {
            chave: 'perfil',
            rotulo: 'Perfil',
            icone: 'person',
            vazio: 'person-outline',
            rota: '/perfil',
        },
    ],
};

export default function BarraInferior({ abaAtiva, tipo }) {
    const router = useRouter();
    const bordas = useSafeAreaInsets();
    const abas = ABAS[tipo] || ABAS.CONTRATADO;

    const [naoLidas, setNaoLidas] = useState(0);

    useEffect(() => {
        let ativo = true;

        listarConversas()
            .then((dados) => {
                if (!ativo) return;
                const total = (dados ?? []).reduce(
                    (soma, conversa) => soma + Number(conversa.naoLidas || 0),
                    0
                );
                setNaoLidas(total);
            })
            .catch(() => {});

        return () => {
            ativo = false;
        };
    }, [abaAtiva]);

    return (
        <View style={[styles.area, { paddingBottom: bordas.bottom + espacos.sm }]}>
            <View style={[styles.barra, sombras.flutuante]}>
                {abas.map((aba) => {
                    const ativa = aba.chave === abaAtiva;
                    const temAviso = aba.chave === 'conversas' && naoLidas > 0;

                    return (
                        <Pressable
                            key={aba.chave}
                            accessibilityRole="tab"
                            accessibilityLabel={
                                temAviso
                                    ? aba.rotulo + ', ' + naoLidas + ' mensagens não lidas'
                                    : aba.rotulo
                            }
                            accessibilityState={{ selected: ativa }}
                            onPress={() => router.replace(aba.rota)}
                            style={({ pressed }) => [
                                styles.aba,
                                ativa ? styles.abaAtiva : null,
                                pressed ? styles.abaPressionada : null,
                            ]}
                        >
                            <View style={styles.iconeArea}>
                                <Icone
                                    nome={ativa ? aba.icone : aba.vazio}
                                    tamanho={20}
                                    cor={ativa ? cores.branco : cores.cinzaTexto}
                                />

                                {temAviso ? (
                                    <View style={styles.ponto}>
                                        <Text style={styles.pontoTexto}>
                                            {naoLidas > 9 ? '9+' : naoLidas}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>

                            <Text style={[styles.rotulo, ativa ? styles.rotuloAtivo : null]}>
                                {aba.rotulo}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    area: {
        paddingHorizontal: espacos.lg,
        paddingTop: espacos.sm,
    },
    barra: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: vidro.claro,
        borderWidth: 1,
        borderColor: vidro.bordaClara,
        borderRadius: raios.pilula,
        paddingHorizontal: espacos.sm,
        paddingVertical: 6,
    },
    aba: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        borderRadius: raios.pilula,
        gap: 3,
    },
    abaAtiva: { backgroundColor: cores.azul },
    abaPressionada: { opacity: 0.75 },
    iconeArea: { alignItems: 'center', justifyContent: 'center' },
    ponto: {
        position: 'absolute',
        top: -5,
        right: -10,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: cores.erro,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: cores.branco,
    },
    pontoTexto: { color: cores.branco, fontSize: 9, fontWeight: '700' },
    rotulo: { fontSize: 9, fontWeight: '600', color: cores.cinzaTexto },
    rotuloAtivo: { color: cores.branco },
});