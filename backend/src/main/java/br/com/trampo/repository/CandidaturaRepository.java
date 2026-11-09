package br.com.trampo.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.trampo.model.Candidatura;
import br.com.trampo.model.enums.StatusCandidatura;

@Repository
public interface CandidaturaRepository extends JpaRepository<Candidatura, Long> {

    Page<Candidatura> findByServicoId(Long servicoId, Pageable pageable);

    Page<Candidatura> findByContratadoId(Long contratadoId, Pageable pageable);

    List<Candidatura> findByServicoIdOrderByDataAsc(Long servicoId);

    Page<Candidatura> findByServico_Contratante_Usuario_IdAndStatus(Long usuarioId,
            StatusCandidatura status, Pageable pageable);

    long countByServico_Contratante_Usuario_IdAndStatus(Long usuarioId, StatusCandidatura status);

    long countByStatus(StatusCandidatura status);

    boolean existsByServicoId(Long servicoId);

    boolean existsByContratadoId(Long contratadoId);

    boolean existsByServicoIdAndContratadoId(Long servicoId, Long contratadoId);
}