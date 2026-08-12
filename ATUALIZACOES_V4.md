# Nura V4 — Atendente mais humana

- Fluxo de descoberta antes de recomendar: referência anterior -> aroma -> contexto se necessário -> comparação árabe.
- Perfil do cliente persistido durante a sessão para evitar perguntas repetidas.
- Cards só aparecem quando a consultoria está pronta.
- Cards visuais limitados a produtos com fotografia real configurada.
- Mais fotografias reais adicionadas para Yara, Qaed Al Fursan, Turathi Blue, Supremacy Not Only Intense, Club de Nuit Sillage e Club de Nuit Milestone.
- Nova rota `/api/tts` usando Gemini Flash TTS para voz mais natural, com perfil de atendente brasileira feminina e acolhedora.
- Fallback para a voz do navegador caso o TTS não esteja disponível.
- Áudio do cliente continua suportado.
- Mobile refinado.

Variáveis opcionais no Cloudflare:
- `GEMINI_TTS_MODEL` (padrão: `gemini-2.5-flash-preview-tts`)
- `GEMINI_TTS_VOICE` (padrão: `Sulafat`)
