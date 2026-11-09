import { useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Icone from './Icone';
import { cores, raios } from '../theme/cores';

export default function Seletor({
    label,
    valor,
    opcoes,
    onChange,
    placeholder,
    error,
    pesquisavel = false,
}) {
    const [aberto, setAberto] = useState(false);
    const [busca, setBusca] = useState('');

    const mostrarBusca = pesquisavel || opcoes.length > 10;
    const selecionada = opcoes.find((item) => item.valor === valor);
    const termo = busca.trim().toLowerCase();

    const filtradas = termo
        ? opcoes.filter((item) => item.rotulo.toLowerCase().includes(termo))
        : opcoes;

    function abrir() {
        setBusca('');
        setAberto(true);
    }

    function escolher(novoValor) {
        onChange(novoValor);
        setAberto(false);
    }

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <Pressable
                accessibilityRole="button"
                onPress={abrir}
                style={({ pressed }) => [
                    styles.campo,
                    pressed ? styles.campoPressionado : null,
                    error ? styles.campoErro : null,
                ]}
            >
                <Text style={selecionada ? styles.valor : styles.placeholder} numberOfLines={1}>
                    {selecionada ? selecionada.rotulo : placeholder || 'Toque para escolher'}
                </Text>
                <Icone nome="chevron-down" tamanho={16} cor={cores.cinzaTexto} />
            </Pressable>

            {error ? <Text style={styles.erro}>{error}</Text> : null}

            <Modal
                visible={aberto}
                transparent
                animationType="fade"
                onRequestClose={() => setAberto(false)}
            >
                <KeyboardAvoidingView
                    style={styles.fundo}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <Pressable style={styles.areaFundo} onPress={() => setAberto(false)} />

                    <View style={styles.caixa}>
                        <View style={styles.cabecalho}>
                            <Text style={styles.titulo}>{label || 'Escolha uma opção'}</Text>

                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Fechar"
                                onPress={() => setAberto(false)}
                                hitSlop={10}
                                style={styles.fechar}
                            >
                                <Icone nome="close" tamanho={20} cor={cores.cinzaTexto} />
                            </Pressable>
                        </View>

                        {mostrarBusca ? (
                            <View style={styles.buscaArea}>
                                <Icone nome="search" tamanho={16} cor={cores.cinzaTexto} />

                                <TextInput
                                    style={styles.buscaInput}
                                    value={busca}
                                    onChangeText={setBusca}
                                    placeholder="Buscar..."
                                    placeholderTextColor={cores.cinzaTexto}
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                />

                                {busca ? (
                                    <Pressable onPress={() => setBusca('')} hitSlop={8}>
                                        <Icone
                                            nome="close-circle"
                                            tamanho={16}
                                            cor={cores.cinzaTexto}
                                        />
                                    </Pressable>
                                ) : null}
                            </View>
                        ) : null}

                        <FlatList
                            data={filtradas}
                            keyExtractor={(item) => item.valor}
                            style={styles.lista}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.vazio}>Nenhuma opção encontrada.</Text>
                            }
                            renderItem={({ item }) => {
                                const ativa = item.valor === valor;

                                return (
                                    <Pressable
                                        onPress={() => escolher(item.valor)}
                                        style={({ pressed }) => [
                                            styles.opcao,
                                            ativa ? styles.opcaoAtiva : null,
                                            pressed ? styles.opcaoPressionada : null,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.textoOpcao,
                                                ativa ? styles.textoOpcaoAtiva : null,
                                            ]}
                                        >
                                            {item.rotulo}
                                        </Text>

                                        {ativa ? (
                                            <Icone
                                                nome="checkmark"
                                                tamanho={16}
                                                cor={cores.azul}
                                            />
                                        ) : null}
                                    </Pressable>
                                );
                            }}
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 14,
        width: '100%',
    },
    label: {
        fontSize: 14,
        color: cores.grafite,
        marginBottom: 6,
        fontWeight: '600',
    },
    campo: {
        height: 52,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: raios.medio,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: cores.branco,
        gap: 8,
    },
    campoPressionado: {
        borderColor: cores.azul,
        backgroundColor: cores.azulClaro,
    },
    campoErro: {
        borderColor: cores.erro,
    },
    valor: {
        flex: 1,
        fontSize: 15,
        color: cores.preto,
    },
    placeholder: {
        flex: 1,
        fontSize: 15,
        color: cores.cinzaTexto,
    },
    erro: {
        color: cores.erro,
        fontSize: 12,
        marginTop: 4,
    },
    fundo: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(21, 22, 26, 0.45)',
        padding: 20,
    },
    areaFundo: {
        ...StyleSheet.absoluteFillObject,
    },
    caixa: {
        backgroundColor: cores.branco,
        borderRadius: raios.grande,
        padding: 16,
        maxHeight: '78%',
    },
    cabecalho: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 8,
    },
    titulo: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: cores.preto,
    },
    fechar: {
        padding: 2,
    },
    buscaArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: raios.pequeno,
        paddingHorizontal: 12,
        height: 44,
        backgroundColor: cores.cinza,
        marginBottom: 12,
    },
    buscaInput: {
        flex: 1,
        fontSize: 14,
        color: cores.preto,
        paddingVertical: 0,
    },
    lista: {
        maxHeight: 360,
    },
    vazio: {
        fontSize: 13,
        color: cores.cinzaTexto,
        textAlign: 'center',
        paddingVertical: 24,
    },
    opcao: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: raios.pequeno,
        gap: 8,
    },
    opcaoAtiva: {
        backgroundColor: cores.azulClaro,
    },
    opcaoPressionada: {
        backgroundColor: cores.cinza,
    },
    textoOpcao: {
        flex: 1,
        fontSize: 15,
        color: cores.grafite,
    },
    textoOpcaoAtiva: {
        color: cores.azul,
        fontWeight: '700',
    },
});