package br.com.trampo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.trampo.dto.LoginRequest;
import br.com.trampo.dto.LoginResponse;
import br.com.trampo.dto.UsuarioResponse;
import br.com.trampo.security.TokenService;
import br.com.trampo.security.UsuarioAutenticado;
import br.com.trampo.service.UsuarioService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final UsuarioService usuarioService;

    public AuthController(AuthenticationManager authenticationManager, TokenService tokenService,
            UsuarioService usuarioService) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.usuarioService = usuarioService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest login) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(login.getEmail(), login.getSenha()));
        UsuarioAutenticado autenticado = (UsuarioAutenticado) authentication.getPrincipal();
        String token = tokenService.gerarToken(autenticado.getUsuario());
        return ResponseEntity.ok(new LoginResponse(token, usuarioService.me(autenticado.getUsuario())));
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me(@AuthenticationPrincipal UsuarioAutenticado autenticado) {
        return ResponseEntity.ok(usuarioService.me(autenticado.getUsuario()));
    }
}