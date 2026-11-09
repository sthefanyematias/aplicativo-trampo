package br.com.trampo.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import br.com.trampo.model.Usuario;
import br.com.trampo.repository.UsuarioRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String normalizado = email == null ? null : email.trim().toLowerCase();
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(normalizado)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado."));
        return new UsuarioAutenticado(usuario);
    }
}