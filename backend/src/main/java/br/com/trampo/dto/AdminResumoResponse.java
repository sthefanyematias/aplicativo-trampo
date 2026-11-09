
package br.com.trampo.dto;

public class AdminResumoResponse {

    private long usuarios;
    private long contratados;
    private long contratantes;
    private long servicosAbertos;
    private long servicosEmAndamento;
    private long servicosConcluidos;
    private long servicosCancelados;
    private long candidaturasPendentes;
    private long avaliacoes;
    private long reportesAbertos;

    public long getUsuarios() { return usuarios; }
    public void setUsuarios(long usuarios) { this.usuarios = usuarios; }

    public long getContratados() { return contratados; }
    public void setContratados(long contratados) { this.contratados = contratados; }

    public long getContratantes() { return contratantes; }
    public void setContratantes(long contratantes) { this.contratantes = contratantes; }

    public long getServicosAbertos() { return servicosAbertos; }
    public void setServicosAbertos(long servicosAbertos) { this.servicosAbertos = servicosAbertos; }

    public long getServicosEmAndamento() { return servicosEmAndamento; }
    public void setServicosEmAndamento(long servicosEmAndamento) { this.servicosEmAndamento = servicosEmAndamento; }

    public long getServicosConcluidos() { return servicosConcluidos; }
    public void setServicosConcluidos(long servicosConcluidos) { this.servicosConcluidos = servicosConcluidos; }

    public long getServicosCancelados() { return servicosCancelados; }
    public void setServicosCancelados(long servicosCancelados) { this.servicosCancelados = servicosCancelados; }

    public long getCandidaturasPendentes() { return candidaturasPendentes; }
    public void setCandidaturasPendentes(long candidaturasPendentes) { this.candidaturasPendentes = candidaturasPendentes; }

    public long getAvaliacoes() { return avaliacoes; }
    public void setAvaliacoes(long avaliacoes) { this.avaliacoes = avaliacoes; }

    public long getReportesAbertos() { return reportesAbertos; }
    public void setReportesAbertos(long reportesAbertos) { this.reportesAbertos = reportesAbertos; }
}
