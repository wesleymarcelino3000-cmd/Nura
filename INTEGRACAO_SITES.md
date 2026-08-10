# Integração da Nura em sites

## Opção 1 — Widget flutuante

Cole no site cliente:

```html
<script src="https://SEU-DOMINIO/embed.js" data-label="Falar com a consultora"></script>
```

## Opção 2 — Iframe direto

```html
<iframe
  src="https://SEU-DOMINIO/?embed=1"
  title="Nura - Consultora de Perfumes"
  style="width:100%;height:700px;border:0;border-radius:20px">
</iframe>
```

## Opção 3 — API

`GET /api/catalog`

`POST /api/chat`

O backend da Nura usa a chave Gemini armazenada no Cloudflare. O site consumidor não precisa e não deve receber essa chave.
