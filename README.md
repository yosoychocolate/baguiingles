# Maya — inglês com I.A.

App de conversação para aprender inglês com a tutora Maya. Fale por texto ou microfone, receba correções, tradução e vocabulário.

## Como abrir no PC

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
# Cole GROQ_API_KEY no .env
npm run dev
```

Abra **http://localhost:5173** no Chrome ou Edge (microfone).

## Colocar a Maya na internet

A chave da Groq **nunca** vai no GitHub nem no navegador. Ela fica só no backend.

### 1. Backend no Render (Web Service)

Como o backend é um servidor Node próprio (`server/index.ts`), use **New → Web Service** (não Static Site).

1. Crie conta em [render.com](https://render.com)
2. **New → Web Service** → conecte o repositório GitHub da Maya
3. Configure:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm run start:api`
   - **Health Check Path:** `/api/status`
4. Em **Environment → Environment Variables**, adicione:
   - `GROQ_API_KEY` = sua chave de [console.groq.com/keys](https://console.groq.com/keys) *(Secret)*
   - `MAYA_ALLOWED_ORIGINS` = `https://yasoychocolate.github.io,http://localhost:5173`
5. Plano **Free** → **Create Web Service**
6. Anote a URL, ex.: `https://maya-api.onrender.com`
7. Teste: `https://maya-api.onrender.com/api/status` → `"ready": true`

> **Opcional:** existe um `render.yaml` no projeto. Se preferir, **New → Blueprint** importa essas mesmas configurações automaticamente. Para um app Node customizado, Web Service manual é o caminho mais claro.

### 2. Frontend no GitHub Pages

1. No repositório GitHub: **Settings → Pages → Source → GitHub Actions**
2. **Settings → Secrets and variables → Actions → Variables**
3. Crie `VITE_API_URL` = `https://maya-api.onrender.com` (sem barra no final)
4. Faça push do código. O workflow **Deploy Maya** publica o site.

Link final: `https://SEU-USuario.github.io/baguiingles/`

### 3. CORS

No Render, `MAYA_ALLOWED_ORIGINS` já inclui `*.github.io` e `localhost:5173`.  
Se usar outro domínio, adicione na variável de ambiente.

## Arquitetura

```
GitHub Pages (React)  →  Render (server/chat.ts)  →  Groq API
     sem chave              GROQ_API_KEY secreta
```

## O que o app faz

- Conversa livre com a Maya, no seu nível (A1–C1)
- Cenários: aeroporto, entrevista, restaurante, etc.
- Ditado em inglês e áudio das respostas
- Correções com explicação em português
- Caderno de vocabulário e sequência diária
