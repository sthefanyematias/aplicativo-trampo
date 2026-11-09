package br.com.trampo.exception;

import java.time.LocalDateTime;

public class ErroResposta {

    private LocalDateTime data;
    private Integer status;
    private String mensagem;

    public ErroResposta(Integer status, String mensagem) {
        this.data = LocalDateTime.now();
        this.status = status;
        this.mensagem = mensagem;
    }

    public LocalDateTime getData() { return data; }
    public void setData(LocalDateTime data) { this.data = data; }

    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }

    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }
}