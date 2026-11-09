package br.com.trampo.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.trampo.model.Servico;
import br.com.trampo.model.enums.StatusServico;

@Repository
public interface ServicoRepository extends JpaRepository<Servico, Long> {

    Page<Servico> findByStatus(StatusServico status, Pageable pageable);

    Page<Servico> findByContratanteId(Long contratanteId, Pageable pageable);

    Page<Servico> findByContratadoId(Long contratadoId, Pageable pageable);

    List<Servico> findByContratante_Usuario_IdOrderByCriadoEmDesc(Long usuarioId);

    List<Servico> findByContratado_Usuario_IdOrderByCriadoEmDesc(Long usuarioId);

    boolean existsByContratanteId(Long contratanteId);

    boolean existsByContratadoId(Long contratadoId);

    long countByStatus(StatusServico status);
}