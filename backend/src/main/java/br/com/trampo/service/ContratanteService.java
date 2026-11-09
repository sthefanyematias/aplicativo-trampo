package br.com.trampo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.exception.AcessoNegadoException;
import br.com.trampo.exception.ConflitoException;
import br.com.trampo.exception.RecursoNaoEncontradoException;
import br.com.trampo.model.Contratante;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.ContratanteRepository;
import br.com.trampo.repository.ServicoRepository;
import br.com.trampo.repository.UsuarioRepository;

@Service
@Transactional(readOnly = true)
public class ContratanteService {

    private final ContratanteRepository contratanteRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicoRepository servicoRepository;

    public ContratanteService(ContratanteRepository contratanteRepository,
            UsuarioRepository usuarioRepository,
            ServicoRepository servicoRepository) {
        this.contratanteRepository = contratanteRepository;
        this.usuarioRepository = usuarioRepository;
        this.servicoRepository = servicoRepository;
    }

    @Transactional
    public Contratante cadastrar(Long usuarioId, Contratante dados, Usuario solicitante) {
        validarUsuarioAlvo(usuarioId, solicitante);

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        if (contratanteRepository.findByUsuarioId(usuarioId).isPresent()) {
            throw new ConflitoException("Este usuário já possui um perfil de contratante.");
        }

        Contratante contratante = new Contratante();
        contratante.setUsuario(usuario);
        aplicar(contratante, dados);
        return contratanteRepository.save(contratante);
    }

    public Page<Contratante> listarTodos(Pageable pageable) {
        return contratanteRepository.findAll(pageable);
    }

    public Contratante buscarPorId(Long id) {
        return buscarEntidade(id);
    }

    public Contratante buscarPorUsuario(Usuario usuario) {
        return entidadeDoUsuario(usuario.getId());
    }

    @Transactional
    public Contratante atualizar(Long id, Contratante dados, Usuario solicitante) {
        Contratante contratante = buscarEntidade(id);
        validarDono(contratante, solicitante);
        aplicar(contratante, dados);
        return contratanteRepository.save(contratante);
    }

    @Transactional
    public Contratante atualizarMe(Usuario solicitante, Contratante dados) {
        Contratante contratante = entidadeDoUsuario(solicitante.getId());
        aplicar(contratante, dados);
        return contratanteRepository.save(contratante);
    }

    @Transactional
    public void deletar(Long id, Usuario solicitante) {
        Contratante contratante = buscarEntidade(id);
        validarDono(contratante, solicitante);
        validarExclusao(id);
        contratanteRepository.delete(contratante);
    }

    @Transactional
    public void deletarMe(Usuario solicitante) {
        Contratante contratante = entidadeDoUsuario(solicitante.getId());
        validarExclusao(contratante.getId());
        contratanteRepository.delete(contratante);
    }

    private void validarExclusao(Long contratanteId) {
        if (servicoRepository.existsByContratanteId(contratanteId)) {
            throw new ConflitoException("Não é possível excluir o perfil: existem serviços publicados.");
        }
    }

    private void aplicar(Contratante contratante, Contratante dados) {
        if (contratante.getCpfCnpj() == null || contratante.getCpfCnpj().isBlank()) {
            if (dados.getCpfCnpj() != null && !dados.getCpfCnpj().isBlank()) {
                contratante.setCpfCnpj(dados.getCpfCnpj().replaceAll("\\D", ""));
            }
        }

        if (contratante.getTipoPessoa() == null || contratante.getTipoPessoa().isBlank()) {
            contratante.setTipoPessoa(dados.getTipoPessoa());
        }

        contratante.setCep(dados.getCep() == null ? null : dados.getCep().replaceAll("\\D", ""));
        contratante.setLogradouro(dados.getLogradouro());
        contratante.setNumero(dados.getNumero());
        contratante.setComplemento(dados.getComplemento());
        contratante.setBairro(dados.getBairro());
        contratante.setCidade(dados.getCidade());
        contratante.setUf(dados.getUf() == null ? null : dados.getUf().toUpperCase());
        contratante.setLatitude(dados.getLatitude());
        contratante.setLongitude(dados.getLongitude());
    }

    private Contratante buscarEntidade(Long id) {
        return contratanteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Contratante não encontrado."));
    }

    private Contratante entidadeDoUsuario(Long usuarioId) {
        return contratanteRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil de contratante não encontrado."));
    }

    private void validarDono(Contratante contratante, Usuario solicitante) {
        if (solicitante.getTipo() == TipoUsuario.ADMIN) {
            return;
        }
        if (contratante.getUsuario() == null || !contratante.getUsuario().getId().equals(solicitante.getId())) {
            throw new AcessoNegadoException("Você só pode alterar o seu próprio perfil de contratante.");
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