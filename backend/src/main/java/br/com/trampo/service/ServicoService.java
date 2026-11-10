package br.com.trampo.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.exception.AcessoNegadoException;
import br.com.trampo.exception.ConflitoException;
import br.com.trampo.exception.RecursoNaoEncontradoException;
import br.com.trampo.exception.RegraNegocioException;
import br.com.trampo.model.Contratado;
import br.com.trampo.model.Contratante;
import br.com.trampo.model.Servico;
import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.StatusServico;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.AvaliacaoRepository;
import br.com.trampo.repository.CandidaturaRepository;
import br.com.trampo.repository.ContratadoRepository;
import br.com.trampo.repository.ContratanteRepository;
import br.com.trampo.repository.MensagemRepository;
import br.com.trampo.repository.ServicoRepository;

@Service
@Transactional(readOnly = true)
public class ServicoService {

    private final ServicoRepository servicoRepository;
    private final ContratanteRepository contratanteRepository;
    private final ContratadoRepository contratadoRepository;
    private final CandidaturaRepository candidaturaRepository;
    private final MensagemRepository mensagemRepository;
    private final AvaliacaoRepository avaliacaoRepository;
    private final NotificacaoService notificacaoService;

    public ServicoService(ServicoRepository servicoRepository,
            ContratanteRepository contratanteRepository,
            ContratadoRepository contratadoRepository,
            CandidaturaRepository candidaturaRepository,
            MensagemRepository mensagemRepository,
            AvaliacaoRepository avaliacaoRepository,
            NotificacaoService notificacaoService) {
        this.servicoRepository = servicoRepository;
        this.contratanteRepository = contratanteRepository;
        this.contratadoRepository = contratadoRepository;
        this.candidaturaRepository = candidaturaRepository;
        this.mensagemRepository = mensagemRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.notificacaoService = notificacaoService;
    }

