# Roteiro de Estudos — Backend (Gerenciador de Senhas)

> Roteiro em fases, amarrado aos marcos do projeto. Prioriza material em **português** (🇧🇷);
> inglês só quando não há bom equivalente PT.
>
> **Como usar:** não estude uma fase inteira de uma vez. Antes de cada passo prático,
> leia só a linha da tabela referente a ele. Teoria e prática andando juntas.

## O que já domino na prática (base — não precisa reestudar do zero)

- Servidor Fastify básico, rota `GET`, `app.listen`
- ESM (`import`/`export`, `await` no topo do arquivo, `"type":"module"`)
- Hash de senha com **bcrypt**
- CRUD no **MongoDB** (`findOne`, `findOneAndUpdate` com `upsert`, `find/toArray`)
- CLI com `prompt-sync` (arquivo `src/index.js`)

---

## Fase 0 — Consolidar o que já escrevi (2–3 dias)

**Objetivo:** entender de verdade o `server.js` e o `index.js` que já existem.

| Tema | Por que (ligado ao meu código) | Material |
|---|---|---|
| Como HTTP funciona (req/resposta, GET/POST, status) | é o que meu `app.get("/")` faz | 🇧🇷 MDN pt-BR → "Visão geral do HTTP" (`developer.mozilla.org/pt-BR/docs/Web/HTTP/Overview`) |
| JavaScript assíncrono (`async/await`, Promises) | uso `await` em quase toda função | 🇧🇷 MDN pt-BR → "Usando promises" e "async/await" |
| Módulos ESM (`import`/`export`, `"type":"module"`) | permite meu `import` e o `await` no topo | 🇧🇷 MDN pt-BR → "Módulos JavaScript" |

## Fase 1 — Dominar o Fastify (ONDE ESTOU AGORA)

**Objetivo:** servir a página (`@fastify/static`) e criar rotas com consciência.

| Tema | Por que | Material |
|---|---|---|
| Rotas, `request` e `reply` | já tenho `(request, reply)` mas ainda não usei | Fastify Docs → "Routes" (inglês) |
| Plugins e `app.register` | é como vou plugar o `@fastify/static` | Fastify Docs → "Plugins" (inglês) |
| Servir arquivos estáticos | meu próximo passo literal | README do `@fastify/static` no GitHub (inglês, curto) |

> 💡 Doc em inglês: leia com o tradutor do navegador ligado (botão direito → "Traduzir").

## Fase 2 — Transformar o CLI em API REST

**Objetivo:** pegar as funções do `index.js` (`viewPasswords`, `promptManageNewPassword`) e virar rotas `/api/...`.

| Tema | Por que | Material |
|---|---|---|
| O que é uma API REST (recursos, métodos) | minhas rotas `GET/POST /api/passwords` seguem esse padrão | 🇧🇷 "O que é REST" na MDN pt-BR / blogs DevMedia / Alura |
| Ler dados do `request` (body, params) | receber `{source, password}` do formulário | Fastify Docs → "Request" (inglês) |
| Formato JSON | troca entre servidor e navegador | 🇧🇷 MDN pt-BR → "Trabalhando com JSON" |

## Fase 3 — Frontend + Segurança (fechar o ciclo)

**Objetivo:** a tela chamar as rotas e a senha mestra proteger tudo.

| Tema | Por que | Material |
|---|---|---|
| `fetch` no navegador | liga o botão da tela à rota | 🇧🇷 MDN pt-BR → "Usando Fetch" |
| Sessão / cookies (autenticação) | proteger com a senha mestra na web | 🇧🇷 MDN pt-BR → "Cookies HTTP" + Fastify `@fastify/session` (inglês) |
| Variáveis de ambiente (`.env`) | tirar a URL do Mongo do código | 🇧🇷 vídeos Rocketseat / Filipe Deschamps sobre "variáveis de ambiente Node" |

---

## Canais brasileiros gratuitos (vídeo) 🇧🇷

- **Rocketseat** — Node.js / backend moderno.
- **Filipe Deschamps** — curso gratuito de Node.js do zero, ótimo pra fundamentos.
- **Curso em Vídeo (Gustavo Guanabara)** — reforço de JavaScript básico.

*(Buscar pelo nome do canal + tema; links diretos de vídeo mudam com o tempo.)*

---

## Ponto de atenção do projeto (anotado durante o desenvolvimento)

- As senhas guardadas hoje ficam em **texto puro** no Mongo (`src/index.js`). Na versão web isso
  fica mais exposto — planejar **criptografia reversível** (diferente do hash da senha mestra).
