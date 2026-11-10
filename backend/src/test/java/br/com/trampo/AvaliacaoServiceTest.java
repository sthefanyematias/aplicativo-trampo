package br.com.trampo;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;

import br.com.trampo.exception.ConflitoException;
import br.com.trampo.exception.RegraNegocioException;
import br.com.trampo.model.Avaliacao;
import br.com.trampo.model.Contratado;
import br.com.trampo.model.Contratante;
import br.com.trampo.model.Servico;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.StatusServico;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.AvaliacaoRepository;
import br.com.trampo.repository.ContratadoRepository;
import br.com.trampo.repository.ServicoRepository;
import br.com.trampo.repository.UsuarioRepository;
import br.com.trampo.service.AvaliacaoService;
import br.com.trampo.service.NotificacaoService;

@ExtendWith(MockitoExtension.class)
class AvaliacaoServiceTest {

    @Mock private AvaliacaoRepository avaliacaoRepository;
    @Mock private ServicoRepository servicoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private ContratadoRepository contratadoRepository;
    @Mock private NotificacaoService notificacaoService;
    @InjectMocks private AvaliacaoService service;

    private Usuario contratanteUsuario;
    private Usuario contratadoUsuario;
    private Servico servico;
    private Contratado contratado;

    @BeforeEach
    void preparar() {
        contratanteUsuario = usuario(7L, TipoUsuario.CONTRATANTE, "Geovana", "Novais");
        contratadoUsuario = usuario(8L, TipoUsuario.CONTRATADO, "Sthefany", "Matias");

        Contratante contratante = new Contratante();
        contratante.setId(3L);
        contratante.setUsuario(contratanteUsuario);

        contratado = new Contratado();
        contratado.setId(4L);
        contratado.setUsuario(contratadoUsuario);

        servico = new Servico();
        servico.setId(5L);
        servico.setTitulo("Limpeza de apartamento");
        servico.setContratante(contratante);
        servico.setContratado(contratado);
        servico.setStatus(StatusServico.CONCLUIDO);
    }

    @Test
    @DisplayName("avaliacao de servico nao concluido e recusada")
    void avaliarServicoNaoConcluido() {
        servico.setStatus(StatusServico.ABERTO);
        when(servicoRepository.findById(5L)).thenReturn(Optional.of(servico));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.avaliar(5L, 7L, 8L, avaliacao(5), contratanteUsuario));

        assertEquals("Só é possível avaliar serviços concluídos.", erro.getMessage());
    }

    @Test
    @DisplayName("autoavaliacao e recusada")
    void avaliarASiMesmo() {
        when(servicoRepository.findById(5L)).thenReturn(Optional.of(servico));
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(contratanteUsuario));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.avaliar(5L, 7L, 7L, avaliacao(5), contratanteUsuario));

        assertEquals("Não é possível avaliar a si mesmo.", erro.getMessage());
    }

    @Test
    @DisplayName("segunda avaliacao do mesmo avaliador e recusada")
    void avaliarDuplicada() {
        when(servicoRepository.findById(5L)).thenReturn(Optional.of(servico));
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(contratanteUsuario));
        when(usuarioRepository.findById(8L)).thenReturn(Optional.of(contratadoUsuario));
        when(avaliacaoRepository.existsByServicoIdAndAvaliadorId(5L, 7L)).thenReturn(true);

        ConflitoException erro = assertThrows(ConflitoException.class,
                () -> service.avaliar(5L, 7L, 8L, avaliacao(5), contratanteUsuario));

        assertEquals("Esta avaliação já foi enviada e não pode ser alterada.", erro.getMessage());
    }

    @Test
    @DisplayName("avaliacao valida e gravada e a media do contratado e recalculada")
    void avaliarERecalcularMedia() {
        when(servicoRepository.findById(5L)).thenReturn(Optional.of(servico));
        when(usuarioRepository.findById(7L)).thenReturn(Optional.of(contratanteUsuario));
        when(usuarioRepository.findById(8L)).thenReturn(Optional.of(contratadoUsuario));
        when(avaliacaoRepository.existsByServicoIdAndAvaliadorId(5L, 7L)).thenReturn(false);
        when(avaliacaoRepository.save(any(Avaliacao.class))).thenAnswer(i -> i.getArgument(0));
        when(contratadoRepository.findByUsuarioId(8L)).thenReturn(Optional.of(contratado));
        when(avaliacaoRepository.findByAvaliadoId(eq(8L), any()))
                .thenReturn(new PageImpl<>(List.of(avaliacao(5))));

        Avaliacao salva = service.avaliar(5L, 7L, 8L, avaliacao(5), contratanteUsuario);

        assertEquals(5, salva.getNota());
        assertEquals(5.0, contratado.getMediaAvaliacao());
        verify(notificacaoService, times(2)).criar(any(), anyString(), anyString(), anyString(), anyLong());
    }

    private Avaliacao avaliacao(int nota) {
        Avaliacao a = new Avaliacao();
        a.setNota(nota);
        a.setComentario("Serviço executado no prazo.");
        return a;
    }

    private Usuario usuario(Long id, TipoUsuario tipo, String nome, String sobrenome) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setNome(nome);
        u.setSobrenome(sobrenome);
        u.setTipo(tipo);
        u.setAtivo(true);
        return u;
    }
}