package br.com.trampo.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import br.com.trampo.model.enums.PeriodoServico;
import br.com.trampo.model.enums.StatusServico;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "servicos")
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "contratante_id", nullable = false)
    private Contratante contratante;

    @ManyToOne
    @JoinColumn(name = "contratado_id")
    private Contratado contratado;

    @NotBlank(message = "O título é obrigatório.")
    @Column(nullable = false)
    private String titulo;

    @Column(length = 1000)
    private String descricao;

    @NotNull(message = "O valor é obrigatório.")
    private BigDecimal valor;

    @NotNull(message = "A data do serviço é obrigatória.")
    @Column(nullable = false)
    private LocalDate dataServico;

    @NotNull(message = "O horário de início é obrigatório.")
    @Column(nullable = false)
    private LocalTime horaInicio;

    @NotNull(message = "O horário de término é obrigatório.")
    @Column(nullable = false)
    private LocalTime horaFim;

    @NotNull(message = "O período é obrigatório.")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PeriodoServico periodo;

    @Enumerated(EnumType.STRING)
    private StatusServico status = StatusServico.ABERTO;

    private String endereco;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private LocalDateTime criadoEm = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Contratante getContratante() { return contratante; }
    public void setContratante(Contratante contratante) { this.contratante = contratante; }

    public Contratado getContratado() { return contratado; }
    public void setContratado(Contratado contratado) { this.contratado = contratado; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }

    public LocalDate getDataServico() { return dataServico; }
    public void setDataServico(LocalDate dataServico) { this.dataServico = dataServico; }

    public LocalTime getHoraInicio() { return horaInicio; }
    public void setHoraInicio(LocalTime horaInicio) { this.horaInicio = horaInicio; }

    public LocalTime getHoraFim() { return horaFim; }
    public void setHoraFim(LocalTime horaFim) { this.horaFim = horaFim; }

    public PeriodoServico getPeriodo() { return periodo; }
    public void setPeriodo(PeriodoServico periodo) { this.periodo = periodo; }

    public StatusServico getStatus() { return status; }
    public void setStatus(StatusServico status) { this.status = status; }

    public String getEndereco() { return endereco; }
    public void setEndereco(String endereco) { this.endereco = endereco; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }
}