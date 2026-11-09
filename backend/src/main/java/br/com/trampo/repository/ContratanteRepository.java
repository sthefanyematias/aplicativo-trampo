package br.com.trampo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.trampo.model.Contratante;

@Repository
public interface ContratanteRepository extends JpaRepository<Contratante, Long> {

    Optional<Contratante> findByUsuarioId(Long usuarioId);
}