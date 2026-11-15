package br.com.trampo.config;

import java.time.LocalDate;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.model.Servico;
import br.com.trampo.model.enums.StatusServico;
import br.com.trampo.repository.AvaliacaoRepository;
import br.com.trampo.repository.CandidaturaRepository;
import br.com.trampo.repository.MensagemRepository;
import br.com.trampo.repository.ServicoRepository;
import br.com.trampo.service.NotificacaoService;

@Component
public class LimpezaServicosAgendada {

    private final ServicoRepository servicoRepository;
    private final CandidaturaRepository candidaturaRepository;
    private final MensagemRepository mensagemRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final NotificacaoService notificacaoService;

    public LimpezaServicosAgendada(ServicoRepository servicoRepository,
            CandidaturaRepository candidaturaRepository,
            MensagemRepository mensagemRepository,
            AvaliacaoRepository avaliacaoRepository,
            NotificacaoService notificacaoService) {
        this.servicoRepository = servicoRepository;
        this.candidaturaRepository = candidaturaRepository;
        this.mensagemRepository = mensagemRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.notificacaoService = notificacaoService;
    }

    @Scheduled(initialDelay = 10000, fixedDelay = 3600000)
    @Transactional
    public void removerVagasVencidas() {
        LocalDate hoje = LocalDate.now();

        for (Servico servico : servicoRepository.findByDataServicoBefore(hoje)) {
            if (servico.getStatus() == StatusServico.EM_ANDAMENTO
                    || servico.getStatus() == StatusServico.CONCLUIDO) {
                continue;
            }

            boolean temHistorico = mensagemRepository.existsByServicoId(servico.getId())
                    || avaliacaoRepository.existsByServicoId(servico.getId());

            if (temHistorico) {
                if (servico.getStatus() == StatusServico.ABERTO) {
                    servico.setStatus(StatusServico.CANCELADO);
                    servicoRepository.save(servico);

                    if (servico.getContratante() != null
                            && servico.getContratante().getUsuario() != null) {
                        notificacaoService.criar(
                                servico.getContratante().getUsuario(),
                                "Vaga expirada",
                                "A vaga \"" + servico.getTitulo()
                                        + "\" passou da data e foi encerrada automaticamente.",
                                "SERVICO",
                                servico.getId());
                    }
                }
                continue;
            }

            candidaturaRepository.deleteAll(
                    candidaturaRepository.findByServicoIdOrderByDataAsc(servico.getId()));
            servicoRepository.delete(servico);
        }
    }
}
