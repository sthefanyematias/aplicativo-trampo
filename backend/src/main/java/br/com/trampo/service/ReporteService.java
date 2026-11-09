package br.com.trampo.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.dto.ReporteRequest;
import br.com.trampo.dto.ReporteResolucaoRequest;
import br.com.trampo.exception.AcessoNegadoException;
import br.com.trampo.exception.RecursoNaoEncontradoException;
import br.com.trampo.model.Reporte;
import br.com.trampo.model.Servico;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.StatusReporte;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.ReporteRepository;
import br.com.trampo.repository.ServicoRepository;

@Service
@Transactional(readOnly = true)
public class ReporteService {

    private final ReporteRepository reporteRepository;
    private final ServicoRepository servicoRepository;
    private final NotificacaoService notificacaoService;

    public ReporteService(ReporteRepository reporteRepository,
            ServicoRepository servicoRepository,
            NotificacaoService notificacaoService) {
        this.reporteRepository = reporteRepository;
        this.servicoRepository = servicoRepository;
        this.notificacaoService = notificacaoService;
    }

    @Transactional
    public Reporte criar(ReporteRequest dados, Usuario solicitante) {
        Servico servico = null;

        if (dados.getServicoId() != null) {
            servico = servicoRepository.findById(dados.getServicoId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado."));

            Long idContratante = servico.getContratante() != null && servico.getContratante().getUsuario() != null
                    ? servico.getContratante().getUsuario().getId()
                    : null;
            Long idContratado = servico.getContratado() != null && servico.getContratado().getUsuario() != null
                    ? servico.getContratado().getUsuario().getId()
                    : null;

            boolean participa = solicitante.getId().equals(idContratante)
                    || solicitante.getId().equals(idContratado)
                    || solicitante.getTipo() == TipoUsuario.ADMIN;

            if (!participa) {
                throw new AcessoNegadoException("Você não participa deste serviço.");
            }
        }

        Reporte reporte = new Reporte();
        reporte.setUsuario(solicitante);
        reporte.setServico(servico);
        reporte.setAssunto(dados.getAssunto().trim());
        reporte.setDescricao(dados.getDescricao().trim());
        reporte.setStatus(StatusReporte.ABERTO);
        return reporteRepository.save(reporte);
    }

    public List<Reporte> listarMeus(Usuario solicitante) {
        return reporteRepository.findByUsuarioIdOrderByCriadoEmDesc(solicitante.getId());
    }

    public List<Reporte> listarTodos(Usuario solicitante) {
        validarAdmin(solicitante);
        return reporteRepository.findAllByOrderByCriadoEmDesc();
    }

    public long contarAbertos() {
        return reporteRepository.countByStatus(StatusReporte.ABERTO)
                + reporteRepository.countByStatus(StatusReporte.EM_ANALISE);
    }

    @Transactional
    public Reporte resolver(Long id, ReporteResolucaoRequest dados, Usuario solicitante) {
        validarAdmin(solicitante);

        Reporte reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Solicitação não encontrada."));

        if (reporte.getStatus() == StatusReporte.RESOLVIDO) {
            return reporte;
        }

        String resposta = dados != null && dados.getResposta() != null && !dados.getResposta().isBlank()
                ? dados.getResposta().trim()
                : "Sua solicitação foi analisada e resolvida pela equipe de suporte.";

        reporte.setStatus(StatusReporte.RESOLVIDO);
        reporte.setResposta(resposta);
        reporte.setResolvidoEm(LocalDateTime.now());
        Reporte salvo = reporteRepository.save(reporte);

        notificacaoService.criar(
                reporte.getUsuario(),
                "Suporte respondeu sua solicitação",
                resposta,
                "SUPORTE",
                reporte.getServico() != null ? reporte.getServico().getId() : null);

        return salvo;
    }

    @Transactional
    public Reporte iniciarAnalise(Long id, Usuario solicitante) {
        validarAdmin(solicitante);

        Reporte reporte = reporteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Solicitação não encontrada."));

        if (reporte.getStatus() == StatusReporte.ABERTO) {
            reporte.setStatus(StatusReporte.EM_ANALISE);
            return reporteRepository.save(reporte);
        }

        return reporte;
    }

    private void validarAdmin(Usuario solicitante) {
        if (solicitante.getTipo() != TipoUsuario.ADMIN) {
            throw new AcessoNegadoException("Esta área é exclusiva da administração.");
        }
    }
}
