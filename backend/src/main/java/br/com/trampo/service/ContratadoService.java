package br.com.trampo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.exception.AcessoNegadoException;
import br.com.trampo.exception.ConflitoException;
import br.com.trampo.exception.RecursoNaoEncontradoException;
import br.com.trampo.model.Contratado;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.CandidaturaRepository;
import br.com.trampo.repository.ContratadoRepository;
import br.com.trampo.repository.ServicoRepository;
import br.com.trampo.repository.UsuarioRepository;

@Service
@Transactional(readOnly = true)
public class ContratadoService {

    private final ContratadoRepository contratadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final CandidaturaRepository candidaturaRepository;
    private final ServicoRepository servicoRepository;

    public ContratadoService(ContratadoRepository contratadoRepository,
            UsuarioRepository usuarioRepository,
            CandidaturaRepository candidaturaRepository,
            ServicoRepository servicoRepository) {
        this.contratadoRepository = contratadoRepository;
        this.usuarioRepository = usuarioRepository;
        this.candidaturaRepository = candidaturaRepository;
        this.servicoRepository = servicoRepository;
    }

    @Transactional
    public Contratado cadastrar(Long usuarioId, Contratado dados, Usuario solicitante) {
        validarUsuarioAlvo(usuarioId, solicitante);

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        if (contratadoRepository.findByUsuarioId(usuarioId).isPresent()) {
            throw new ConflitoException("Este usuário já possui um perfil de contratado.");
        }

        Contratado contratado = new Contratado();
        contratado.setUsuario(usuario);
        aplicar(contratado, dados);
        return contratadoRepository.save(contratado);
    }

    public Page<Contratado> listarTodos(Pageable pageable) {
        return contratadoRepository.findAll(pageable);
    }

    public Contratado buscarPorId(Long id) {
        return buscarEntidade(id);
    }

    public Contratado buscarPorUsuario(Usuario usuario) {
        return entidadeDoUsuario(usuario.getId());
    }

    @Transactional
    public Contratado atualizar(Long id, Contratado dados, Usuario solicitante) {
        Contratado contratado = buscarEntidade(id);
        validarDono(contratado, solicitante);
        aplicar(contratado, dados);
        return contratadoRepository.save(contratado);
    }

    @Transactional
    public Contratado atualizarMe(Usuario solicitante, Contratado dados) {
        Contratado contratado = entidadeDoUsuario(solicitante.getId());
        aplicar(contratado, dados);
        return contratadoRepository.save(contratado);
    }

    @Transactional
    public void deletar(Long id, Usuario solicitante) {
        Contratado contratado = buscarEntidade(id);
        validarDono(contratado, solicitante);
        validarExclusao(id);
        contratadoRepository.delete(contratado);
    }

    @Transactional
    public void deletarMe(Usuario solicitante) {
        Contratado contratado = entidadeDoUsuario(solicitante.getId());
        validarExclusao(contratado.getId());
        contratadoRepository.delete(contratado);
    }

    private void validarExclusao(Long contratadoId) {
        if (candidaturaRepository.existsByContratadoId(contratadoId)
                || servicoRepository.existsByContratadoId(contratadoId)) {
            throw new ConflitoException("Não é possível excluir o perfil: existem candidaturas ou serviços vinculados.");
        }
    }

    private void aplicar(Contratado contratado, Contratado dados) {
        contratado.setDescricao(dados.getDescricao());
        contratado.setServicos(dados.getServicos());
        contratado.setDisponibilidade(dados.getDisponibilidade());
        contratado.setCep(dados.getCep() == null ? null : dados.getCep().replaceAll("\\D", ""));
        contratado.setLogradouro(dados.getLogradouro());
        contratado.setNumero(dados.getNumero());
        contratado.setComplemento(dados.getComplemento());
        contratado.setBairro(dados.getBairro());
        contratado.setCidade(dados.getCidade());
        contratado.setUf(dados.getUf() == null ? null : dados.getUf().toUpperCase());
        contratado.setLatitude(dados.getLatitude());
        contratado.setLongitude(dados.getLongitude());
        contratado.setRaioBuscaKm(dados.getRaioBuscaKm());
    }

    private Contratado buscarEntidade(Long id) {
        return contratadoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Contratado não encontrado."));
    }

    private Contratado entidadeDoUsuario(Long usuarioId) {
        return contratadoRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil de contratado não encontrado."));
    }

    private void validarDono(Contratado contratado, Usuario solicitante) {
        if (solicitante.getTipo() == TipoUsuario.ADMIN) {
            return;
        }
        if (contratado.getUsuario() == null || !contratado.getUsuario().getId().equals(solicitante.getId())) {
            throw new AcessoNegadoException("Você só pode alterar o seu próprio perfil de contratado.");
        }
    }

    private void validarUsuarioAlvo(Long usuarioId, Usuario solicitante) {
        if (solicitante.getTipo() == TipoUsuario.ADMIN) {
            return;
        }
        if (!usuarioId.equals(solicitante.getId())) {
            throw new AcessoNegadoException("Você só pode criar um perfil para o seu próprio usuário.");
        }
    }
}