package br.com.trampo.controller;

import org.springframework.data.domain.Pageable;
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
import org.springframework.web.bind.annotation.RestController;

import br.com.trampo.dto.ContratadoPublicoResponse;
import br.com.trampo.dto.PaginaResponse;
import br.com.trampo.model.Contratado;
import br.com.trampo.security.UsuarioAutenticado;
import br.com.trampo.service.ContratadoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/contratados")
public class ContratadoController {

    private final ContratadoService contratadoService;

    public ContratadoController(ContratadoService contratadoService) {
        this.contratadoService = contratadoService;
    }

    @PostMapping("/usuario/{usuarioId}")
    public ResponseEntity<Contratado> cadastrar(@PathVariable Long usuarioId,
            @Valid @RequestBody Contratado dados,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        Contratado salvo = contratadoService.cadastrar(usuarioId, dados, autenticado.getUsuario());
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @GetMapping
    public PaginaResponse<Contratado> listarTodos(
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return PaginaResponse.de(contratadoService.listarTodos(pageable));
    }

    @GetMapping("/me")
    public ResponseEntity<Contratado> me(@AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(contratadoService.buscarPorUsuario(autenticado.getUsuario()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContratadoPublicoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ContratadoPublicoResponse.from(contratadoService.buscarPorId(id)));
    }

    @PutMapping("/me")
    public ResponseEntity<Contratado> atualizarMe(@AuthenticationPrincipal UsuarioAutenticado autenticado,
            @Valid @RequestBody Contratado dados) {
        return ResponseEntity.ok(contratadoService.atualizarMe(autenticado.getUsuario(), dados));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Contratado> atualizar(@PathVariable Long id,
            @Valid @RequestBody Contratado dados,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(contratadoService.atualizar(id, dados, autenticado.getUsuario()));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deletarMe(@AuthenticationPrincipal UsuarioAutenticado autenticado) {
        contratadoService.deletarMe(autenticado.getUsuario());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        contratadoService.deletar(id, autenticado.getUsuario());
        return ResponseEntity.noContent().build();
    }
}