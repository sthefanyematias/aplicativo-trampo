import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icone from './Icone';
import { cores, raios } from '../theme/cores';

export default function CampoTexto({
    label,
    valor,
    onChange,
    placeholder,
    secure = false,
    keyboard = 'default',
    autoCapitalize = 'none',
    multiline = false,
    error,
    maxLength,
    autoComplete,
    editable = true,
    aoSair,
}) {
    const [focado, setFocado] = useState(false);
    const [senhaVisivel, setSenhaVisivel] = useState(false);

    const mostrarTexto = secure ? senhaVisivel : true;

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <View
                style={[
                    styles.campo,
                    multiline ? styles.campoMultilinha : null,
                    focado ? styles.campoFocado : null,
                    error ? styles.campoErro : null,
                    !editable ? styles.campoDesabilitado : null,
                ]}
            >
                <TextInput
                    style={[styles.input, multiline ? styles.inputMultilinha : null]}
                    value={valor}
                    onChangeText={onChange}
                    onFocus={() => setFocado(true)}
                    onBlur={() => {
                        setFocado(false);
                        if (aoSair) aoSair();
                    }}
                    placeholder={placeholder}
                    placeholderTextColor={cores.cinzaTexto}
                    secureTextEntry={secure ? !senhaVisivel : false}
                    keyboardType={keyboard}
                    autoCapitalize={autoCapitalize}
                    autoComplete={autoComplete}
                    autoCorrect={false}
                    multiline={multiline}
                    maxLength={maxLength}
                    editable={editable}
                />

                {secure ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                        accessibilityState={{ selected: senhaVisivel }}
                        onPress={() => setSenhaVisivel((atual) => !atual)}
                        hitSlop={10}
                        style={styles.olho}
                    >
                        <Icone
                            nome={senhaVisivel ? 'eye-off-outline' : 'eye-outline'}
                            tamanho={20}
                            cor={focado ? cores.azul : cores.cinzaTexto}
                        />
                    </Pressable>
                ) : null}
            </View>

            {error ? <Text style={styles.erro}>{error}</Text> : null}
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 52,
        borderWidth: 1,
        borderColor: cores.borda,
        borderRadius: raios.medio,
        paddingHorizontal: 14,
        backgroundColor: cores.branco,
    },
    campoMultilinha: {
        height: 110,
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    campoFocado: {
        borderColor: cores.azul,
        borderWidth: 2,
        paddingHorizontal: 13,
    },
    campoErro: {
        borderColor: cores.erro,
    },
    campoDesabilitado: {
        backgroundColor: cores.cinza,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 15,
        color: cores.preto,
        padding: 0,
    },
    inputMultilinha: {
        height: '100%',
        textAlignVertical: 'top',
    },
    olho: {
        paddingLeft: 4,
        paddingVertical: 4,
    },
    erro: {
        color: cores.erro,
        fontSize: 12,
        marginTop: 4,
    },
});