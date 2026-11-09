
package br.com.trampo.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.trampo.dto.PaginaResponse;
import br.com.trampo.model.Mensagem;
import br.com.trampo.security.UsuarioAutenticado;
import br.com.trampo.service.MensagemService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/mensagens")
public class MensagemController {

    private final MensagemService mensagemService;

    public MensagemController(MensagemService mensagemService) {
        this.mensagemService = mensagemService;
    }

    @PostMapping("/servico/{servicoId}/remetente/{remetenteId}")
    public ResponseEntity<Mensagem> enviar(@PathVariable Long servicoId,
            @PathVariable Long remetenteId,
            @Valid @RequestBody Mensagem dados,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        Mensagem salva = mensagemService.enviar(servicoId, remetenteId, dados, autenticado.getUsuario());
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @GetMapping("/servico/{servicoId}")
    public PaginaResponse<Mensagem> listarPorServico(@PathVariable Long servicoId,
            @AuthenticationPrincipal UsuarioAutenticado autenticado,
            @PageableDefault(size = 50) Pageable pageable) {
        return PaginaResponse.de(mensagemService.listarPorServico(servicoId, autenticado.getUsuario(), pageable));
    }
}
