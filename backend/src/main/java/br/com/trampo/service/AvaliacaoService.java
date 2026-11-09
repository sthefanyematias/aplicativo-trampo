package br.com.trampo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.exception.AcessoNegadoException;
import br.com.trampo.exception.ConflitoException;
import br.com.trampo.exception.RecursoNaoEncontradoException;
import br.com.trampo.exception.RegraNegocioException;
import br.com.trampo.model.Avaliacao;
import br.com.trampo.model.Contratado;
import br.com.trampo.model.Servico;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.StatusServico;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.AvaliacaoRepository;
import br.com.trampo.repository.ContratadoRepository;
import br.com.trampo.repository.ServicoRepository;
import br.com.trampo.repository.UsuarioRepository;

@Service
@Transactional(readOnly = true)
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacaoRepository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ContratadoRepository contratadoRepository;
    private final NotificacaoService notificacaoService;

    public AvaliacaoService(AvaliacaoRepository avaliacaoRepository,
            ServicoRepository servicoRepository,
            UsuarioRepository usuarioRepository,
            ContratadoRepository contratadoRepository,
            NotificacaoService notificacaoService) {
        this.avaliacaoRepository = avaliacaoRepository;
        this.servicoRepository = servicoRepository;
        this.usuarioRepository = usuarioRepository;
        this.contratadoRepository = contratadoRepository;
        this.notificacaoService = notificacaoService;
    }

    @Transactional
    public Avaliacao avaliar(Long servicoId, Long avaliadorId, Long avaliadoId, Avaliacao dados,
            Usuario solicitante) {
        validarAvaliador(avaliadorId, solicitante);

        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado."));

        if (servico.getStatus() != StatusServico.CONCLUIDO) {
            throw new RegraNegocioException("Só é possível avaliar serviços concluídos.");
        }
        if (servico.getContratado() == null) {
            throw new RegraNegocioException("Este serviço não possui um contratado.");
        }

        Usuario avaliador = usuarioRepository.findById(avaliadorId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Avaliador não encontrado."));
        Usuario avaliado = usuarioRepository.findById(avaliadoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Avaliado não encontrado."));

        Long idContratante = servico.getContratante().getUsuario().getId();
        Long idContratado = servico.getContratado().getUsuario().getId();

        if (avaliador.getId().equals(avaliado.getId())) {
            throw new RegraNegocioException("Não é possível avaliar a si mesmo.");
        }
        if (!avaliador.getId().equals(idContratante) && !avaliador.getId().equals(idContratado)) {
            throw new AcessoNegadoException("O avaliador não participou deste serviço.");
        }
        if (!avaliado.getId().equals(idContratante) && !avaliado.getId().equals(idContratado)) {
            throw new RegraNegocioException("O avaliado não participou deste serviço.");
        }
        if (avaliacaoRepository.existsByServicoIdAndAvaliadorId(servicoId, avaliadorId)) {
            throw new ConflitoException("Esta avaliação já foi enviada e não pode ser alterada.");
        }

        Avaliacao avaliacao = new Avaliacao();
        avaliacao.setServico(servico);
        avaliacao.setAvaliador(avaliador);
        avaliacao.setAvaliado(avaliado);
        avaliacao.setNota(dados.getNota());
        avaliacao.setComentario(dados.getComentario());
        Avaliacao salva = avaliacaoRepository.save(avaliacao);

        recalcularMedia(avaliadoId);

        String nomeAvaliador = nomeCompleto(avaliador);
        String nomeAvaliado = nomeCompleto(avaliado);

        notificacaoService.criar(
                avaliado,
                "Você recebeu uma nova avaliação",
                nomeAvaliador + " avaliou você com nota " + salva.getNota() + "/5 no serviço \""
                        + servico.getTitulo() + "\".",
                "AVALIACAO",
                servicoId);

        notificacaoService.criar(
                avaliador,
                "Sua avaliação foi registrada",
                "Sua avaliação de " + nomeAvaliado + " no serviço \"" + servico.getTitulo()
                        + "\" foi registrada com nota " + salva.getNota() + "/5.",
                "AVALIACAO",
                servicoId);

        return salva;
    }

    public Page<Avaliacao> listarPorAvaliado(Long avaliadoId, Pageable pageable) {
        return avaliacaoRepository.findByAvaliadoId(avaliadoId, pageable);
    }

    public Avaliacao buscarMinha(Long servicoId, Usuario solicitante) {
        return avaliacaoRepository.findByServicoIdAndAvaliadorId(servicoId, solicitante.getId()).orElse(null);
    }

    public boolean jaAvaliei(Long servicoId, Usuario solicitante) {
        return avaliacaoRepository.existsByServicoIdAndAvaliadorId(servicoId, solicitante.getId());
    }

    public long contarAvaliacoesRecebidas(Long servicoId, Usuario solicitante) {
        return avaliacaoRepository.countByServicoIdAndAvaliadorIdNot(servicoId, solicitante.getId());
    }

    private void validarAvaliador(Long avaliadorId, Usuario solicitante) {
        if (solicitante.getTipo() == TipoUsuario.ADMIN) {
            return;
        }
        if (!avaliadorId.equals(solicitante.getId())) {
            throw new AcessoNegadoException("Você só pode avaliar em seu próprio nome.");
        }
    }

    private String nomeCompleto(Usuario usuario) {
        String nome = usuario.getNome() == null ? "" : usuario.getNome();
        String sobrenome = usuario.getSobrenome() == null ? "" : usuario.getSobrenome();
        String completo = (nome + " " + sobrenome).trim();
        return completo.isEmpty() ? "Participante" : completo;
    }

    private void recalcularMedia(Long usuarioId) {
        Contratado contratado = contratadoRepository.findByUsuarioId(usuarioId).orElse(null);
        if (contratado == null) {
            return;
        }
        var avaliacoes = avaliacaoRepository.findByAvaliadoId(usuarioId, Pageable.unpaged()).getContent();
        double soma = 0.0;
        for (Avaliacao avaliacao : avaliacoes) {
            soma += avaliacao.getNota();
        }
        double media = avaliacoes.isEmpty() ? 0.0 : soma / avaliacoes.size();
        contratado.setMediaAvaliacao(media);
        contratadoRepository.save(contratado);
    }
}
