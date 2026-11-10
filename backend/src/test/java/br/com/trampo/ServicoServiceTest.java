package br.com.trampo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import br.com.trampo.exception.ConflitoException;
import br.com.trampo.exception.RegraNegocioException;
import br.com.trampo.model.Contratante;
import br.com.trampo.model.Servico;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.PeriodoServico;
import br.com.trampo.model.enums.StatusServico;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.AvaliacaoRepository;
import br.com.trampo.repository.CandidaturaRepository;
import br.com.trampo.repository.ContratadoRepository;
import br.com.trampo.repository.ContratanteRepository;
import br.com.trampo.repository.MensagemRepository;
import br.com.trampo.repository.ServicoRepository;
import br.com.trampo.service.NotificacaoService;
import br.com.trampo.service.ServicoService;

@ExtendWith(MockitoExtension.class)
class ServicoServiceTest {

    @Mock private ServicoRepository servicoRepository;
    @Mock private ContratanteRepository contratanteRepository;
    @Mock private ContratadoRepository contratadoRepository;
    @Mock private CandidaturaRepository candidaturaRepository;
    @Mock private MensagemRepository mensagemRepository;
    @Mock private AvaliacaoRepository avaliacaoRepository;
    @Mock private NotificacaoService notificacaoService;
    @InjectMocks private ServicoService service;

    private Usuario dono;
    private Contratante contratante;

    @BeforeEach
    void preparar() {
        dono = new Usuario();
        dono.setId(7L);
        dono.setNome("Geovana");
        dono.setSobrenome("Novais");
        dono.setTipo(TipoUsuario.CONTRATANTE);
        dono.setAtivo(true);
        contratante = new Contratante();
        contratante.setId(3L);
        contratante.setUsuario(dono);
        contratante.setLogradouro("Rua A");
        contratante.setNumero("1");
        contratante.setBairro("Centro");
        contratante.setCidade("Osasco");
        contratante.setUf("SP");
        contratante.setLatitude(-23.5505);
        contratante.setLongitude(-46.6333);
    }

    @Test
    @DisplayName("publicacao valida cria servico no estado ABERTO com local herdado do perfil")
    void publicarServicoValido() {
        Servico dados = dados(LocalTime.of(8, 0), LocalTime.of(12, 0));
        when(contratanteRepository.findById(3L)).thenReturn(Optional.of(contratante));
        when(servicoRepository.save(any(Servico.class))).thenAnswer(i -> i.getArgument(0));

        Servico salvo = service.publicar(3L, dados, dono);

        assertEquals(StatusServico.ABERTO, salvo.getStatus());
        assertEquals("Rua A, 1 - Centro, Osasco/SP", salvo.getEndereco());
        assertEquals(-23.5505, salvo.getLatitude());
        assertEquals(-46.6333, salvo.getLongitude());
    }

    @Test
    @DisplayName("horario final igual ao inicial e recusado")
    void publicarHorarioFinalIgualAoInicial() {
        Servico dados = dados(LocalTime.of(8, 0), LocalTime.of(8, 0));
        when(contratanteRepository.findById(3L)).thenReturn(Optional.of(contratante));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.publicar(3L, dados, dono));

        assertEquals("O horário final deve ser depois do horário inicial.", erro.getMessage());
    }

    @Test
    @DisplayName("horario final um minuto antes do inicial e recusado")
    void publicarHorarioFinalAnteriorAoInicial() {
        Servico dados = dados(LocalTime.of(8, 0), LocalTime.of(7, 59));
        when(contratanteRepository.findById(3L)).thenReturn(Optional.of(contratante));

        assertThrows(RegraNegocioException.class, () -> service.publicar(3L, dados, dono));
    }

    @Test
    @DisplayName("publicacao sem localizacao no perfil e recusada")
    void publicarSemLocalizacaoNoPerfil() {
        contratante.setLatitude(null);
        Servico dados = dados(LocalTime.of(8, 0), LocalTime.of(12, 0));
        when(contratanteRepository.findById(3L)).thenReturn(Optional.of(contratante));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.publicar(3L, dados, dono));

        assertEquals("Cadastre a localização do seu perfil antes de publicar um serviço.",
                erro.getMessage());
    }

    @Test
    @DisplayName("edicao de servico em andamento e recusada")
    void editarServicoEmAndamento() {
        Servico servico = servico(5L, StatusServico.EM_ANDAMENTO);
        when(servicoRepository.findById(5L)).thenReturn(Optional.of(servico));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.atualizar(5L, dados(LocalTime.of(8, 0), LocalTime.of(12, 0)), dono));

        assertEquals("Só é possível editar serviços abertos.", erro.getMessage());
    }

    @Test
    @DisplayName("conclusao de servico aberto e recusada")
    void concluirServicoAberto() {
        Servico servico = servico(7L, StatusServico.ABERTO);
        when(servicoRepository.findById(7L)).thenReturn(Optional.of(servico));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.concluir(7L, dono));

        assertEquals("Só é possível concluir um serviço em andamento.", erro.getMessage());
    }

    @Test
    @DisplayName("cancelamento de servico concluido e recusado")
    void cancelarServicoConcluido() {
        Servico servico = servico(5L, StatusServico.CONCLUIDO);
        when(servicoRepository.findById(5L)).thenReturn(Optional.of(servico));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.cancelar(5L, dono));

        assertEquals("Não é possível cancelar um serviço já concluído.", erro.getMessage());
    }

    @Test
    @DisplayName("exclusao de servico com historico e recusada com conflito")
    void excluirServicoComHistorico() {
        Servico servico = servico(5L, StatusServico.ABERTO);
        when(servicoRepository.findById(5L)).thenReturn(Optional.of(servico));
        when(candidaturaRepository.existsByServicoId(5L)).thenReturn(true);

        ConflitoException erro = assertThrows(ConflitoException.class,
                () -> service.deletar(5L, dono));

        assertEquals("Não é possível excluir: este serviço possui histórico. Cancele-o em vez de excluir.",
                erro.getMessage());
        verify(servicoRepository, never()).delete(any());
    }

    @Test
    @DisplayName("listagem por proximidade devolve do mais proximo ao mais distante")
    void listarProximosOrdenado() {
        Servico perto = servico(1L, StatusServico.ABERTO);
        perto.setLatitude(-23.5505);
        perto.setLongitude(-46.6333);
        Servico longe = servico(2L, StatusServico.ABERTO);
        longe.setLatitude(-23.7000);
        longe.setLongitude(-46.8000);

        when(servicoRepository.findByStatus(eq(StatusServico.ABERTO), any()))
                .thenReturn(new PageImpl<>(List.of(longe, perto)));

        var pagina = service.listarProximos(-23.5505, -46.6333, 30.0, PageRequest.of(0, 10));

        assertEquals(2, pagina.getTotalElements());
        assertEquals(1L, pagina.getContent().get(0).getId());
    }

    private Servico servico(Long id, StatusServico status) {
        Servico s = new Servico();
        s.setId(id);
        s.setContratante(contratante);
        s.setTitulo("Limpeza de apartamento");
        s.setStatus(status);
        return s;
    }

    private Servico dados(LocalTime inicio, LocalTime fim) {
        Servico s = new Servico();
        s.setTitulo("Limpeza de apartamento");
        s.setDescricao("Limpeza completa");
        s.setValor(new BigDecimal("150.00"));
        s.setDataServico(LocalDate.of(2026, 11, 20));
        s.setHoraInicio(inicio);
        s.setHoraFim(fim);
        s.setPeriodo(PeriodoServico.MANHA);
        return s;
    }
}