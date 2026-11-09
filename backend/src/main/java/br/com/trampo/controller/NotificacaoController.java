package br.com.trampo.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.trampo.model.Notificacao;
import br.com.trampo.security.UsuarioAutenticado;
import br.com.trampo.service.NotificacaoService;

@RestController
@RequestMapping("/notificacoes")
public class NotificacaoController {

    private final NotificacaoService notificacaoService;

    public NotificacaoController(NotificacaoService notificacaoService) {
        this.notificacaoService = notificacaoService;
    }

    @GetMapping
    public ResponseEntity<List<Notificacao>> listar(
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(notificacaoService.listarMinhas(autenticado.getUsuario()));
    }

    @GetMapping("/nao-lidas/quantidade")
    public ResponseEntity<Map<String, Long>> contarNaoLidas(
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(Map.of("total", notificacaoService.contarNaoLidas(autenticado.getUsuario())));
    }

    @PutMapping("/{id}/ler")
    public ResponseEntity<Notificacao> marcarLida(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(notificacaoService.marcarLida(id, autenticado.getUsuario()));
    }

    @PutMapping("/ler-todas")
    public ResponseEntity<Void> marcarTodas(@AuthenticationPrincipal UsuarioAutenticado autenticado) {
        notificacaoService.marcarTodasLidas(autenticado.getUsuario());
        return ResponseEntity.noContent().build();
    }
}
