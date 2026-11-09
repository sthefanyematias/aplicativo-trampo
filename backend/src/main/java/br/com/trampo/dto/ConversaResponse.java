package br.com.trampo.dto;

import java.time.LocalDateTime;

import br.com.trampo.model.enums.StatusServico;

public class ConversaResponse {

    private Long servicoId;
    private String titulo;
    private StatusServico status;
    private String outroNome;
    private String ultimaMensagem;
    private LocalDateTime dataUltima;
    private long totalMensagens;
    private long naoLidas;

    public Long getServicoId() { return servicoId; }
    public void setServicoId(Long servicoId) { this.servicoId = servicoId; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public StatusServico getStatus() { return status; }
    public void setStatus(StatusServico status) { this.status = status; }

    public String getOutroNome() { return outroNome; }
    public void setOutroNome(String outroNome) { this.outroNome = outroNome; }

    public String getUltimaMensagem() { return ultimaMensagem; }
    public void setUltimaMensagem(String ultimaMensagem) { this.ultimaMensagem = ultimaMensagem; }

    public LocalDateTime getDataUltima() { return dataUltima; }
    public void setDataUltima(LocalDateTime dataUltima) { this.dataUltima = dataUltima; }

    public long getTotalMensagens() { return totalMensagens; }
    public void setTotalMensagens(long totalMensagens) { this.totalMensagens = totalMensagens; }

    public long getNaoLidas() { return naoLidas; }
    public void setNaoLidas(long naoLidas) { this.naoLidas = naoLidas; }
}