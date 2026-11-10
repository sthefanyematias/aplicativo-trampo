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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import br.com.trampo.exception.AcessoNegadoException;
import br.com.trampo.exception.ConflitoException;
import br.com.trampo.exception.RegraNegocioException;
import br.com.trampo.model.Candidatura;
import br.com.trampo.model.Contratado;
import br.com.trampo.model.Contratante;
import br.com.trampo.model.Servico;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.StatusCandidatura;
import br.com.trampo.model.enums.StatusServico;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.CandidaturaRepository;
import br.com.trampo.repository.ContratadoRepository;
import br.com.trampo.repository.ServicoRepository;
import br.com.trampo.service.CandidaturaService;

@ExtendWith(MockitoExtension.class)
class CandidaturaServiceTest {

    @Mock private CandidaturaRepository candidaturaRepository;
    @Mock private ServicoRepository servicoRepository;
    @Mock private ContratadoRepository contratadoRepository;
    @InjectMocks private CandidaturaService service;

    private Usuario dono;
    private Usuario usuarioContratado;
    private Usuario outroContratante;

    @BeforeEach
    void preparar() {
        dono = usuario(7L, TipoUsuario.CONTRATANTE);
        usuarioContratado = usuario(8L, TipoUsuario.CONTRATADO);
        outroContratante = usuario(10L, TipoUsuario.CONTRATANTE);
    }

    @Test
    @DisplayName("candidatura em servico aberto e gravada como PENDENTE")
    void candidatarServicoAberto() {
        Servico servico = servico(5L, contratante(3L, dono), StatusServico.ABERTO);
        Contratado contratado = contratado(4L, usuarioContratado);

        when(servicoRepository.findById(5L)).thenReturn(Optional.of(servico));
        when(contratadoRepository.findById(4L)).thenReturn(Optional.of(contratado));
        when(candidaturaRepository.existsByServicoIdAndContratadoId(5L, 4L)).thenReturn(false);
        when(candidaturaRepository.save(any(Candidatura.class))).thenAnswer(i -> i.getArgument(0));

        Candidatura resultado = service.candidatar(5L, 4L, usuarioContratado);

        assertEquals(StatusCandidatura.PENDENTE, resultado.getStatus());
        assertEquals(servico, resultado.getServico());
        assertEquals(contratado, resultado.getContratado());
    }

    @Test
    @DisplayName("candidatura em servico que nao esta aberto e recusada")
    void candidatarServicoFechado() {
        Servico servico = servico(5L, contratante(3L, dono), StatusServico.EM_ANDAMENTO);
        when(servicoRepository.findById(5L)).thenReturn(Optional.of(servico));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.candidatar(5L, 4L, usuarioContratado));

