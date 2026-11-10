package br.com.trampo.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.trampo.dto.PaginaResponse;
import br.com.trampo.model.Servico;
import br.com.trampo.security.UsuarioAutenticado;
import br.com.trampo.service.ServicoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/servicos")
public class ServicoController {

    private final ServicoService servicoService;

    public ServicoController(ServicoService servicoService) {
        this.servicoService = servicoService;
    }

    @PostMapping("/contratante/{contratanteId}")
    public ResponseEntity<Servico> publicar(@PathVariable Long contratanteId,
            @Valid @RequestBody Servico dados,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        Servico salvo = servicoService.publicar(contratanteId, dados, autenticado.getUsuario());
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @GetMapping
    public PaginaResponse<Servico> listarTodos(
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable) {
        return PaginaResponse.de(servicoService.listarTodos(pageable));
    }

    @GetMapping("/abertos")
    public PaginaResponse<Servico> listarAbertos(
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable) {
        return PaginaResponse.de(servicoService.listarAbertos(pageable));
    }

    @GetMapping("/proximos")
    public PaginaResponse<Servico> listarProximos(@RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam Double raioKm,
            @PageableDefault(size = 20) Pageable pageable) {
        return PaginaResponse.de(servicoService.listarProximos(latitude, longitude, raioKm, pageable));
    }

    @GetMapping("/contratante/{contratanteId}")
    public PaginaResponse<Servico> listarPorContratante(@PathVariable Long contratanteId,
            @AuthenticationPrincipal UsuarioAutenticado autenticado,
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable) {
        return PaginaResponse.de(servicoService.listarPorContratante(
                contratanteId, autenticado.getUsuario(), pageable));
    }

    @GetMapping("/contratado/{contratadoId}")
    public PaginaResponse<Servico> listarPorContratado(@PathVariable Long contratadoId,
            @AuthenticationPrincipal UsuarioAutenticado autenticado,
            @PageableDefault(size = 20, sort = "criadoEm", direction = Sort.Direction.DESC) Pageable pageable) {
        return PaginaResponse.de(servicoService.listarPorContratado(
                contratadoId, autenticado.getUsuario(), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Servico> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(servicoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Servico> atualizar(@PathVariable Long id,
            @Valid @RequestBody Servico dados,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(servicoService.atualizar(id, dados, autenticado.getUsuario()));
    }

    @PutMapping("/{id}/concluir")
    public ResponseEntity<Servico> concluir(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(servicoService.concluir(id, autenticado.getUsuario()));
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Servico> cancelar(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(servicoService.cancelar(id, autenticado.getUsuario()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        servicoService.deletar(id, autenticado.getUsuario());
        return ResponseEntity.noContent().build();
    }
}