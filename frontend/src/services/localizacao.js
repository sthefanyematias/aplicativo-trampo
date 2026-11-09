import * as Location from 'expo-location';

export async function obterLocalizacao() {
    let servicosAtivos = true;

    try {
        servicosAtivos = await Location.hasServicesEnabledAsync();
    } catch {
        servicosAtivos = true;
    }

    if (!servicosAtivos) {
        throw new Error(
            'A localização do aparelho está desligada. Ative o GPS e toque em "Usar minha localização" novamente.'
        );
    }

    const permissao = await Location.requestForegroundPermissionsAsync();

    if (permissao.status !== 'granted') {
        throw new Error(
            'Permita o acesso à localização nas configurações do aparelho para continuar.'
        );
    }

    try {
        const posicao = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,
        };
    } catch {
        try {
            const ultima = await Location.getLastKnownPositionAsync({});

            if (ultima) {
                return {
                    latitude: ultima.coords.latitude,
                    longitude: ultima.coords.longitude,
                };
            }
        } catch {
        }

        throw new Error(
            'Não conseguimos a sua localização. Defina uma posição no GPS do emulador ou digite as coordenadas abaixo.'
        );
    }
}