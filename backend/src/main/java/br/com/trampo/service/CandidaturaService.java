package br.com.trampo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.exception.AcessoNegadoException;
import br.com.trampo.exception.ConflitoException;
import br.com.trampo.exception.RecursoNaoEncontradoException;
import br.com.trampo.exception.RegraNegocioException;
import br.com.trampo.model.Candidatura;
import br.com.trampo.model.Contratado;
import br.com.trampo.model.Servico;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.StatusCandidatura;
import br.com.trampo.model.enums.StatusServico;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.CandidaturaRepository;
import br.com.trampo.repository.ContratadoRepository;
import br.com.trampo.repository.ServicoRepository;

@Service
@Transactional(readOnly = true)
public class CandidaturaService {

    private final CandidaturaRepository candidaturaRepository;
    private final ServicoRepository servicoRepository;
    private final ContratadoRepository contratadoRepository;

    public CandidaturaService(CandidaturaRepository candidaturaRepository,
            ServicoRepository servicoRepository,
            ContratadoRepository contratadoRepository) {
        this.candidaturaRepository = candidaturaRepository;
        this.servicoRepository = servicoRepository;
        this.contratadoRepository = contratadoRepository;
    }

    @Transactional
    public Candidatura candidatar(Long servicoId, Long contratadoId, Usuario solicitante) {
        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado."));

        if (servico.getStatus() != StatusServico.ABERTO) {
            throw new RegraNegocioException("Este serviço não está aberto para candidaturas.");
        }

        Contratado contratado = contratadoRepository.findById(contratadoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Contratado não encontrado."));

        validarDonoContratado(contratado, solicitante);

        if (candidaturaRepository.existsByServicoIdAndContratadoId(servicoId, contratadoId)) {
            throw new ConflitoException("Você já se candidatou a este serviço.");
        }

        Candidatura candidatura = new Candidatura();
        candidatura.setServico(servico);
        candidatura.setContratado(contratado);
        candidatura.setStatus(StatusCandidatura.PENDENTE);
        return candidaturaRepository.save(candidatura);
    }

    @Transactional
    public Candidatura aceitar(Long candidaturaId, Usuario solicitante) {
        Candidatura candidatura = candidaturaRepository.findById(candidaturaId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Candidatura não encontrada."));

        Servico servico = candidatura.getServico();
        validarDonoContratante(servico, solicitante);

        if (candidatura.getStatus() != StatusCandidatura.PENDENTE) {
            throw new RegraNegocioException("Esta candidatura já foi processada.");
        }

        if (servico.getStatus() != StatusServico.ABERTO) {
            throw new RegraNegocioException("Este serviço não está mais aberto.");
        }

        candidatura.setStatus(StatusCandidatura.ACEITA);
        servico.setContratado(candidatura.getContratado());
        servico.setStatus(StatusServico.EM_ANDAMENTO);
        servicoRepository.save(servico);

        for (Candidatura outra : candidaturaRepository.findByServicoIdOrderByDataAsc(servico.getId())) {
            if (!outra.getId().equals(candidatura.getId())) {
                outra.setStatus(StatusCandidatura.RECUSADA);
                candidaturaRepository.save(outra);
            }
        }

        return candidaturaRepository.save(candidatura);
    }

    public Page<Candidatura> listarPorServico(Long servicoId, Usuario solicitante, Pageable pageable) {
        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado."));
        validarDonoContratante(servico, solicitante);
        return candidaturaRepository.findByServicoId(servicoId, pageable);
    }

    public Page<Candidatura> listarPorContratado(Long contratadoId, Usuario solicitante, Pageable pageable) {
        Contratado contratado = contratadoRepository.findById(contratadoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Contratado não encontrado."));
        validarDonoContratado(contratado, solicitante);
        return candidaturaRepository.findByContratadoId(contratadoId, pageable);
    }

    public Page<Candidatura> listarPendentesDoContratante(Usuario solicitante, Pageable pageable) {
        return candidaturaRepository.findByServico_Contratante_Usuario_IdAndStatus(
                solicitante.getId(), StatusCandidatura.PENDENTE, pageable);
    }

    public long contarPendentesDoContratante(Usuario solicitante) {
        return candidaturaRepository.countByServico_Contratante_Usuario_IdAndStatus(
                solicitante.getId(), StatusCandidatura.PENDENTE);
    }

    private void validarDonoContratado(Contratado contratado, Usuario solicitante) {
        if (solicitante.getTipo() == TipoUsuario.ADMIN) {
            return;
        }
        if (contratado.getUsuario() == null || !contratado.getUsuario().getId().equals(solicitante.getId())) {
            throw new AcessoNegadoException("Você só pode agir em nome do seu próprio perfil de contratado.");
        }
    }

    private void validarDonoContratante(Servico servico, Usuario solicitante) {
        if (solicitante.getTipo() == TipoUsuario.ADMIN) {
            return;
        }
        if (servico.getContratante() == null || servico.getContratante().getUsuario() == null
                || !servico.getContratante().getUsuario().getId().equals(solicitante.getId())) {
            throw new AcessoNegadoException("Você não é o contratante responsável por este serviço.");
        }
    }
}