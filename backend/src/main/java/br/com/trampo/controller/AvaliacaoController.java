

package br.com.trampo.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
import br.com.trampo.model.Avaliacao;
import br.com.trampo.security.UsuarioAutenticado;
import br.com.trampo.service.AvaliacaoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/avaliacoes")
public class AvaliacaoController {

    private final AvaliacaoService avaliacaoService;

    public AvaliacaoController(AvaliacaoService avaliacaoService) {
        this.avaliacaoService = avaliacaoService;
    }

    @PostMapping("/servico/{servicoId}/avaliador/{avaliadorId}/avaliado/{avaliadoId}")
    public ResponseEntity<Avaliacao> avaliar(@PathVariable Long servicoId,
            @PathVariable Long avaliadorId,
            @PathVariable Long avaliadoId,
            @Valid @RequestBody Avaliacao dados,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        Avaliacao salva = avaliacaoService.avaliar(servicoId, avaliadorId, avaliadoId, dados,
                autenticado.getUsuario());
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @GetMapping("/servico/{servicoId}/minha")
    public ResponseEntity<Avaliacao> minhaAvaliacao(@PathVariable Long servicoId,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        Avaliacao avaliacao = avaliacaoService.buscarMinha(servicoId, autenticado.getUsuario());
        return avaliacao == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(avaliacao);
    }

    @GetMapping("/servico/{servicoId}/ja-avaliei")
    public ResponseEntity<java.util.Map<String, Boolean>> jaAvaliei(@PathVariable Long servicoId,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(java.util.Map.of("avaliado",
                avaliacaoService.jaAvaliei(servicoId, autenticado.getUsuario())));
    }

    @GetMapping("/avaliado/{avaliadoId}")
    public PaginaResponse<Avaliacao> listarPorAvaliado(@PathVariable Long avaliadoId,
            @PageableDefault(size = 20, sort = "data", direction = Sort.Direction.DESC) Pageable pageable) {
        return PaginaResponse.de(avaliacaoService.listarPorAvaliado(avaliadoId, pageable));
    }
}
