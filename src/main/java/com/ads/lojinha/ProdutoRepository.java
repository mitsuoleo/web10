package com.ads.lojinha;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;


@Repository
public interface ProdutoRepository  extends JpaRepository<Produto, Integer> {
    Optional<Produto> findFirstByNomeIgnoreCase(String nome);

    @Query(value = "select * from produto where destaque>0 order by destaque", nativeQuery = true)
    public List<Produto> carregaVitrine();

    @Query(value = "select * from produto where nome like :termo or descritivo like :termo", nativeQuery=true)
    public List<Produto> fazerBusca(String termo);
}
