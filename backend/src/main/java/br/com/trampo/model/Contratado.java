package br.com.trampo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "contratados")
public class Contratado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @NotBlank(message = "A descrição é obrigatória.")
    @Column(length = 1000, nullable = false)
    private String descricao;

    @NotBlank(message = "Informe os serviços que realiza.")
    @Column(nullable = false)
    private String servicos;

    @NotBlank(message = "Informe a disponibilidade.")
    @Column(nullable = false)
    private String disponibilidade;

    @NotBlank(message = "O CEP é obrigatório.")
    @Column(nullable = false)
    private String cep;

    @NotBlank(message = "O logradouro é obrigatório.")
    @Column(nullable = false)
    private String logradouro;

    @NotBlank(message = "O número é obrigatório.")
    @Column(nullable = false)
    private String numero;

    private String complemento;

    @NotBlank(message = "O bairro é obrigatório.")
    @Column(nullable = false)
    private String bairro;

    @NotBlank(message = "A cidade é obrigatória.")
    @Column(nullable = false)
    private String cidade;

    @NotBlank(message = "O estado é obrigatório.")
    @Column(nullable = false)
    private String uf;

    @NotNull(message = "A latitude é obrigatória.")
    @Column(nullable = false)
    private Double latitude;

    @NotNull(message = "A longitude é obrigatória.")
    @Column(nullable = false)
    private Double longitude;

    @NotNull(message = "O raio de busca é obrigatório.")
    @Column(nullable = false)
    private Double raioBuscaKm;

    private Double mediaAvaliacao = 0.0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getServicos() { return servicos; }
    public void setServicos(String servicos) { this.servicos = servicos; }

    public String getDisponibilidade() { return disponibilidade; }
    public void setDisponibilidade(String disponibilidade) { this.disponibilidade = disponibilidade; }

    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }

    public String getLogradouro() { return logradouro; }
    public void setLogradouro(String logradouro) { this.logradouro = logradouro; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getComplemento() { return complemento; }
    public void setComplemento(String complemento) { this.complemento = complemento; }

    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }

    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }

    public String getUf() { return uf; }
    public void setUf(String uf) { this.uf = uf; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getRaioBuscaKm() { return raioBuscaKm; }
    public void setRaioBuscaKm(Double raioBuscaKm) { this.raioBuscaKm = raioBuscaKm; }

    public Double getMediaAvaliacao() { return mediaAvaliacao; }
    public void setMediaAvaliacao(Double mediaAvaliacao) { this.mediaAvaliacao = mediaAvaliacao; }
}