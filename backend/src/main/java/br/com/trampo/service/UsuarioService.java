package br.com.trampo.service;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.dto.CadastroRequest;
import br.com.trampo.dto.PaginaResponse;
import br.com.trampo.dto.UsuarioResponse;
import br.com.trampo.exception.ConflitoException;
import br.com.trampo.exception.RecursoNaoEncontradoException;
import br.com.trampo.exception.RegraNegocioException;
import br.com.trampo.model.Contratado;
import br.com.trampo.model.Contratante;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.ContratadoRepository;
import br.com.trampo.repository.ContratanteRepository;
import br.com.trampo.repository.UsuarioRepository;

@Service
@Transactional(readOnly = true)
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final ContratadoRepository contratadoRepository;
    private final ContratanteRepository contratanteRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository,
            ContratadoRepository contratadoRepository,
            ContratanteRepository contratanteRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.contratadoRepository = contratadoRepository;
        this.contratanteRepository = contratanteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UsuarioResponse cadastrar(CadastroRequest dados) {
        String email = dados.getEmail().trim().toLowerCase();

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflitoException("Já existe um usuário com este e-mail.");
        }

        if (dados.getTipo() == TipoUsuario.ADMIN) {
            throw new RegraNegocioException(
                    "Não é permitido criar administradores por este cadastro.");
        }

        if (dados.getTipo() == TipoUsuario.CONTRATANTE) {
            validarDadosContratante(dados);
        }

        if (dados.getTipo() == TipoUsuario.CONTRATADO) {
            validarDadosContratado(dados);
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dados.getNome().trim());
        usuario.setSobrenome(dados.getSobrenome().trim());
        usuario.setEmail(email);
        usuario.setTelefone(dados.getTelefone().replaceAll("\\D", ""));
        usuario.setSenha(passwordEncoder.encode(dados.getSenha()));
        usuario.setTipo(dados.getTipo());
        usuario.setAtivo(true);

        Usuario salvo = usuarioRepository.save(usuario);

        Long contratadoId = null;
        Long contratanteId = null;

        if (salvo.getTipo() == TipoUsuario.CONTRATANTE) {
            Contratante contratante = new Contratante();
            contratante.setUsuario(salvo);
            contratante.setTipoPessoa(dados.getTipoPessoa().trim());
            contratante.setCpfCnpj(dados.getCpfCnpj().replaceAll("\\D", ""));
            preencherEnderecoContratante(contratante, dados);
            contratanteId = contratanteRepository.save(contratante).getId();
        }

        if (salvo.getTipo() == TipoUsuario.CONTRATADO) {
            Contratado contratado = new Contratado();
            contratado.setUsuario(salvo);
            contratado.setDescricao(dados.getDescricao().trim());
            contratado.setServicos(dados.getServicos().trim());
            contratado.setDisponibilidade(dados.getDisponibilidade().trim());
            contratado.setRaioBuscaKm(dados.getRaioBuscaKm());
            preencherEnderecoContratado(contratado, dados);
            contratadoId = contratadoRepository.save(contratado).getId();
        }

        return UsuarioResponse.from(salvo, contratadoId, contratanteId);
    }

    public PaginaResponse<UsuarioResponse> listarTodos(Pageable pageable) {
        Page<Usuario> pagina = usuarioRepository.findAll(pageable);
        return PaginaResponse.de(pagina, this::toResponse);
    }

    public Optional<UsuarioResponse> buscarPorId(Long id) {
        return usuarioRepository.findById(id).map(this::toResponse);
    }

    public UsuarioResponse me(Usuario usuario) {
        return toResponse(usuario);
    }

    @Transactional
    public UsuarioResponse atualizar(Long id, Usuario dados) {
        Usuario usuario = buscarEntidade(id);
        usuario.setNome(dados.getNome());
        usuario.setSobrenome(dados.getSobrenome());
        usuario.setTelefone(dados.getTelefone());
        usuario.setTipo(dados.getTipo());
        usuario.setAtivo(dados.getAtivo());
        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse atualizarMe(Usuario usuario, Usuario dados) {
        Usuario entidade = buscarEntidade(usuario.getId());

        if (dados.getNome() == null || dados.getNome().isBlank()) {
            throw new RegraNegocioException("O nome é obrigatório.");
        }

        if (dados.getSobrenome() == null || dados.getSobrenome().isBlank()) {
            throw new RegraNegocioException("O sobrenome é obrigatório.");
        }

        if (dados.getTelefone() == null || dados.getTelefone().isBlank()) {
            throw new RegraNegocioException("O telefone é obrigatório.");
        }

        entidade.setNome(dados.getNome().trim());
        entidade.setSobrenome(dados.getSobrenome().trim());
        entidade.setTelefone(dados.getTelefone().replaceAll("\\D", ""));
        return toResponse(usuarioRepository.save(entidade));
    }

    @Transactional
    public void deletar(Long id) {
        Usuario usuario = buscarEntidade(id);
        usuario.setAtivo(false);
        usuarioRepository.save(usuario);
    }

    public Usuario buscarEntidade(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
    }

    private void preencherEnderecoContratante(Contratante contratante, CadastroRequest dados) {
        contratante.setCep(dados.getCep().replaceAll("\\D", ""));
        contratante.setLogradouro(dados.getLogradouro().trim());
        contratante.setNumero(dados.getNumero().trim());
        contratante.setComplemento(textoOuNulo(dados.getComplemento()));
        contratante.setBairro(dados.getBairro().trim());
        contratante.setCidade(dados.getCidade().trim());
        contratante.setUf(dados.getUf().trim().toUpperCase());
        contratante.setLatitude(dados.getLatitude());
        contratante.setLongitude(dados.getLongitude());
    }

    private void preencherEnderecoContratado(Contratado contratado, CadastroRequest dados) {
        contratado.setCep(dados.getCep().replaceAll("\\D", ""));
        contratado.setLogradouro(dados.getLogradouro().trim());
        contratado.setNumero(dados.getNumero().trim());
        contratado.setComplemento(textoOuNulo(dados.getComplemento()));
        contratado.setBairro(dados.getBairro().trim());
        contratado.setCidade(dados.getCidade().trim());
        contratado.setUf(dados.getUf().trim().toUpperCase());
        contratado.setLatitude(dados.getLatitude());
        contratado.setLongitude(dados.getLongitude());
    }

    private void validarDadosContratante(CadastroRequest dados) {
        exigir(dados.getTipoPessoa(), "Informe o tipo de pessoa (física ou jurídica).");
        exigir(dados.getCpfCnpj(), "Informe o CPF ou CNPJ.");
    }

    private void validarDadosContratado(CadastroRequest dados) {
        exigir(dados.getServicos(), "Informe quais serviços você realiza.");
        exigir(dados.getDisponibilidade(), "Informe sua disponibilidade.");
        exigir(dados.getDescricao(), "Fale um pouco sobre você.");

        if (dados.getRaioBuscaKm() == null || dados.getRaioBuscaKm() <= 0) {
            throw new RegraNegocioException("Informe o raio de interesse em km.");
        }
    }

    private void exigir(String valor, String mensagem) {
        if (valor == null || valor.isBlank()) {
            throw new RegraNegocioException(mensagem);
        }
    }

    private String textoOuNulo(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }

    private UsuarioResponse toResponse(Usuario usuario) {
        Long contratadoId = contratadoRepository.findByUsuarioId(usuario.getId())
                .map(Contratado::getId)
                .orElse(null);
        Long contratanteId = contratanteRepository.findByUsuarioId(usuario.getId())
                .map(Contratante::getId)
                .orElse(null);
        return UsuarioResponse.from(usuario, contratadoId, contratanteId);
    }
}