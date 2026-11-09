package br.com.trampo.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.trampo.dto.PaginaResponse;
import br.com.trampo.model.Candidatura;
import br.com.trampo.security.UsuarioAutenticado;
import br.com.trampo.service.CandidaturaService;

@RestController
@RequestMapping("/candidaturas")
public class CandidaturaController {

    private final CandidaturaService candidaturaService;

    public CandidaturaController(CandidaturaService candidaturaService) {
        this.candidaturaService = candidaturaService;
    }

    @PostMapping("/servico/{servicoId}/contratado/{contratadoId}")
    public ResponseEntity<Candidatura> candidatar(@PathVariable Long servicoId,
            @PathVariable Long contratadoId,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        Candidatura salva = candidaturaService.candidatar(servicoId, contratadoId, autenticado.getUsuario());
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @PutMapping("/{id}/aceitar")
    public ResponseEntity<Candidatura> aceitar(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(candidaturaService.aceitar(id, autenticado.getUsuario()));
    }

    @GetMapping("/servico/{servicoId}")
    public PaginaResponse<Candidatura> listarPorServico(@PathVariable Long servicoId,
            @AuthenticationPrincipal UsuarioAutenticado autenticado,
            @PageableDefault(size = 20, sort = "data", direction = Sort.Direction.DESC) Pageable pageable) {
        return PaginaResponse.de(candidaturaService.listarPorServico(servicoId, autenticado.getUsuario(), pageable));
    }

    @GetMapping("/contratado/{contratadoId}")
    public PaginaResponse<Candidatura> listarPorContratado(@PathVariable Long contratadoId,
            @AuthenticationPrincipal UsuarioAutenticado autenticado,
            @PageableDefault(size = 20, sort = "data", direction = Sort.Direction.DESC) Pageable pageable) {
        return PaginaResponse.de(candidaturaService.listarPorContratado(contratadoId, autenticado.getUsuario(), pageable));
    }

    @GetMapping("/pendentes")
    public PaginaResponse<Candidatura> listarPendentes(
            @AuthenticationPrincipal UsuarioAutenticado autenticado,
            @PageableDefault(size = 30, sort = "data", direction = Sort.Direction.DESC) Pageable pageable) {
        return PaginaResponse.de(candidaturaService.listarPendentesDoContratante(autenticado.getUsuario(), pageable));
    }

    @GetMapping("/pendentes/quantidade")
    public ResponseEntity<Map<String, Long>> contarPendentes(
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        Map<String, Long> resposta = new HashMap<>();
        resposta.put("total", candidaturaService.contarPendentesDoContratante(autenticado.getUsuario()));
        return ResponseEntity.ok(resposta);
    }
}