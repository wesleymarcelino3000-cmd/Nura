# Nura — Consultora de Perfumes Árabes

Versão 2: interface premium, atendimento humanizado, cards de produtos com fotos reais e integração aberta para outros sites.

## O que esta versão tem

- Chat responsivo para desktop e celular.
- Prompt de atendimento com linguagem natural e anti-repetição.
- Memória da conversa durante a sessão.
- Recomendações visuais com imagem, marca e perfil.
- Botões “Gostei desse” e “Quero comparar”.
- Fotos reais de Afnan 9 PM, Afnan 9 PM Rebel e Armaf Club de Nuit Intense Man armazenadas no próprio projeto a partir das páginas das marcas.
- Os itens Lattafa usam imagens reais remotas com ilustração local de fallback caso a fonte bloqueie hotlink.
- `/api/chat` para conversar com a Nura a partir de qualquer site.
- `/api/catalog` para consultar o catálogo em JSON.
- CORS habilitado para integração externa.
- `embed.js` para colocar a Nura como botão flutuante em qualquer site.
- A chave `GEMINI_API_KEY` permanece no Cloudflare; nunca é enviada ao navegador.

## Configuração no Cloudflare Pages

Build output directory: `public`

A pasta `functions/` deve permanecer na raiz do repositório.

Adicione em **Settings > Variables and Secrets**:

`GEMINI_API_KEY` = sua chave da Gemini

Opcionalmente:

`GEMINI_MODEL` = `gemini-3.6-flash`

Depois faça um novo deploy.

## Colocar a Nura em outro site — modo mais fácil

Quando seu domínio do Pages estiver pronto, por exemplo:

`https://nura.pages.dev`

cole antes de `</body>` em qualquer site:

```html
<script
  src="https://nura.pages.dev/embed.js"
  data-label="Escolha seu perfume"
  data-position="right"
  data-accent="#171411">
</script>
```

Isso cria um botão flutuante e abre a Nura em uma janela de atendimento.

### Personalização

- `data-label`: texto do botão.
- `data-position`: `right` ou `left`.
- `data-accent`: cor do botão em hexadecimal.

## Integrar diretamente pela API

### Catálogo

```http
GET https://nura.pages.dev/api/catalog
```

### Conversa

```http
POST https://nura.pages.dev/api/chat
Content-Type: application/json
```

Body:

```json
{
  "messages": [
    {"role":"user","text":"Quero um perfume doce para sair à noite"}
  ]
}
```

Resposta:

```json
{
  "reply":"...",
  "recommendationIds":["afnan-9pm"]
}
```

O site que integrar a API pode buscar os detalhes visuais do perfume em `/api/catalog` usando os IDs retornados.

## Segurança antes de alto volume

A API está aberta para facilitar testes e integração entre sites. Antes de divulgar em grande escala, é recomendado adicionar rate limiting e, se necessário, restringir as origens autorizadas para evitar que terceiros consumam sua cota da Gemini.

## Fotos dos seus próprios produtos

Quando você tiver fotos reais do seu estoque, o ideal é substituir as imagens remotas pelas suas próprias imagens em `public/images/`. Isso evita depender de servidores de terceiros e permite mostrar exatamente o produto vendido pela sua loja.
