package br.com.trampo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.trampo.model.Contratado;

@Repository
public interface ContratadoRepository extends JpaRepository<Contratado, Long> {

    Optional<Contratado> findByUsuarioId(Long usuarioId);
}