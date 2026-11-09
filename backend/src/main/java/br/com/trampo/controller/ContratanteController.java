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

import br.com.trampo.dto.ContratantePublicoResponse;
import br.com.trampo.dto.PaginaResponse;
import br.com.trampo.model.Contratante;
import br.com.trampo.security.UsuarioAutenticado;
import br.com.trampo.service.ContratanteService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/contratantes")
public class ContratanteController {

    private final ContratanteService contratanteService;

    public ContratanteController(ContratanteService contratanteService) {
        this.contratanteService = contratanteService;
    }

    @PostMapping("/usuario/{usuarioId}")
    public ResponseEntity<Contratante> cadastrar(@PathVariable Long usuarioId,
            @Valid @RequestBody Contratante dados,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        Contratante salvo = contratanteService.cadastrar(usuarioId, dados, autenticado.getUsuario());
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @GetMapping
    public PaginaResponse<Contratante> listarTodos(
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return PaginaResponse.de(contratanteService.listarTodos(pageable));
    }

    @GetMapping("/me")
    public ResponseEntity<Contratante> me(@AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(contratanteService.buscarPorUsuario(autenticado.getUsuario()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContratantePublicoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(ContratantePublicoResponse.from(contratanteService.buscarPorId(id)));
    }

    @PutMapping("/me")
    public ResponseEntity<Contratante> atualizarMe(@AuthenticationPrincipal UsuarioAutenticado autenticado,
            @Valid @RequestBody Contratante dados) {
        return ResponseEntity.ok(contratanteService.atualizarMe(autenticado.getUsuario(), dados));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Contratante> atualizar(@PathVariable Long id,
            @Valid @RequestBody Contratante dados,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(contratanteService.atualizar(id, dados, autenticado.getUsuario()));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deletarMe(@AuthenticationPrincipal UsuarioAutenticado autenticado) {
        contratanteService.deletarMe(autenticado.getUsuario());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        contratanteService.deletar(id, autenticado.getUsuario());
        return ResponseEntity.noContent().build();
    }
}