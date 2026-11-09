package br.com.trampo.dto;

import java.time.LocalDateTime;

import br.com.trampo.model.Contratante;

public class ContratantePublicoResponse {

    private Long id;
    private String nome;
    private String sobrenome;
    private String tipoPessoa;
    private String bairro;
    private String cidade;
    private String uf;
    private LocalDateTime membroDesde;

    public static ContratantePublicoResponse from(Contratante contratante) {
        ContratantePublicoResponse resposta = new ContratantePublicoResponse();
        resposta.id = contratante.getId();
        resposta.tipoPessoa = contratante.getTipoPessoa();
        resposta.bairro = contratante.getBairro();
        resposta.cidade = contratante.getCidade();
        resposta.uf = contratante.getUf();

        if (contratante.getUsuario() != null) {
            resposta.nome = contratante.getUsuario().getNome();
            resposta.sobrenome = contratante.getUsuario().getSobrenome();
            resposta.membroDesde = contratante.getUsuario().getCriadoEm();
        }

        return resposta;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getSobrenome() { return sobrenome; }
    public String getTipoPessoa() { return tipoPessoa; }
    public String getBairro() { return bairro; }
    public String getCidade() { return cidade; }
    public String getUf() { return uf; }
    public LocalDateTime getMembroDesde() { return membroDesde; }
}