# Lojinha Anelar — backend + frontend

Loja virtual de joias. O **backend** (Spring Boot + SQLite) fica na raiz do repositório e o **frontend** (Angular, projeto P1 "Anelar") fica em [`frontend/`](frontend).

## Como rodar

Precisa de JDK 21 e Node 20+.

**1. Backend** (porta 8081), na raiz do repositório:

```bash
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

Ao subir, a classe `CargaInicial` garante os 16 produtos da vitrine (com as imagens) no `lojinha.db`. Ela não duplica nem sobrescreve nada.

**2. Frontend** (porta 4200):

```bash
cd frontend
npm install
npm start
```

Abra http://localhost:4200. O endereço da API está em `frontend/src/app/api.config.ts` (`http://localhost:8081/api`).

## Endpoints usados pelo frontend

| Tela | Chamadas |
|---|---|
| Vitrine / busca | `GET /api/produto/vitrine`, `GET /api/produto/busca/{termo}` |
| Cadastro | `POST /api/cliente` |
| Login | `POST /api/cliente/login` |
| Recuperar senha | `PATCH /api/cliente/alterarSenha` |
| Aprovar pedido (cesta) | `POST /api/pedido` |
| Meus pedidos | `GET /api/pedido/cliente/{codigo}` |
| Pagamento | `GET /api/pedido/{codigo}` + `PUT /api/pedido` |

Os demais endpoints documentados (produto: `GET /{codigo}`, `POST`, `PUT`, `DELETE`, `GET /api/produtos`; cliente: `GET/PUT/DELETE`, `resetarSenha`; pedido: `DELETE`) continuam no backend e têm método correspondente nos serviços do frontend.

## O que mudou no backend para a integração

- **Produto**: novo campo `imagem` (caminho da foto, ex.: `/produtos/anelimperial.jpg`).
- **Pedido**: novos campos `status`, `formaPagamento`, `parcelas` e a lista `itens` (antes comentada). `dataPedido` e `status` ganham valor padrão se não vierem no POST.
- **Novo endpoint**: `GET /api/pedido/cliente/{codigoCliente}`, com os pedidos do cliente (mais recente primeiro).
- **Cliente**: a `senha` nunca é devolvida nas respostas. O cadastro grava o cliente já ativo (`ativo=1`, que o login exige) e recusa e-mail repetido (`E-mail já cadastrado!`). O `PUT` sem senha mantém a senha atual.
- **Correção `alterarSenha`**: o controller passava o `documento` no lugar da senha antiga. Agora confirma e-mail + documento, grava a nova senha e reativa o cliente. Se os dados não baterem, devolve `Dados não conferem! ...`.
- **Mensagens do Pedido**: `Cliente gravado...` virou `Pedido gravado...` e `PEdido` virou `Pedido`.

## Observações

- O endereço do cadastro (rua, número, complemento, cidade, CEP) é gravado junto no campo `logradouro`. A data de nascimento é validada na tela, mas o backend não tem campo para ela.
- O CPF é gravado só com dígitos.
- Os campos de senha ainda são guardados em texto puro no banco (como já era). Vale trocar por hash antes de qualquer uso real.
