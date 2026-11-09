package br.com.trampo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.TipoUsuario;
import br.com.trampo.repository.UsuarioRepository;

@Component
public class AdminInicial implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${trampo.admin.email:}")
    private String email;

    @Value("${trampo.admin.senha:}")
    private String senha;

    public AdminInicial(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (email == null || email.isBlank() || senha == null || senha.isBlank()) {
            return;
        }

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            return;
        }

        Usuario admin = new Usuario();
        admin.setNome("Administrador");
        admin.setSobrenome("Trampo");
        admin.setEmail(email.trim().toLowerCase());
        admin.setTelefone("00000000000");
        admin.setSenha(passwordEncoder.encode(senha));
        admin.setTipo(TipoUsuario.ADMIN);
        admin.setAtivo(true);

        usuarioRepository.save(admin);
    }
}