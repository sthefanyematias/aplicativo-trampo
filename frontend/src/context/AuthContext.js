import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    aoExpirarSessao,
    atualizarMe as atualizarMeApi,
    carregarUsuarioAtual,
    definirToken,
    lerTokenSalvo,
    limparTokenSalvo,
    salvarTokenSalvo,
} from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [sessaoExpirada, setSessaoExpirada] = useState(false);
    const montado = useRef(true);

    const encerrarSessao = useCallback(async ({ expirada = false } = {}) => {
        definirToken(null);
        await limparTokenSalvo();
        if (!montado.current) return;
        setUsuario(null);
        setSessaoExpirada(expirada);
    }, []);

    useEffect(() => {
        aoExpirarSessao(() => encerrarSessao({ expirada: true }));
        return () => aoExpirarSessao(null);
    }, [encerrarSessao]);

    useEffect(() => {
        montado.current = true;

        (async () => {
            try {
                const token = await lerTokenSalvo();
                if (!token) return;

                definirToken(token);
                const perfil = await carregarUsuarioAtual();
                if (montado.current) setUsuario(perfil);
            } catch {
                await encerrarSessao();
            } finally {
                if (montado.current) setCarregando(false);
            }
        })();

        return () => {
            montado.current = false;
        };
    }, [encerrarSessao]);

    const entrar = useCallback(async (dados) => {
        definirToken(dados.token);
        await salvarTokenSalvo(dados.token);
        setSessaoExpirada(false);

        try {
            const perfil = await carregarUsuarioAtual();
            setUsuario(perfil);
            return perfil;
        } catch {
            setUsuario(dados.usuario ?? null);
            return dados.usuario ?? null;
        }
    }, []);

    const sair = useCallback(async () => {
        await encerrarSessao();
    }, [encerrarSessao]);

    const atualizarPerfil = useCallback(async (dados) => {
        const atualizado = await atualizarMeApi(dados);
        setUsuario((anterior) => ({ ...anterior, ...atualizado }));
        return atualizado;
    }, []);

    const recarregar = useCallback(async () => {
        const perfil = await carregarUsuarioAtual();
        setUsuario(perfil);
        return perfil;
    }, []);

    const valor = useMemo(
        () => ({
            usuario,
            carregando,
            sessaoExpirada,
            entrar,
            sair,
            atualizarPerfil,
            recarregar,
            estaLogado: Boolean(usuario),
            tipo: usuario?.tipo ?? null,
            ehContratante: usuario?.tipo === 'CONTRATANTE',
            ehContratado: usuario?.tipo === 'CONTRATADO',
            ehAdmin: usuario?.tipo === 'ADMIN',
            contratanteId: usuario?.contratanteId ?? null,
            contratadoId: usuario?.contratadoId ?? null,
        }),
        [usuario, carregando, sessaoExpirada, entrar, sair, atualizarPerfil, recarregar]
    );

    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
