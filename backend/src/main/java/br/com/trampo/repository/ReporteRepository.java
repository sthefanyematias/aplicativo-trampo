package br.com.trampo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.trampo.model.Reporte;
import br.com.trampo.model.enums.StatusReporte;

@Repository
public interface ReporteRepository extends JpaRepository<Reporte, Long> {

    List<Reporte> findByUsuarioIdOrderByCriadoEmDesc(Long usuarioId);

    List<Reporte> findAllByOrderByCriadoEmDesc();

    long countByStatus(StatusReporte status);
}
