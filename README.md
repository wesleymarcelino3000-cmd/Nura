# Nura V3 — Consultora de Perfumes Árabes

Versão ampliada da Nura, preparada para Cloudflare Pages + Gemini API.

## Principais melhorias da V3

- catálogo curado ampliado para 26 perfumes de várias casas árabes;
- regras anti-repetição para não recomendar sempre os mesmos produtos;
- Gemini 3.6 Flash como modelo padrão;
- respostas sugeridas em botões para deixar a conversa mais natural;
- memória maior da conversa;
- envio de mensagem por áudio real;
- o áudio é convertido para WAV no navegador e enviado ao Gemini para compreensão/transcrição;
- a Nura pode falar suas respostas usando a voz disponível no navegador, sem API adicional;
- botão para ligar/desligar a voz;
- mobile redesenhado;
- correção de rolagem dos cards e imagens;
- widget para outros sites com permissão de microfone;
- API pública do projeto continua disponível em `/api/chat` e `/api/catalog`.

## Áudio

O usuário toca no microfone, grava e toca novamente para enviar.

O navegador pede permissão para o microfone. O áudio é processado no próprio navegador para WAV e enviado ao endpoint `/api/chat`.

A gravação é limitada a 45 segundos no frontend.

## Voz da Nura

O botão de alto-falante no topo ativa/desativa a leitura das respostas.

A síntese usa `speechSynthesis` do navegador. Não exige outra chave ou serviço pago.

A qualidade/timbre da voz depende das vozes instaladas no dispositivo/navegador.

## Gemini

Variável obrigatória no Cloudflare:

`GEMINI_API_KEY`

Variável opcional:

`GEMINI_MODEL`

Se não existir, o sistema usa:

`gemini-3.6-flash`

## Cloudflare Pages

- build output: `public`
- branch: `main`
- pasta `functions/` na raiz
- secret `GEMINI_API_KEY`

## Integração em outros sites

```html
<script
  src="https://SEU-DOMINIO.pages.dev/embed.js"
  data-label="Escolha seu perfume">
</script>
```

O script já cria o iframe com permissão de microfone.

## Catálogo e imagens

Os produtos originais da V2 mantêm as imagens já configuradas.

Os novos produtos adicionados na V3 usam ilustrações de catálogo locais com nome e marca para evitar hotlink inseguro. Substitua essas ilustrações por fotos reais/licenciadas dos seus produtos quando desejar.

Arquivos dos novos produtos:

`public/images/catalog/`

## Importante

A Nura foi orientada a conversar sobre um universo de marcas árabes maior que os cards do catálogo. Para fatos muito específicos que não estejam no catálogo, ela deve evitar inventar informações.
