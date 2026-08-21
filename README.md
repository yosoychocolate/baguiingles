# Maya — inglês com I.A.

App de conversação para aprender inglês com uma tutora de I.A. (Maya). Fale por texto ou microfone, receba correções, tradução e vocabulário.

## Como abrir

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (em geral `http://localhost:5173`).

Use **Chrome** ou **Edge** para o microfone funcionar.

## Conectar a I.A. (grátis)

1. Crie uma chave em [console.groq.com/keys](https://console.groq.com/keys)
2. No app, abra **Ajustes** e cole a chave
3. Volte para **Conversa** e fale em inglês

Também funciona com [Google Gemini](https://aistudio.google.com/apikey) ou OpenAI.

Opcional: crie um arquivo `.env` na pasta do projeto:

```
GROQ_API_KEY=gsk_sua_chave
```

## O que o app faz

- Conversa livre com a Maya, no seu nível
- Cenários (aeroporto, entrevista, restaurante, etc.)
- Ditado em inglês e áudio das respostas
- Correções com explicação em português
- Caderno de vocabulário e sequência diária
