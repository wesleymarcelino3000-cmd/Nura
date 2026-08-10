# Nura — Consultora de Perfumes Árabes

MVP gratuito de uma consultora virtual humanizada para ajudar clientes a escolher perfumes.

## O que já funciona

- conversa em formato de chat;
- memória da conversa durante a sessão;
- prompt anti-repetição;
- uma pergunta por vez quando precisa conhecer melhor o cliente;
- recomendações com cards visuais;
- catálogo inicial;
- layout responsivo para celular;
- modo demonstração se a API ainda não estiver configurada;
- backend em Cloudflare Pages Functions;
- chave da Gemini protegida no servidor.

## Importante sobre as imagens

As imagens incluídas nesta primeira versão são **ilustrações próprias de demonstração**, não fotografias oficiais dos frascos.

Quando você tiver fotos reais dos seus produtos, basta substituir os arquivos dentro de:

`public/images/`

Mantenha o mesmo nome do arquivo e o site começará a usar a foto real automaticamente. PNG, JPG ou WebP também podem ser usados; nesse caso atualize o campo `image` em `public/catalog.json`.

Isso evita depender de hotlink de lojas de terceiros.

---

# TESTE SEM PAGAR E SEM CONFIGURAR API

Você pode publicar o projeto e abrir o chat.

Se a Gemini ainda não estiver configurada, o site entra em **modo demonstração**. Ele serve para visualizar a experiência e os cards.

Para ter conversa realmente inteligente e personalizada, configure a Gemini.

---

# COMO ATIVAR A GEMINI

## 1. Criar chave
Entre no Google AI Studio e crie uma Gemini API key para um projeto elegível ao Free Tier.

## 2. Publicar no Cloudflare Pages
Suba este projeto para um repositório GitHub e conecte o repositório ao Cloudflare Pages.

Configuração simples:
- Framework preset: `None`
- Build command: deixe vazio
- Build output directory: `public`

A pasta `functions/` deve permanecer na raiz do repositório para o Pages Functions publicar `/api/chat`.

## 3. Salvar a chave com segurança
No projeto do Cloudflare, adicione:

`GEMINI_API_KEY`

como Secret/variável protegida no ambiente de produção.

**Nunca coloque a chave dentro de `app.js`, `index.html` ou `catalog.json`.**

---

# TESTAR LOCALMENTE

Requer Node.js.

```bash
npm install
cp .dev.vars.example .dev.vars
```

Edite `.dev.vars` e coloque sua chave.

Depois:

```bash
npm run dev
```

Abra o endereço mostrado pelo Wrangler.

---

# COMO CADASTRAR NOVOS PERFUMES

Edite:

`public/catalog.json`

Depois adicione também o item correspondente na constante `CATALOG` dentro de:

`functions/api/chat.js`

Na próxima versão, vale mover o catálogo para uma fonte única para evitar duplicidade.

Campos principais:
- `id`
- `name`
- `brand`
- `image`
- `profile`
- `bestFor`
- `notes`
- `salesHint`

---

# PRÓXIMAS MELHORIAS RECOMENDADAS

1. Trocar as ilustrações pelas fotos reais dos produtos.
2. Colocar seu estoque real.
3. Adicionar preço e botão de compra/WhatsApp.
4. Aumentar o catálogo.
5. Criar painel simples para editar produtos sem mexer em código.
6. Salvar leads com consentimento.
7. Adicionar proteção anti-abuso antes de divulgar em grande volume.

## Privacidade
No Free Tier de alguns serviços de IA, dados podem estar sujeitos aos termos específicos daquele nível. Verifique os termos atuais antes de usar com informações pessoais de clientes. Evite pedir dados sensíveis desnecessários.
