package br.com.trampo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.exception.AcessoNegadoException;
import br.com.trampo.exception.RecursoNaoEncontradoException;
import br.com.trampo.model.Notificacao;
import br.com.trampo.model.Usuario;
import br.com.trampo.repository.NotificacaoRepository;

@Service
@Transactional(readOnly = true)
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;

    public NotificacaoService(NotificacaoRepository notificacaoRepository) {
        this.notificacaoRepository = notificacaoRepository;
    }

    @Transactional
    public void criar(Usuario usuario, String titulo, String mensagem, String tipo, Long servicoId) {
        if (usuario == null || usuario.getId() == null) {
            return;
        }

        Notificacao notificacao = new Notificacao();
        notificacao.setUsuario(usuario);
        notificacao.setTitulo(titulo);
        notificacao.setMensagem(mensagem);
        notificacao.setTipo(tipo == null ? "INFO" : tipo);
        notificacao.setServicoId(servicoId);
        notificacao.setLida(false);
        notificacaoRepository.save(notificacao);
    }

    public List<Notificacao> listarMinhas(Usuario solicitante) {
        return notificacaoRepository.findByUsuarioIdOrderByCriadoEmDesc(solicitante.getId());
    }

    public long contarNaoLidas(Usuario solicitante) {
        return notificacaoRepository.countByUsuarioIdAndLidaFalse(solicitante.getId());
    }

    @Transactional
    public Notificacao marcarLida(Long id, Usuario solicitante) {
        Notificacao notificacao = notificacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Notificação não encontrada."));

        if (!notificacao.getUsuario().getId().equals(solicitante.getId())) {
            throw new AcessoNegadoException("Esta notificação não pertence a você.");
        }

        notificacao.setLida(true);
        return notificacaoRepository.save(notificacao);
    }

    @Transactional
    public void marcarTodasLidas(Usuario solicitante) {
        List<Notificacao> minhas = notificacaoRepository.findByUsuarioIdOrderByCriadoEmDesc(solicitante.getId());
        for (Notificacao notificacao : minhas) {
            notificacao.setLida(true);
        }
        notificacaoRepository.saveAll(minhas);
    }
}
