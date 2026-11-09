package br.com.trampo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.trampo.dto.ConversaResponse;
import br.com.trampo.security.UsuarioAutenticado;
import br.com.trampo.service.ConversaService;

@RestController
@RequestMapping("/conversas")
public class ConversaController {

    private final ConversaService conversaService;

    public ConversaController(ConversaService conversaService) {
        this.conversaService = conversaService;
    }

    @GetMapping
    public ResponseEntity<List<ConversaResponse>> listar(
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(conversaService.listarMinhas(autenticado.getUsuario()));
    }
}