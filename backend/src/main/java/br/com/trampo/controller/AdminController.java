
package br.com.trampo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.trampo.dto.AdminResumoResponse;
import br.com.trampo.model.enums.StatusCandidatura;
import br.com.trampo.model.enums.StatusServico;
import br.com.trampo.repository.AvaliacaoRepository;
import br.com.trampo.repository.CandidaturaRepository;
import br.com.trampo.repository.ContratadoRepository;
import br.com.trampo.repository.ContratanteRepository;
import br.com.trampo.repository.ReporteRepository;
import br.com.trampo.repository.ServicoRepository;
import br.com.trampo.repository.UsuarioRepository;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UsuarioRepository usuarioRepository;
    private final ContratadoRepository contratadoRepository;
    private final ContratanteRepository contratanteRepository;
    private final ServicoRepository servicoRepository;
    private final CandidaturaRepository candidaturaRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final ReporteRepository reporteRepository;

    public AdminController(UsuarioRepository usuarioRepository,
            ContratadoRepository contratadoRepository,
            ContratanteRepository contratanteRepository,
            ServicoRepository servicoRepository,
            CandidaturaRepository candidaturaRepository,
            AvaliacaoRepository avaliacaoRepository,
            ReporteRepository reporteRepository) {
        this.usuarioRepository = usuarioRepository;
        this.contratadoRepository = contratadoRepository;
        this.contratanteRepository = contratanteRepository;
        this.servicoRepository = servicoRepository;
        this.candidaturaRepository = candidaturaRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.reporteRepository = reporteRepository;
    }

    @GetMapping("/resumo")
    public ResponseEntity<AdminResumoResponse> resumo() {
        AdminResumoResponse resposta = new AdminResumoResponse();
        resposta.setUsuarios(usuarioRepository.count());
        resposta.setContratados(contratadoRepository.count());
        resposta.setContratantes(contratanteRepository.count());
        resposta.setServicosAbertos(servicoRepository.countByStatus(StatusServico.ABERTO));
        resposta.setServicosEmAndamento(servicoRepository.countByStatus(StatusServico.EM_ANDAMENTO));
        resposta.setServicosConcluidos(servicoRepository.countByStatus(StatusServico.CONCLUIDO));
        resposta.setServicosCancelados(servicoRepository.countByStatus(StatusServico.CANCELADO));
        resposta.setCandidaturasPendentes(
                candidaturaRepository.countByStatus(StatusCandidatura.PENDENTE));
        resposta.setAvaliacoes(avaliacaoRepository.count());
        resposta.setReportesAbertos(reporteRepository.countByStatus(
                br.com.trampo.model.enums.StatusReporte.ABERTO)
                + reporteRepository.countByStatus(br.com.trampo.model.enums.StatusReporte.EM_ANALISE));
        return ResponseEntity.ok(resposta);
    }
}
