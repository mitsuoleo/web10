package com.ads.lojinha;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Garante, ao subir a aplicação, que os produtos da vitrine do frontend (Anelar)
 * existem no banco com a imagem correta. É idempotente:
 *  - produto que já existe (mesmo nome) só ganha a imagem, se estiver sem;
 *  - produto que não existe é inserido.
 * Nada é sobrescrito nem duplicado.
 */
@Component
public class CargaInicial implements CommandLineRunner {

    @Autowired
    ProdutoRepository bd;

    private record Item(String nome, String descritivo, double valor, double valorPromo,
                        int quantidade, int destaque, String imagem) {}

    private static final List<Item> PRODUTOS = List.of(
        new Item("Colar Gota de Esmeralda", "Ouro branco 18k e diamantes", 5500, 5229.9, 10, 1, "/produtos/colargota.jpg"),
        new Item("Anel Solitário Imperial", "Ouro amarelo 18k, diamante 1ct", 3800, 3599.9, 8, 2, "/produtos/anelimperial.jpg"),
        new Item("Pulseira Riviera", "Ouro branco 18k com safiras", 4800, 3599.9, 8, 3, "/produtos/pulseirariviera.jpg"),
        new Item("Brinco Argola Ouro", "Ouro amarelo 18k", 1200, 1099.9, 8, 4, "/produtos/brincoargola.jpg"),
        new Item("Colar de Pérolas", "Pérolas de água doce", 2500, 2300.9, 8, 5, "/produtos/colarperola.jpg"),
        new Item("Anel de Prata com Rubi", "Prata 925, rubi natural", 950, 900, 8, 6, "/produtos/anelpratarubi.jpg"),
        new Item("Pulseira de Prata", "Prata 925", 450, 400, 8, 7, "/produtos/pulseiraprata.jpg"),
        new Item("Brinco de Prata com Zircônia", "Prata 925, zircônia cúbica", 350, 300, 8, 8, "/produtos/brincoprata.jpg"),
        new Item("Colar de Ouro com Diamante", "Ouro branco 18k, diamante 0.5ct", 7500, 7250, 8, 9, "/produtos/colarourobranco.jpg"),
        new Item("Anel de Ouro com Esmeralda", "Ouro amarelo 18k, esmeralda natural", 4200, 4199, 8, 10, "/produtos/anelesmeralda.jpg"),
        new Item("Pulseira de Ouro com Diamantes", "Ouro branco 18k, diamantes", 8500, 0, 8, 11, "/produtos/pulseiraourobranco.jpg"),
        new Item("Brinco de Ouro com Rubi", "Ouro amarelo 18k, rubi natural", 3200, 0, 8, 12, "/produtos/brincorubiouro.jpg"),
        new Item("Colar de Prata com Safira", "Prata 925, safira natural", 1800, 0, 8, 13, "/produtos/colarpratasafira.jpg"),
        new Item("Anel de Prata com Diamante", "Prata 925, diamante 0.1ct", 1500, 0, 8, 14, "/produtos/anelpratadiamante.jpg"),
        new Item("Pulseira de Couro com Ouro", "Couro natural, ouro 18k", 2200, 0, 8, 15, "/produtos/pulseiracouro.jpg"),
        new Item("Brinco de Pérola", "Pérola de água salgada, ouro 18k", 4500, 0, 8, 16, "/produtos/brincoperola.jpg")
    );

    @Override
    public void run(String... args) {
        for (Item i : PRODUTOS) {
            Optional<Produto> existente = bd.findFirstByNomeIgnoreCase(i.nome());
            if (existente.isPresent()) {
                Produto p = existente.get();
                if (p.getImagem() == null || p.getImagem().isBlank()) {
                    p.setImagem(i.imagem());
                    bd.save(p);
                }
            } else {
                Produto p = new Produto();
                p.setNome(i.nome());
                p.setDescritivo(i.descritivo());
                p.setValor(i.valor());
                p.setValorPromo(i.valorPromo());
                p.setQuantidade(i.quantidade());
                p.setDestaque(i.destaque());
                p.setImagem(i.imagem());
                bd.save(p);
            }
        }
    }
}
