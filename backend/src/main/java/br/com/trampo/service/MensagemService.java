
package br.com.trampo.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.exception.AcessoNegadoException;
import br.com.trampo.exception.RecursoNaoEncontradoException;
import br.com.trampo.exception.RegraNegocioException;
import br.com.trampo.model.Mensagem;
import br.com.trampo.model.Servico;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.StatusServico;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.MensagemRepository;
import br.com.trampo.repository.ServicoRepository;
import br.com.trampo.repository.UsuarioRepository;

@Service
@Transactional(readOnly = true)
public class MensagemService {

    private final MensagemRepository mensagemRepository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;

    public MensagemService(MensagemRepository mensagemRepository,
            ServicoRepository servicoRepository,
            UsuarioRepository usuarioRepository) {
        this.mensagemRepository = mensagemRepository;
        this.servicoRepository = servicoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public Mensagem enviar(Long servicoId, Long remetenteId, Mensagem dados, Usuario solicitante) {
        validarRemetente(remetenteId, solicitante);

        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado."));

        Usuario remetente = usuarioRepository.findById(remetenteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        validarParticipante(servico, remetente);

        if (servico.getStatus() == StatusServico.CONCLUIDO) {
            throw new RegraNegocioException(
                    "A conversa foi encerrada porque o serviço já foi concluído. Consulte o histórico e as avaliações.");
        }

        if (servico.getStatus() == StatusServico.CANCELADO) {
            throw new RegraNegocioException(
                    "A conversa foi encerrada porque o serviço foi cancelado.");
        }

        Mensagem mensagem = new Mensagem();
        mensagem.setServico(servico);
        mensagem.setRemetente(remetente);
        mensagem.setConteudo(dados.getConteudo());
        mensagem.setLida(false);
        return mensagemRepository.save(mensagem);
    }

    @Transactional
    public Page<Mensagem> listarPorServico(Long servicoId, Usuario solicitante, Pageable pageable) {
        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado."));

        validarParticipante(servico, solicitante);

        Page<Mensagem> pagina = mensagemRepository.findByServicoIdOrderByDataEnvioAsc(servicoId, pageable);

        List<Mensagem> recebidas = mensagemRepository
                .findByServicoIdAndRemetenteIdNotAndLidaFalse(servicoId, solicitante.getId());

        if (!recebidas.isEmpty()) {
            for (Mensagem mensagem : recebidas) {
                mensagem.setLida(true);
            }
            mensagemRepository.saveAll(recebidas);
        }

        return pagina;
    }

    private void validarRemetente(Long remetenteId, Usuario solicitante) {
        if (solicitante.getTipo() == TipoUsuario.ADMIN) {
            return;
        }
        if (!remetenteId.equals(solicitante.getId())) {
            throw new AcessoNegadoException("Você só pode enviar mensagens em seu próprio nome.");
        }
    }

    private void validarParticipante(Servico servico, Usuario usuario) {
        if (usuario.getTipo() == TipoUsuario.ADMIN) {
            return;
        }

        Long idContratante = servico.getContratante() != null && servico.getContratante().getUsuario() != null
                ? servico.getContratante().getUsuario().getId()
                : null;

        Long idContratado = servico.getContratado() != null && servico.getContratado().getUsuario() != null
                ? servico.getContratado().getUsuario().getId()
                : null;

        if (!usuario.getId().equals(idContratante) && !usuario.getId().equals(idContratado)) {
            throw new AcessoNegadoException("Você não participa deste serviço.");
        }
    }
}
