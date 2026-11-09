package br.com.trampo.dto;

import java.time.LocalDateTime;

import br.com.trampo.model.Contratado;

public class ContratadoPublicoResponse {

    private Long id;
    private String nome;
    private String sobrenome;
    private String descricao;
    private String servicos;
    private String disponibilidade;
    private String bairro;
    private String cidade;
    private String uf;
    private Double mediaAvaliacao;
    private LocalDateTime membroDesde;

    public static ContratadoPublicoResponse from(Contratado contratado) {
        ContratadoPublicoResponse resposta = new ContratadoPublicoResponse();
        resposta.id = contratado.getId();
        resposta.descricao = contratado.getDescricao();
        resposta.servicos = contratado.getServicos();
        resposta.disponibilidade = contratado.getDisponibilidade();
        resposta.bairro = contratado.getBairro();
        resposta.cidade = contratado.getCidade();
        resposta.uf = contratado.getUf();
        resposta.mediaAvaliacao = contratado.getMediaAvaliacao();

        if (contratado.getUsuario() != null) {
            resposta.nome = contratado.getUsuario().getNome();
            resposta.sobrenome = contratado.getUsuario().getSobrenome();
            resposta.membroDesde = contratado.getUsuario().getCriadoEm();
        }

        return resposta;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getSobrenome() { return sobrenome; }
    public String getDescricao() { return descricao; }
    public String getServicos() { return servicos; }
    public String getDisponibilidade() { return disponibilidade; }
    public String getBairro() { return bairro; }
    public String getCidade() { return cidade; }
    public String getUf() { return uf; }
    public Double getMediaAvaliacao() { return mediaAvaliacao; }
    public LocalDateTime getMembroDesde() { return membroDesde; }
}