
package br.com.trampo.security;

import java.io.IOException;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sessao -> sessao.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(erros -> erros
                        .authenticationEntryPoint((requisicao, resposta, excecao) -> escreverErro(resposta,
                                HttpStatus.UNAUTHORIZED, "Não autenticado."))
                        .accessDeniedHandler((requisicao, resposta, excecao) -> escreverErro(resposta,
                                HttpStatus.FORBIDDEN, "Acesso negado.")))
                .authorizeHttpRequests(autorizacao -> autorizacao
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/usuarios").permitAll()
                        .requestMatchers("/auth/me").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/usuarios/me").authenticated()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/usuarios/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/contratados/**").hasRole("CONTRATADO")
                        .requestMatchers(HttpMethod.PUT, "/contratados/**").hasRole("CONTRATADO")
                        .requestMatchers(HttpMethod.DELETE, "/contratados/**").hasRole("CONTRATADO")
                        .requestMatchers(HttpMethod.POST, "/contratantes/**").hasRole("CONTRATANTE")
                        .requestMatchers(HttpMethod.PUT, "/contratantes/**").hasRole("CONTRATANTE")
                        .requestMatchers(HttpMethod.DELETE, "/contratantes/**").hasRole("CONTRATANTE")
                        .requestMatchers(HttpMethod.POST, "/servicos/**").hasRole("CONTRATANTE")
                        .requestMatchers(HttpMethod.PUT, "/servicos/*/concluir").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/servicos/**").hasRole("CONTRATANTE")
                        .requestMatchers(HttpMethod.DELETE, "/servicos/**").hasRole("CONTRATANTE")
                        .requestMatchers(HttpMethod.POST, "/candidaturas/**").hasRole("CONTRATADO")
                        .requestMatchers(HttpMethod.PUT, "/candidaturas/**").hasRole("CONTRATANTE")
                        .requestMatchers("/conversas/**").authenticated()
                        .requestMatchers("/mensagens/**").authenticated()
                        .requestMatchers("/avaliacoes/**").authenticated()
                        .requestMatchers("/notificacoes/**").authenticated()
                        .requestMatchers("/reportes/**").authenticated()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private void escreverErro(HttpServletResponse resposta, HttpStatus status, String mensagem) throws IOException {
        resposta.setStatus(status.value());
        resposta.setContentType(MediaType.APPLICATION_JSON_VALUE);
        resposta.setCharacterEncoding("UTF-8");
        resposta.getWriter().write("{\"status\":" + status.value() + ",\"mensagem\":\"" + mensagem + "\"}");
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuracao) throws Exception {
        return configuracao.getAuthenticationManager();
    }
}
