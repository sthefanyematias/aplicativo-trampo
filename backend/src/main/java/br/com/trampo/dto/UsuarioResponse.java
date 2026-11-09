package br.com.trampo.dto;

import java.time.LocalDateTime;

import br.com.trampo.model.Usuario;
import br.com.trampo.model.enums.TipoUsuario;

public class UsuarioResponse {

    private Long id;
    private String nome;
    private String sobrenome;
    private String email;
    private String telefone;
    private TipoUsuario tipo;
    private Boolean ativo;
    private LocalDateTime criadoEm;
    private Long contratadoId;
    private Long contratanteId;

    public UsuarioResponse() {
    }

    public UsuarioResponse(Long id, String nome, String sobrenome, String email, String telefone, TipoUsuario tipo,
            Boolean ativo, LocalDateTime criadoEm, Long contratadoId, Long contratanteId) {
        this.id = id;
        this.nome = nome;
        this.sobrenome = sobrenome;
        this.email = email;
        this.telefone = telefone;
        this.tipo = tipo;
        this.ativo = ativo;
        this.criadoEm = criadoEm;
        this.contratadoId = contratadoId;
        this.contratanteId = contratanteId;
    }

    public static UsuarioResponse from(Usuario usuario) {
        return from(usuario, null, null);
    }

    public static UsuarioResponse from(Usuario usuario, Long contratadoId, Long contratanteId) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getSobrenome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getTipo(),
                usuario.getAtivo(),
                usuario.getCriadoEm(),
                contratadoId,
                contratanteId);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getSobrenome() {
        return sobrenome;
    }

    public void setSobrenome(String sobrenome) {
        this.sobrenome = sobrenome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public TipoUsuario getTipo() {
        return tipo;
    }

    public void setTipo(TipoUsuario tipo) {
        this.tipo = tipo;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }

    public Long getContratadoId() {
        return contratadoId;
    }

    public void setContratadoId(Long contratadoId) {
        this.contratadoId = contratadoId;
    }

    public Long getContratanteId() {
        return contratanteId;
    }

    public void setContratanteId(Long contratanteId) {
        this.contratanteId = contratanteId;
    }
}