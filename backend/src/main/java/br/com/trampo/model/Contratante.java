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
@Table(name = "contratantes")
public class Contratante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @NotBlank(message = "O tipo de pessoa é obrigatório.")
    @Column(nullable = false)
    private String tipoPessoa;

    @NotBlank(message = "O CPF ou CNPJ é obrigatório.")
    @Column(nullable = false)
    private String cpfCnpj;

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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public String getTipoPessoa() { return tipoPessoa; }
    public void setTipoPessoa(String tipoPessoa) { this.tipoPessoa = tipoPessoa; }

    public String getCpfCnpj() { return cpfCnpj; }
    public void setCpfCnpj(String cpfCnpj) { this.cpfCnpj = cpfCnpj; }

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
}