    @Transactional
    public Servico publicar(Long contratanteId, Servico dados, Usuario solicitante) {
        Contratante contratante = contratanteRepository.findById(contratanteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Contratante não encontrado."));

        validarDonoContratante(contratante, solicitante);
        validarLocalizacao(contratante);
        validarAgenda(dados);

        Servico servico = new Servico();
        servico.setContratante(contratante);
        servico.setStatus(StatusServico.ABERTO);
        aplicar(servico, dados, contratante);
        return servicoRepository.save(servico);
    }

    public Page<Servico> listarTodos(Pageable pageable) {
        return servicoRepository.findAll(pageable);
    }

    public Page<Servico> listarAbertos(Pageable pageable) {
        return servicoRepository.findByStatus(StatusServico.ABERTO, pageable);
    }

    public Page<Servico> listarPorContratante(Long contratanteId, Usuario solicitante, Pageable pageable) {
        Contratante contratante = contratanteRepository.findById(contratanteId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Contratante não encontrado."));

        validarDonoContratante(contratante, solicitante);
        return servicoRepository.findByContratanteId(contratanteId, pageable);
    }

    public Page<Servico> listarPorContratado(Long contratadoId, Usuario solicitante, Pageable pageable) {
        Contratado contratado = contratadoRepository.findById(contratadoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Contratado não encontrado."));

        validarDonoContratado(contratado, solicitante);
        return servicoRepository.findByContratadoId(contratadoId, pageable);
    }

    public Servico buscarPorId(Long id) {
        return buscarEntidade(id);
    }

    public Page<Servico> listarProximos(Double latitude, Double longitude, Double raioKm, Pageable pageable) {
        List<Servico> abertos = servicoRepository.findByStatus(StatusServico.ABERTO, Pageable.unpaged()).getContent();
        List<Servico> proximos = new ArrayList<>();

        for (Servico servico : abertos) {
            if (servico.getLatitude() == null || servico.getLongitude() == null) {
                continue;
            }
            double distancia = calcularDistancia(latitude, longitude, servico.getLatitude(), servico.getLongitude());
            if (distancia <= raioKm) {
                proximos.add(servico);
            }
        }

        proximos.sort((a, b) -> Double.compare(
                calcularDistancia(latitude, longitude, a.getLatitude(), a.getLongitude()),
                calcularDistancia(latitude, longitude, b.getLatitude(), b.getLongitude())));

        int pagina = pageable.getPageNumber();
        int tamanho = pageable.getPageSize();
        int inicio = Math.min(pagina * tamanho, proximos.size());
        int fim = Math.min(inicio + tamanho, proximos.size());
        return new PageImpl<>(proximos.subList(inicio, fim), pageable, proximos.size());
    }

    @Transactional
    public Servico atualizar(Long id, Servico dados, Usuario solicitante) {
        Servico servico = buscarEntidade(id);
        validarDonoContratante(servico.getContratante(), solicitante);

        if (servico.getStatus() != StatusServico.ABERTO) {
            throw new RegraNegocioException("Só é possível editar serviços abertos.");
        }

        validarLocalizacao(servico.getContratante());
        validarAgenda(dados);
        aplicar(servico, dados, servico.getContratante());
        return servicoRepository.save(servico);
    }

    @Transactional
    public Servico concluir(Long id, Usuario solicitante) {
        Servico servico = buscarEntidade(id);
        validarParticipante(servico, solicitante);

        if (servico.getStatus() != StatusServico.EM_ANDAMENTO) {
            throw new RegraNegocioException("Só é possível concluir um serviço em andamento.");
        }

        servico.setStatus(StatusServico.CONCLUIDO);
        Servico salvo = servicoRepository.save(servico);

        Long idContratante = servico.getContratante() != null && servico.getContratante().getUsuario() != null
                ? servico.getContratante().getUsuario().getId()
                : null;
        Long idContratado = servico.getContratado() != null && servico.getContratado().getUsuario() != null
                ? servico.getContratado().getUsuario().getId()
                : null;

        if (idContratante != null) {
            notificacaoService.criar(
                    servico.getContratante().getUsuario(),
                    "Serviço concluído",
                    "O serviço \"" + servico.getTitulo()
                            + "\" foi finalizado. Avalie o trabalhador e acompanhe a conversa encerrada.",
                    "SERVICO",
                    servico.getId());
        }

        if (servico.getContratado() != null && servico.getContratado().getUsuario() != null) {
            notificacaoService.criar(
                    servico.getContratado().getUsuario(),
                    "Serviço concluído",
                    "O serviço \"" + servico.getTitulo()
                            + "\" foi finalizado. Avalie o contratante e acompanhe a conversa encerrada.",
                    "SERVICO",
                    servico.getId());
        }

        return salvo;
    }

    @Transactional
    public Servico cancelar(Long id, Usuario solicitante) {
        Servico servico = buscarEntidade(id);
        validarDonoContratante(servico.getContratante(), solicitante);

        if (servico.getStatus() == StatusServico.CONCLUIDO) {
            throw new RegraNegocioException("Não é possível cancelar um serviço já concluído.");
        }

        servico.setStatus(StatusServico.CANCELADO);
        return servicoRepository.save(servico);
    }

    @Transactional
    public void deletar(Long id, Usuario solicitante) {
        Servico servico = buscarEntidade(id);
        validarDonoContratante(servico.getContratante(), solicitante);

        if (servico.getStatus() == StatusServico.EM_ANDAMENTO) {
            throw new ConflitoException("Não é possível excluir um serviço em andamento.");
        }

        if (candidaturaRepository.existsByServicoId(id)
                || mensagemRepository.existsByServicoId(id)
                || avaliacaoRepository.existsByServicoId(id)) {
            throw new ConflitoException(
                    "Não é possível excluir: este serviço possui histórico. Cancele-o em vez de excluir.");
        }

        servicoRepository.delete(servico);
    }

    public Servico buscarEntidade(Long id) {
        return servicoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Serviço não encontrado."));
    }

    private void validarAgenda(Servico dados) {
        if (dados.getDataServico() == null) {
            throw new RegraNegocioException("Informe a data do serviço.");
        }

        if (dados.getHoraInicio() == null || dados.getHoraFim() == null) {
            throw new RegraNegocioException("Informe a faixa de horário do serviço.");
        }

        if (!dados.getHoraFim().isAfter(dados.getHoraInicio())) {
            throw new RegraNegocioException("O horário final deve ser depois do horário inicial.");
        }

        if (dados.getPeriodo() == null) {
            throw new RegraNegocioException("Informe o período: manhã, tarde ou noite.");
        }
    }

    private void validarLocalizacao(Contratante contratante) {
        if (contratante.getLatitude() == null || contratante.getLongitude() == null) {
            throw new RegraNegocioException(
                    "Cadastre a localização do seu perfil antes de publicar um serviço.");
        }
    }

    private void aplicar(Servico servico, Servico dados, Contratante contratante) {
        servico.setTitulo(dados.getTitulo());
        servico.setDescricao(dados.getDescricao());
        servico.setValor(dados.getValor());
        servico.setDataServico(dados.getDataServico());
        servico.setHoraInicio(dados.getHoraInicio());
        servico.setHoraFim(dados.getHoraFim());
        servico.setPeriodo(dados.getPeriodo());
        servico.setEndereco(dados.getEndereco() != null && !dados.getEndereco().isBlank()
                ? dados.getEndereco().trim()
                : enderecoDoContratante(contratante));
        servico.setLatitude(dados.getLatitude() != null ? dados.getLatitude() : contratante.getLatitude());
        servico.setLongitude(dados.getLongitude() != null ? dados.getLongitude() : contratante.getLongitude());
    }

    private String enderecoDoContratante(Contratante contratante) {
        String endereco = contratante.getLogradouro() + ", " + contratante.getNumero();

        if (contratante.getComplemento() != null && !contratante.getComplemento().isBlank()) {
            endereco = endereco + " - " + contratante.getComplemento();
        }

        return endereco + " - " + contratante.getBairro() + ", " + contratante.getCidade() + "/"
                + contratante.getUf();
    }

    private void validarDonoContratante(Contratante contratante, Usuario solicitante) {
        if (solicitante.getTipo() == TipoUsuario.ADMIN) {
            return;
        }
        if (contratante == null || contratante.getUsuario() == null
                || !contratante.getUsuario().getId().equals(solicitante.getId())) {
            throw new AcessoNegadoException("Você não é o contratante responsável por este serviço.");
        }
    }

    private void validarDonoContratado(Contratado contratado, Usuario solicitante) {
        if (solicitante.getTipo() == TipoUsuario.ADMIN) {
            return;
        }
        if (contratado == null || contratado.getUsuario() == null
                || !contratado.getUsuario().getId().equals(solicitante.getId())) {
            throw new AcessoNegadoException("Você só pode consultar os seus próprios serviços.");
        }
    }

    private void validarParticipante(Servico servico, Usuario solicitante) {
        if (solicitante.getTipo() == TipoUsuario.ADMIN) {
            return;
        }
        Long idContratante = servico.getContratante() != null && servico.getContratante().getUsuario() != null
                ? servico.getContratante().getUsuario().getId()
                : null;
        Long idContratado = servico.getContratado() != null && servico.getContratado().getUsuario() != null
                ? servico.getContratado().getUsuario().getId()
                : null;
        if (!solicitante.getId().equals(idContratante) && !solicitante.getId().equals(idContratado)) {
            throw new AcessoNegadoException("Você não participa deste serviço.");
        }
    }

    private double calcularDistancia(Double lat1, Double lon1, Double lat2, Double lon2) {
        double raioTerra = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return raioTerra * c;
    }
}