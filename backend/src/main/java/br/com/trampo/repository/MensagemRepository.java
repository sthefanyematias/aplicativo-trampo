package br.com.trampo.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.trampo.model.Mensagem;

@Repository
public interface MensagemRepository extends JpaRepository<Mensagem, Long> {

    Page<Mensagem> findByServicoIdOrderByDataEnvioAsc(Long servicoId, Pageable pageable);

    Mensagem findFirstByServicoIdOrderByDataEnvioDesc(Long servicoId);

    List<Mensagem> findByServicoIdAndRemetenteIdNotAndLidaFalse(Long servicoId, Long remetenteId);

    long countByServicoIdAndRemetenteIdNotAndLidaFalse(Long servicoId, Long remetenteId);

    long countByServicoId(Long servicoId);

    boolean existsByServicoId(Long servicoId);
}