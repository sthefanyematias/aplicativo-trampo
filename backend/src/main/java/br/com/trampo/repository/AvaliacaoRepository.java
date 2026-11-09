package br.com.trampo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.trampo.model.Avaliacao;

@Repository
public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    Page<Avaliacao> findByAvaliadoId(Long avaliadoId, Pageable pageable);

    boolean existsByServicoId(Long servicoId);

    boolean existsByServicoIdAndAvaliadorId(Long servicoId, Long avaliadorId);

    java.util.Optional<Avaliacao> findByServicoIdAndAvaliadorId(Long servicoId, Long avaliadorId);

    long countByServicoIdAndAvaliadorIdNot(Long servicoId, Long avaliadorId);
}
