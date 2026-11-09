package br.com.trampo.dto;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;

public class PaginaResponse<T> {

    private List<T> conteudo;
    private int pagina;
    private int tamanho;
    private long total;
    private int totalPaginas;
    private boolean ultima;

    public PaginaResponse() {
    }

    public PaginaResponse(List<T> conteudo, int pagina, int tamanho, long total, int totalPaginas, boolean ultima) {
        this.conteudo = conteudo;
        this.pagina = pagina;
        this.tamanho = tamanho;
        this.total = total;
        this.totalPaginas = totalPaginas;
        this.ultima = ultima;
    }

    public static <T> PaginaResponse<T> de(Page<T> page) {
        return new PaginaResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    public static <E, T> PaginaResponse<T> de(Page<E> page, Function<E, T> mapper) {
        List<T> conteudo = page.getContent().stream().map(mapper).toList();
        return new PaginaResponse<>(conteudo, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    public List<T> getConteudo() {
        return conteudo;
    }

    public void setConteudo(List<T> conteudo) {
        this.conteudo = conteudo;
    }

    public int getPagina() {
        return pagina;
    }

    public void setPagina(int pagina) {
        this.pagina = pagina;
    }

    public int getTamanho() {
        return tamanho;
    }

    public void setTamanho(int tamanho) {
        this.tamanho = tamanho;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public int getTotalPaginas() {
        return totalPaginas;
    }

    public void setTotalPaginas(int totalPaginas) {
        this.totalPaginas = totalPaginas;
    }

    public boolean isUltima() {
        return ultima;
    }

    public void setUltima(boolean ultima) {
        this.ultima = ultima;
    }
}