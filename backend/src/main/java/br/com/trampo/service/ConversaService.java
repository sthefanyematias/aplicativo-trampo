package br.com.trampo.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.dto.ConversaResponse;
import br.com.trampo.model.Contratado;
import br.com.trampo.model.Mensagem;
import br.com.trampo.model.Servico;
import br.com.trampo.model.Usuario;
import br.com.trampo.repository.MensagemRepository;
import br.com.trampo.repository.ServicoRepository;

@Service
@Transactional(readOnly = true)
public class ConversaService {

    private final ServicoRepository servicoRepository;
    private final MensagemRepository mensagemRepository;

    public ConversaService(ServicoRepository servicoRepository, MensagemRepository mensagemRepository) {
        this.servicoRepository = servicoRepository;
        this.mensagemRepository = mensagemRepository;
    }

    public List<ConversaResponse> listarMinhas(Usuario solicitante) {
        List<ConversaResponse> conversas = new ArrayList<>();

        List<Servico> comoContratante = servicoRepository
                .findByContratante_Usuario_IdOrderByCriadoEmDesc(solicitante.getId());

        List<Servico> comoContratado = servicoRepository
                .findByContratado_Usuario_IdOrderByCriadoEmDesc(solicitante.getId());

        for (Servico servico : comoContratante) {
            adicionar(conversas, servico, nomeDoContratado(servico), solicitante);
        }

        for (Servico servico : comoContratado) {
            adicionar(conversas, servico, nomeDoContratante(servico), solicitante);
        }

        conversas.sort((a, b) -> {
            if (a.getDataUltima() == null && b.getDataUltima() == null) return 0;
            if (a.getDataUltima() == null) return 1;
            if (b.getDataUltima() == null) return -1;
            return b.getDataUltima().compareTo(a.getDataUltima());
        });

        return conversas;
    }

    private void adicionar(List<ConversaResponse> conversas, Servico servico, String outroNome,
            Usuario solicitante) {
        Mensagem ultima = mensagemRepository.findFirstByServicoIdOrderByDataEnvioDesc(servico.getId());

        if (ultima == null) {
            return;
        }

        ConversaResponse conversa = new ConversaResponse();
        conversa.setServicoId(servico.getId());
        conversa.setTitulo(servico.getTitulo());
        conversa.setStatus(servico.getStatus());
        conversa.setOutroNome(outroNome);
        conversa.setUltimaMensagem(ultima.getConteudo());
        conversa.setDataUltima(ultima.getDataEnvio());
        conversa.setTotalMensagens(mensagemRepository.countByServicoId(servico.getId()));
        conversa.setNaoLidas(mensagemRepository
                .countByServicoIdAndRemetenteIdNotAndLidaFalse(servico.getId(), solicitante.getId()));

        conversas.add(conversa);
    }

    private String nomeDoContratado(Servico servico) {
        Contratado contratado = servico.getContratado();

        if (contratado == null || contratado.getUsuario() == null) {
            return "Trabalhador";
        }

        return nomeCompleto(contratado.getUsuario());
    }

    private String nomeDoContratante(Servico servico) {
        if (servico.getContratante() == null || servico.getContratante().getUsuario() == null) {
            return "Contratante";
        }

        return nomeCompleto(servico.getContratante().getUsuario());
    }

    private String nomeCompleto(Usuario usuario) {
        String nome = usuario.getNome() == null ? "" : usuario.getNome();
        String sobrenome = usuario.getSobrenome() == null ? "" : usuario.getSobrenome();
        String completo = (nome + " " + sobrenome).trim();
        return completo.isEmpty() ? "Participante" : completo;
    }
}