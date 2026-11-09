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

import br.com.trampo.dto.CadastroRequest;
import br.com.trampo.dto.PaginaResponse;
import br.com.trampo.dto.UsuarioResponse;
import br.com.trampo.model.Usuario;
import br.com.trampo.security.UsuarioAutenticado;
import br.com.trampo.service.UsuarioService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> cadastrar(@Valid @RequestBody CadastroRequest dados) {
        UsuarioResponse salvo = usuarioService.cadastrar(dados);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @GetMapping
    public PaginaResponse<UsuarioResponse> listarTodos(
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return usuarioService.listarTodos(pageable);
    }

    @PutMapping("/me")
    public ResponseEntity<UsuarioResponse> atualizarMe(@AuthenticationPrincipal UsuarioAutenticado autenticado,
            @RequestBody Usuario dados) {
        return ResponseEntity.ok(usuarioService.atualizarMe(autenticado.getUsuario(), dados));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> buscarPorId(@PathVariable Long id) {
        return usuarioService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponse> atualizar(@PathVariable Long id,
            @RequestBody Usuario dados) {
        return ResponseEntity.ok(usuarioService.atualizar(id, dados));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        usuarioService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}