        assertEquals("Este serviço não está aberto para candidaturas.", erro.getMessage());
        verify(candidaturaRepository, never()).save(any());
    }

    @Test
    @DisplayName("segunda candidatura do mesmo contratado e recusada")
    void candidatarDuplicada() {
        Servico servico = servico(5L, contratante(3L, dono), StatusServico.ABERTO);
        Contratado contratado = contratado(4L, usuarioContratado);

        when(servicoRepository.findById(5L)).thenReturn(Optional.of(servico));
        when(contratadoRepository.findById(4L)).thenReturn(Optional.of(contratado));
        when(candidaturaRepository.existsByServicoIdAndContratadoId(5L, 4L)).thenReturn(true);

        ConflitoException erro = assertThrows(ConflitoException.class,
                () -> service.candidatar(5L, 4L, usuarioContratado));

        assertEquals("Você já se candidatou a este serviço.", erro.getMessage());
    }

    @Test
    @DisplayName("aceite vincula o contratado e muda o servico para EM_ANDAMENTO")
    void aceitarCandidaturaPendente() {
        Contratante cont = contratante(3L, dono);
        Contratado cond = contratado(4L, usuarioContratado);
        Servico servico = servico(5L, cont, StatusServico.ABERTO);
        Candidatura candidatura = candidatura(4L, servico, cond, StatusCandidatura.PENDENTE);

        when(candidaturaRepository.findById(4L)).thenReturn(Optional.of(candidatura));
        when(candidaturaRepository.findByServicoIdOrderByDataAsc(5L)).thenReturn(List.of());
        when(candidaturaRepository.save(any(Candidatura.class))).thenAnswer(i -> i.getArgument(0));
        when(servicoRepository.save(any(Servico.class))).thenAnswer(i -> i.getArgument(0));

        Candidatura resultado = service.aceitar(4L, dono);

        assertEquals(StatusCandidatura.ACEITA, resultado.getStatus());
        assertEquals(StatusServico.EM_ANDAMENTO, servico.getStatus());
        assertEquals(cond, servico.getContratado());
    }

    @Test
    @DisplayName("aceite de candidatura ja processada e recusado")
    void aceitarCandidaturaProcessada() {
        Servico servico = servico(5L, contratante(3L, dono), StatusServico.ABERTO);
        Candidatura candidatura = candidatura(4L, servico, contratado(4L, usuarioContratado),
                StatusCandidatura.ACEITA);
        when(candidaturaRepository.findById(4L)).thenReturn(Optional.of(candidatura));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class,
                () -> service.aceitar(4L, dono));

        assertEquals("Esta candidatura já foi processada.", erro.getMessage());
    }

    @Test
    @DisplayName("aceite por contratante que nao e o responsavel e recusado com acesso negado")
    void aceitarPorOutroContratante() {
        Servico servico = servico(5L, contratante(3L, dono), StatusServico.ABERTO);
        Candidatura candidatura = candidatura(4L, servico, contratado(4L, usuarioContratado),
                StatusCandidatura.PENDENTE);
        when(candidaturaRepository.findById(4L)).thenReturn(Optional.of(candidatura));

        AcessoNegadoException erro = assertThrows(AcessoNegadoException.class,
                () -> service.aceitar(4L, outroContratante));

        assertEquals("Você não é o contratante responsável por este serviço.", erro.getMessage());
    }

    private Usuario usuario(Long id, TipoUsuario tipo) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setNome("Usuario");
        u.setSobrenome("Teste");
        u.setEmail("usuario" + id + "@trampo.test");
        u.setTipo(tipo);
        u.setAtivo(true);
        return u;
    }

    private Contratante contratante(Long id, Usuario usuario) {
        Contratante c = new Contratante();
        c.setId(id);
        c.setUsuario(usuario);
        c.setTipoPessoa("PF");
        c.setCpfCnpj("52998224725");
        c.setCep("06110000");
        c.setLogradouro("Rua A");
        c.setNumero("1");
        c.setBairro("Centro");
        c.setCidade("Osasco");
        c.setUf("SP");
        c.setLatitude(-23.5325);
        c.setLongitude(-46.7917);
        return c;
    }

    private Contratado contratado(Long id, Usuario usuario) {
        Contratado c = new Contratado();
        c.setId(id);
        c.setUsuario(usuario);
        c.setDescricao("Profissional de limpeza");
        c.setServicos("Diarista, limpeza");
        c.setDisponibilidade("Segunda a sexta");
        c.setCep("06110000");
        c.setLogradouro("Rua B");
        c.setNumero("2");
        c.setBairro("Centro");
        c.setCidade("Osasco");
        c.setUf("SP");
        c.setLatitude(-23.5325);
        c.setLongitude(-46.7917);
        c.setRaioBuscaKm(10.0);
        return c;
    }

    private Servico servico(Long id, Contratante contratante, StatusServico status) {
        Servico s = new Servico();
        s.setId(id);
        s.setContratante(contratante);
        s.setTitulo("Limpeza de apartamento");
        s.setStatus(status);
        s.setLatitude(-23.5505);
        s.setLongitude(-46.6333);
        return s;
    }

    private Candidatura candidatura(Long id, Servico servico, Contratado contratado, StatusCandidatura status) {
        Candidatura c = new Candidatura();
        c.setId(id);
        c.setServico(servico);
        c.setContratado(contratado);
        c.setStatus(status);
        return c;
    }
}