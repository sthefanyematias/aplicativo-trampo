package br.com.trampo;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import br.com.trampo.exception.RegraNegocioException;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.ContratadoRepository;
import br.com.trampo.repository.ContratanteRepository;
import br.com.trampo.repository.UsuarioRepository;
import br.com.trampo.service.UsuarioService;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private ContratadoRepository contratadoRepository;
    @Mock private ContratanteRepository contratanteRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private UsuarioService service;

    private Usuario usuario;

    @BeforeEach
    void preparar() {
        usuario = new Usuario();
        usuario.setId(7L);
        usuario.setNome("Geovana");
        usuario.setSobrenome("Novais");
        usuario.setTelefone("11988887777");
        usuario.setTipo(TipoUsuario.CONTRATANTE);
        usuario.setAtivo(true);
    }

    @Test
    @DisplayName("atualizacao com nome vazio e recusada")
    void atualizarComNomeVazio() {
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario));
        Usuario dados = new Usuario();
        dados.setNome("");
        dados.setSobrenome("Novais");
        dados.setTelefone("11988887777");

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.atualizarMe(usuario, dados));

        assertEquals("O nome é obrigatório.", erro.getMessage());
    }

    @Test
    @DisplayName("atualizacao com telefone vazio e recusada")
    void atualizarComTelefoneVazio() {
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario));
        Usuario dados = new Usuario();
        dados.setNome("Geovana");
        dados.setSobrenome("Novais");
        dados.setTelefone("");

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.atualizarMe(usuario, dados));

        assertEquals("O telefone é obrigatório.", erro.getMessage());
    }

    @Test
    @DisplayName("exclusao de usuario e logica e desativa o cadastro")
    void excluirDesativaCadastro() {
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        service.deletar(7L);

        assertFalse(usuario.getAtivo());
        verify(usuarioRepository).save(usuario);
    }
}