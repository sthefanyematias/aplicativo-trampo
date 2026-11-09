package br.com.trampo.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.trampo.dto.ReporteRequest;
import br.com.trampo.dto.ReporteResolucaoRequest;
import br.com.trampo.model.Reporte;
import br.com.trampo.security.UsuarioAutenticado;
import br.com.trampo.service.ReporteService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/reportes")
public class ReporteController {

    private final ReporteService reporteService;

    public ReporteController(ReporteService reporteService) {
        this.reporteService = reporteService;
    }

    @PostMapping
    public ResponseEntity<Reporte> criar(@Valid @RequestBody ReporteRequest dados,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reporteService.criar(dados, autenticado.getUsuario()));
    }

    @GetMapping("/meus")
    public ResponseEntity<List<Reporte>> listarMeus(
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(reporteService.listarMeus(autenticado.getUsuario()));
    }

    @GetMapping
    public ResponseEntity<List<Reporte>> listarTodos(
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(reporteService.listarTodos(autenticado.getUsuario()));
    }

    @GetMapping("/abertos/quantidade")
    public ResponseEntity<Map<String, Long>> contarAbertos(
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(Map.of("total", reporteService.contarAbertos()));
    }

    @PutMapping("/{id}/analisar")
    public ResponseEntity<Reporte> iniciarAnalise(@PathVariable Long id,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(reporteService.iniciarAnalise(id, autenticado.getUsuario()));
    }

    @PutMapping("/{id}/resolver")
    public ResponseEntity<Reporte> resolver(@PathVariable Long id,
            @RequestBody ReporteResolucaoRequest dados,
            @AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(reporteService.resolver(id, dados, autenticado.getUsuario()));
    }
}
