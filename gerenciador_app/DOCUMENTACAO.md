# Gerenciador de Senhas — Documentação de Estudo

> Documento feito para **estudar** o projeto: entender como ele funciona, como rodar em outra
> máquina, como as rotas se comunicam, e — principalmente — **as regras e conceitos** de
> back-end e front-end por trás de cada decisão. Cada trecho de código aqui é o código real do
> projeto, acompanhado da explicação do *porquê*.

---

## Índice

1. [O que é este projeto](#1-o-que-é-este-projeto)
2. [A grande ideia: uma lógica, várias interfaces](#2-a-grande-ideia-uma-lógica-várias-interfaces)
3. [Tecnologias usadas](#3-tecnologias-usadas)
4. [Estrutura de pastas e arquivos](#4-estrutura-de-pastas-e-arquivos)
5. [Como rodar o projeto em outra máquina](#5-como-rodar-o-projeto-em-outra-máquina)
6. [A migração CLI → Web (a história)](#6-a-migração-cli--web-a-história)
7. [As regras de projeto (os princípios)](#7-as-regras-de-projeto-os-princípios)
8. [O back-end em detalhe](#8-o-back-end-em-detalhe)
9. [O front-end em detalhe](#9-o-front-end-em-detalhe)
10. [Referência das rotas da API](#10-referência-das-rotas-da-api)
11. [O ciclo de autenticação (sessão e cookie)](#11-o-ciclo-de-autenticação-sessão-e-cookie)
12. [Glossário de conceitos](#12-glossário-de-conceitos)
13. [Dívidas técnicas e próximos passos](#13-dívidas-técnicas-e-próximos-passos)

---

## 1. O que é este projeto

Um **gerenciador de senhas** escrito em **Node.js**. Ele guarda pares de "nome do serviço →
senha" (por exemplo `gmail => minhasenha123`) num banco de dados **MongoDB**, protegido por uma
**senha-mestra** (a senha de acesso ao app).

O projeto nasceu como um **programa de terminal (CLI)** e foi **migrado para uma aplicação web**
completa, sem jogar o CLI fora. Hoje ele tem **duas caras**:

- **CLI** — você usa pelo terminal, navegando por um menu.
- **Web** — você usa pelo navegador, com telas de login e de senhas.

As duas caras usam **exatamente a mesma lógica** por baixo. Entender *como* isso foi feito é o
coração deste documento.

---

## 2. A grande ideia: uma lógica, várias interfaces

Todo programa tem dois tipos de código misturados:

- **Lógica** — o que realmente acontece com os dados (buscar no banco, salvar, apagar, conferir
  uma senha). É a "regra de negócio".
- **Interface** — como o usuário conversa com o programa (no CLI: `prompt` e `console.log`; na
  web: formulários HTML e respostas HTTP).

A decisão central do projeto foi **separar essas duas coisas em arquivos diferentes**. A lógica
mora em módulos "neutros" que não sabem quem os está chamando. Cada interface (CLI ou web) usa
esses módulos por cima.

```
        ┌──────────────────────────────────────────┐
        │   LÓGICA NEUTRA (não sabe quem a chama)    │
        │   db.js  ·  auth.js  ·  passwords.js       │
        └──────────────────────────────────────────┘
              ▲                          ▲
              │                          │
     ┌────────┴─────────┐      ┌─────────┴───────────┐
     │  INTERFACE CLI   │      │  INTERFACE WEB       │
     │  src/index.js    │      │  src/server.js       │
     │  (prompt/console)│      │  (Fastify / HTTP)    │
     └──────────────────┘      └─────────┬───────────┘
                                         │
                               ┌─────────┴───────────┐
                               │  FRONT-END           │
                               │  public/*.html + *.js│
                               │  (navegador)         │
                               └─────────────────────┘
```

**Consequência prática:** uma senha salva pelo site cai no mesmo banco que o CLI lê. As duas
interfaces são só "portas" diferentes para a mesma lógica.

---

## 3. Tecnologias usadas

| Tecnologia | Para que serve no projeto |
|---|---|
| **Node.js** | Executa JavaScript fora do navegador (o back-end). |
| **ESM** (`"type": "module"`) | Sistema de módulos moderno: `import` / `export`. Permite também `await` no topo do arquivo. |
| **MongoDB** | Banco de dados onde as senhas e a senha-mestra ficam guardadas. |
| **driver `mongodb`** | Biblioteca que conecta o Node ao MongoDB. |
| **Fastify** | Framework do servidor web (cria as rotas HTTP). |
| **`@fastify/static`** | Serve os arquivos da pasta `public/` (HTML, JS) para o navegador. |
| **`@fastify/cookie`** | Ensina o Fastify a ler e escrever cookies. |
| **`@fastify/session`** | Gerencia sessões (o "estar logado") em cima dos cookies. |
| **`bcrypt`** | Transforma a senha-mestra em um *hash* seguro (impossível de reverter). |
| **`prompt-sync`** | Lê o que o usuário digita no terminal (usado só no CLI). |

---

## 4. Estrutura de pastas e arquivos

```
gerenciador_app/
├── package.json          → dependências e config do projeto (ESM)
├── src/                   → o back-end (roda no Node)
│   ├── db.js             → conexão com o MongoDB
│   ├── auth.js           → lógica da senha-mestra (bcrypt)
│   ├── passwords.js      → lógica das senhas (CRUD)
│   ├── index.js          → INTERFACE CLI (menu no terminal)
│   └── server.js         → INTERFACE WEB (servidor Fastify)
└── public/                → o front-end (roda no navegador)
    ├── index.html        → tela de login
    ├── config.js         → JS da tela de login
    ├── senhas.html       → tela das senhas
    └── senhas.js         → JS da tela das senhas
```

Repare na divisão: **`src/` é o que roda no servidor**; **`public/` é o que o navegador baixa e
roda**. O `@fastify/static` é a ponte que entrega os arquivos de `public/` para o navegador.

---

## 5. Como rodar o projeto em outra máquina

### Pré-requisitos

1. **Node.js** instalado (versão 18 ou mais nova — o projeto usa `import` e `await` no topo).
2. **MongoDB** instalado e rodando localmente. O projeto espera o banco em
   `mongodb://localhost:27017` (veja `src/db.js`).

### Passo a passo

```bash
# 1. Entrar na pasta do app
cd gerenciador_app

# 2. Instalar as dependências (lê o package.json e baixa tudo para node_modules/)
npm install
```

**3. Definir a senha-mestra (bootstrap) — importante!**

O login da web só sabe **conferir** a senha-mestra; ele não sabe **criá-la**. Quem cria a
senha-mestra na primeira vez é o **CLI**. Então, numa máquina nova, rode o CLI primeiro:

```bash
node src/index.js
```

Como ainda não existe senha-mestra no banco, o programa vai pedir para você **criar uma**. Depois
disso, ela fica salva (como *hash*) no MongoDB.

**4. Rodar o servidor web:**

```bash
node src/server.js
```

Deve aparecer `servidor on em http://localhost:3000`.

**5. Usar no navegador:**

- Abra **http://localhost:3000/** → tela de login.
- Digite a senha-mestra criada no passo 3.
- Você é levado para **http://localhost:3000/senhas.html**, onde vê, adiciona e apaga senhas.

> **Observação:** o CLI e a web compartilham o mesmo banco. Uma senha salva num aparece no outro.

---

## 6. A migração CLI → Web (a história)

### Como era no começo

No início, **tudo estava dentro do `index.js`**: o menu do terminal, os `prompt`, os
`console.log` **e** as chamadas ao MongoDB, tudo misturado numa função só. Por exemplo, salvar
uma senha era assim (versão antiga, tudo junto):

```js
const promptManageNewPassword = async () => {
    const source = prompt("enter name for password: ");     // interface: perguntar
    const password = prompt("enter password to save: ");    // interface: perguntar
    await passwordCollection.findOneAndUpdate(...)           // LÓGICA: salvar no banco
    console.log(`Password for ${source} has been saved!`)   // interface: avisar
    showMenu()                                               // interface: fluxo
};
```

### Por que isso é um problema para a web

O servidor web **não tem** `prompt` nem `console.log` de terminal. Ele coleta dados do
`request.body` (o corpo da requisição HTTP) e responde com JSON. Se a lógica de salvar estivesse
grudada nos `prompt`, o servidor não conseguiria reaproveitá-la — ele teria que **reescrever a
mesma coisa**. Isso é duplicação (o oposto de [DRY](#7-as-regras-de-projeto-os-princípios)).

### O que a migração fez

A migração foi um processo de **destilação**: pegar a lógica de dentro do CLI e movê-la para
módulos neutros, um assunto por arquivo.

| Assunto | Saiu de dentro do CLI | Foi para o módulo |
|---|---|---|
| Conexão com o banco | `index.js` | `db.js` |
| Senha-mestra (bcrypt) | `index.js` | `auth.js` |
| Senhas (ver/salvar/apagar) | `index.js` | `passwords.js` |

Depois disso, tanto o **CLI** (`index.js`) quanto o **servidor** (`server.js`) passaram a
**importar** essas funções. O CLI virou "só interface"; o servidor nasceu como "só interface"
também. A lógica ficou num lugar só.

### A regra que guiou cada mudança

Ao mover uma função para um módulo neutro, três coisas sempre aconteciam:

1. Ganhava **`export`** na frente (para poder ser importada).
2. O que era **global virava parâmetro** (ex.: `passwordCollection` deixou de ser uma variável
   solta e passou a ser um argumento que a função recebe).
3. **Saíam** os `console.log`, os `prompt` e o `showMenu` — porque isso é interface, não lógica.

---

## 7. As regras de projeto (os princípios)

Estes são os conceitos que guiaram **todas** as decisões. Vale decorar, porque valem para
qualquer projeto, não só este.

### 7.1. Separar lógica de interface

**Lógica** processa dados; **interface** conversa com o usuário. Elas vão em arquivos diferentes.
Assim, a mesma lógica serve o CLI e a web sem ser reescrita.

### 7.2. A lógica recebe os dados; ela não vai atrás deles

Uma função de lógica **não pergunta** nada ao usuário. Ela recebe tudo pronto, por parâmetro.
Quem coleta os dados é a interface:

```js
// LÓGICA (passwords.js): recebe source e password prontos
export const savePassword = async (passwordCollection, source, password) => { ... };

// INTERFACE decide de onde vêm os dados:
//   CLI       → dos prompt
//   servidor  → do request.body
```

Isso se chama **injeção de dependência por parâmetro**: em vez de a função buscar a coleção do
banco sozinha (variável global), ela **recebe** a coleção de quem a chama. Fica testável e
reutilizável.

### 7.3. Sem efeitos colaterais nos módulos de lógica

Um "efeito colateral" é algo que a função faz além de calcular/devolver — como abrir um `prompt`
ou imprimir na tela. Se `savePassword` chamasse `prompt`, o servidor tentaria abrir um prompt no
terminal ao salvar via web (um bug). Por isso a lógica **só** mexe nos dados e **devolve** o
resultado; mostrar/perguntar fica com a interface.

### 7.4. DRY — *Don't Repeat Yourself* (não se repita)

Escreva a regra **uma vez** e reutilize. A lógica de salvar existe **uma vez** (`savePassword`) e
é usada pelo CLI e pela web. Se um dia a regra mudar, muda num lugar só.

### 7.5. Módulos ESM: `import` / `export`

- **`export`** abre uma função para fora do arquivo.
- **`import`** traz uma função de outro arquivo.
- **`export` nomeado** (`export const x`) → importa com chaves: `import { x } from "./arq.js"`.
- **`export default`** → importa sem chaves: `import x from "./arq.js"`.
- No ESM, o caminho precisa do `./` e da **extensão** `.js`: `import { connectDB } from "./db.js"`.

### 7.6. Segurança embutida nas decisões

- **Nunca guardar a senha-mestra em texto puro** → ela é transformada em *hash* com `bcrypt`.
- **Nunca desenhar dados do usuário com `innerHTML`** → usa-se `textContent` (evita XSS).
- **A prova de "estar logado" mora no servidor**, não no navegador (sessão + cookie).

---

## 8. O back-end em detalhe

### 8.1. `db.js` — a conexão com o banco

```js
import { MongoClient } from "mongodb";
const dbUrl = "mongodb://localhost:27017"

const client = new MongoClient(dbUrl)

export const connectDB = async () => {
    await client.connect()
    const db = client.db("senhas_app");
    return {
        authCollection: db.collection("auth"),
        passwordCollection: db.collection("passwords"),
    };
};
```

**O que faz:** conecta no MongoDB e devolve **duas coleções** (tabelas, no vocabulário do Mongo):

- **`authCollection`** → guarda a senha-mestra (o documento com `type: "auth"`).
- **`passwordCollection`** → guarda as senhas dos serviços.

**Conceitos:**
- Uma **coleção** é um conjunto de **documentos** (objetos JSON). Cada senha é um documento
  `{ _id, source, password }`.
- `connectDB` é `async` porque falar com o banco leva tempo → quem chama usa `await`.
- Devolver `{ authCollection, passwordCollection }` de uma vez permite a quem chama pegar só o que
  precisa via **desestruturação**: `const { passwordCollection } = await connectDB()`.

### 8.2. `auth.js` — a senha-mestra com bcrypt

```js
import bcrypt from "bcrypt"

export const saveNewPassword = async (authCollection, password) => {
    const hash = bcrypt.hashSync(password, 10);
    await authCollection.insertOne({ "type": "auth", hash })
}

export const compareHashedPassword = async (authCollection, password) => {
    const { hash } = await authCollection.findOne({ "type": "auth" })
    return await bcrypt.compare(password, hash);
}
```

**O que faz:** cria e confere a senha de acesso ao app.

**Conceitos:**
- **Hash** é uma transformação de mão única: de `"1234"` sai algo como `"$2b$10$N9qo8u..."`.
  Não dá para voltar do hash para a senha. Por isso é seguro guardar o hash no banco.
- **`bcrypt.hashSync(password, 10)`** gera o hash. O `10` é o "custo" (quanto trabalho o
  computador faz — mais alto = mais seguro e mais lento).
- **`bcrypt.compare(senhaDigitada, hash)`** confere se a senha digitada bate com o hash guardado.
  Devolve `true`/`false`. Note que **não** existe "descriptografar" — só comparar.
- Assim como as outras, essas funções **recebem** `authCollection` por parâmetro (regra 7.2).

### 8.3. `passwords.js` — a lógica das senhas (CRUD)

```js
export const getPasswords = async (passwordCollection) => {
    return await passwordCollection.find({}).toArray();
}

export const savePassword = async (passwordCollection, source, password) => {
    await passwordCollection.findOneAndUpdate(
        { source },
        { $set: { password } },
        { returnDocument: "after", upsert: true }
    );
};

export const deletePassword = async (passwordCollection, source) => {
    await passwordCollection.deleteOne({ source });
};
```

Este arquivo é o coração da lógica de senhas. **CRUD** = **C**reate, **R**ead, **U**pdate,
**D**elete (criar, ler, atualizar, apagar).

**`getPasswords` (Read):**
- `find({})` → filtro vazio = "traga **tudo**".
- `find` devolve um **cursor** (um ponteiro preguiçoso), não a lista. O `.toArray()` percorre o
  cursor e monta o array de verdade.
- A função **retorna** os dados (não imprime) — mostrar é trabalho da interface.

**`savePassword` (Create + Update):**
- `findOneAndUpdate(filtro, atualização, opções)`.
- `{ source }` → o filtro: procura o documento com esse `source`. (`{ source }` é atalho de
  `{ source: source }`.)
- `{ $set: { password } }` → o operador `$set` muda **só** o campo `password`, sem apagar o resto.
- `upsert: true` → **up**date + in**sert**: se já existe, atualiza; se não existe, cria. Por isso
  um comando só cobre tanto o "criar" quanto o "atualizar".
- `returnDocument: "after"` → opção do driver (com "a" minúsculo; se escrevesse com maiúsculo, o
  Mongo ignoraria em silêncio).

**`deletePassword` (Delete):**
- `deleteOne({ source })` → apaga **um** documento cujo `source` bate com o filtro.

**Repare:** este arquivo **não importa nada** e não tem `console.log`/`prompt`. É lógica pura.

### 8.4. `index.js` — a interface CLI

O CLI é "só interface": ele pergunta com `prompt`, mostra com `console.log`, e delega a lógica
para os módulos. Trecho representativo:

```js
import { connectDB } from "./db.js";
import { saveNewPassword, compareHashedPassword } from "./auth.js";
import { getPasswords, savePassword } from "./passwords.js";
import promptModule from "prompt-sync"
const prompt = promptModule();

const viewPasswords = async () => {
    const passwords = await getPasswords(passwordCollection);   // LÓGICA (do módulo)
    passwords.forEach(({ source, password }, index) => {         // MOSTRAR (interface)
        console.log(`${index + 1}. ${source} => ${password}`);
    });
    showMenu()
};

const promptManageNewPassword = async () => {
    const source = prompt("enter name for password: ");          // COLETAR (interface)
    const password = prompt("enter password to save: ");
    await savePassword(passwordCollection, source, password);    // LÓGICA (do módulo)
    console.log(`Password for ${source} has been saved!`)
    showMenu()
};
```

E o "arranque" do programa, no fim do arquivo:

```js
const { authCollection, passwordCollection } = await connectDB();

// existe senha-mestra? "!!" transforma o resultado em true/false
const hasPasswords = !!(await authCollection.findOne({ type: "auth" }));

if (!hasPasswords) {
    promptNewPassword();   // primeira vez: cria a senha-mestra
} else {
    promptOldPassword();   // já existe: pede para digitar a senha-mestra
}
```

**Conceitos:**
- O menu (`showMenu`) usa um `switch` para tratar as opções 1–4.
- `promptOldPassword` usa um laço `while (!verified)` que repete até a senha bater.
- `process.exit()` encerra o programa (opção "Sair").
- **Lição de campo:** toda função que fala com o banco é `async` → precisa de `await`. Esquecer o
  `await` faz `getPasswords` devolver uma *Promise* em vez do array, e aí `.forEach` quebra com
  `passwords.forEach is not a function`.

### 8.5. `server.js` — a interface web (Fastify)

Este arquivo é o servidor HTTP. Ele faz três coisas: **serve os arquivos do front-end**, **liga
o sistema de sessão/cookie**, e **define as rotas da API**.

**Preparação (imports, plugins, conexão):**

```js
import { connectDB } from "./db.js";
import { compareHashedPassword } from "./auth.js";
import { getPasswords, savePassword, deletePassword } from "./passwords.js";
import Fastify from "fastify"
import fastifyStatic from "@fastify/static"
import fastifyCookie from "@fastify/cookie"
import fastifySession from "@fastify/session"
import path from "node:path";
import { fileURLToPath } from "node:url"

const app = Fastify();

// liga cookie e sessão (a ordem importa: cookie primeiro)
app.register(fastifyCookie)
app.register(fastifySession, {
    secret: "uma-frase-secreta-longa-com-no-minimo-32-caracteres",
    cookie: { secure: false },   // false porque localhost é HTTP, não HTTPS
})

const port = 3000;
const { authCollection, passwordCollection } = await connectDB()

// serve os arquivos estáticos de public/
const _dirname = path.dirname(fileURLToPath(import.meta.url));
app.register(fastifyStatic, {
    root: path.join(_dirname, "..", "public"),
});
```

**Pontos de atenção:**
- **`@fastify/cookie` antes de `@fastify/session`** — a sessão depende do cookie.
- **`secret`** precisa ter **≥ 32 caracteres**, senão o servidor nem sobe. Ele "assina" o cookie
  para ninguém falsificar.
- **`cookie: { secure: false }`** — com `true`, o navegador só manda o cookie por HTTPS; como
  `localhost` é HTTP, precisa ser `false` (em produção com HTTPS vira `true`).
- **`@fastify/static`** aponta para a pasta `public/`, então `http://localhost:3000/index.html`
  entrega o arquivo `public/index.html`, e `http://localhost:3000/` entrega o `index.html`.

**As rotas** (cada uma é explicada na [seção 10](#10-referência-das-rotas-da-api) e na
[seção 11](#11-o-ciclo-de-autenticação-sessão-e-cookie)):

```js
// LOGIN — confere a senha-mestra e "carimba a pulseira"
app.post("/api/login", async (request, reply) => {
    const { senha } = request.body;
    const ok = await compareHashedPassword(authCollection, senha)
    if (!ok) {
        return reply.code(401).send({ ok: false, mensagem: "senha incorreta" });
    }
    request.session.logado = true;                    // marca a sessão como logada
    return { ok: true, mensagem: "senha correta" };
});

// LISTAR — protegida
app.get("/api/passwords", async (request, reply) => {
    if (!request.session.logado) {
        return reply.code(401).send({ ok: false, mensagem: "faça login primeiro" });
    }
    const senhas = await getPasswords(passwordCollection);
    return senhas;                                    // Fastify converte o array em JSON
});

// SALVAR — protegida
app.post("/api/passwords", async (request, reply) => {
    if (!request.session.logado) {
        return reply.code(401).send({ ok: false, mensagem: "faça login primeiro" });
    }
    const { source, password } = request.body
    await savePassword(passwordCollection, source, password);
    return { ok: true, mensagem: "senha salva" };
});

// APAGAR — protegida
app.delete("/api/passwords", async (request, reply) => {
    if (!request.session.logado) {
        return reply.code(401).send({ ok: false, mensagem: "faça login primeiro" });
    }
    const { source } = request.body
    await deletePassword(passwordCollection, source);
    return { ok: true, mensagem: "senha apagada" }
});

// LOGOUT — joga a pulseira fora
app.post("/api/logout", async (request, reply) => {
    request.session.destroy();
    return { ok: true, mensagem: "deslogado" };
});

await app.listen({ port });
console.log(" servidor on em http://localhost:3000");
```

**Conceitos de rota:**
- **`app.post` / `app.get` / `app.delete`** são os **verbos HTTP**. Cada verbo carrega uma
  intenção: `GET` = "me dê dados", `POST` = "estou enviando dados", `DELETE` = "apague".
- **`request`** é o pedido que chegou (tem `request.body`, `request.session`, etc.).
- **`reply`** é a resposta que você monta. `reply.code(401)` define o *status* HTTP.
- **`request.body`** é o corpo enviado pelo front (já convertido de JSON para objeto).
- **Retornar um objeto/array** faz o Fastify **serializar automaticamente para JSON**.
- As rotas são "fininhas": elas só traduzem HTTP → chamada de função da lógica. Toda a regra de
  negócio está nos módulos.

---

## 9. O front-end em detalhe

O front-end são os arquivos de `public/`. O navegador baixa o HTML e o JS e os executa **na
máquina do usuário**. O JS conversa com o servidor via `fetch`.

### 9.1. `index.html` + `config.js` — a tela de login

**HTML:**

```html
<h1>digite sua senha de acesso</h1>
<form id="form">
    <label for="source-senha">senha: </label>
    <input type="password" id="source-senha">
    <button type="submit" id="botao">salvar</button>
</form>
<h2 id="mensagem"></h2>
<script src="config.js"></script>
```

**JS (`config.js`):**

```js
const form = document.getElementById("form")
const mensagem = document.getElementById("mensagem");
const input = document.getElementById("source-senha");

form.addEventListener("submit", async (event) => {
    event.preventDefault()                       // impede o form de recarregar a página

    const senha = input.value                    // .value = o texto digitado

    const resposta = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),         // objeto vira texto JSON
    });

    const dados = await resposta.json();         // texto JSON vira objeto
    mensagem.textContent = dados.mensagem;

    if (dados.ok) {
        window.location.href = "senhas.html";    // login certo → vai para as senhas
    }
});
```

**Conceitos:**
- **`document.getElementById("...")`** pega um elemento do HTML pelo seu `id`.
- **`addEventListener("submit", ...)`** roda uma função quando o formulário é enviado.
- **`event.preventDefault()`** impede o comportamento padrão do form (recarregar a página).
- **elemento vs `.value`**: `getElementById` te dá a **caixinha** `<input>`; para pegar o texto
  digitado, use **`.value`**.
- **`fetch(url, opções)`** faz uma requisição HTTP a partir do navegador.
- **`JSON.stringify(obj)`** transforma um objeto JS em texto JSON (para enviar).
- **`resposta.json()`** faz o caminho inverso: texto JSON → objeto JS (para ler).
- **await duplo:** um `await` no `fetch` (esperar a resposta chegar) e outro no `.json()` (esperar
  ler o corpo).
- **`window.location.href = "..."`** navega o navegador para outra página (redirecionamento).

### 9.2. `senhas.html` + `senhas.js` — a tela das senhas

**HTML:**

```html
<h1>Minhas senhas</h1>
<button id="logout">encerrar sessão</button>

<form id="form">
    <input type="text" placeholder="nome" id="source">
    <input type="password" name="password" placeholder="senha" id="senha">
    <button type="submit">salvar</button>
</form>

<ul id="lista"></ul>
<script type="module" src="senhas.js"></script>
```

> Repare no **`type="module"`** no `<script>`. Isso é obrigatório aqui porque o `senhas.js` usa
> `await` no **topo** do arquivo (fora de qualquer função). No navegador, `await` no topo só é
> permitido em **módulos**. (No `config.js` não precisa, porque lá o `await` está dentro da função
> do `addEventListener`.)

**JS (`senhas.js`) — parte 1: listar e apagar:**

```js
const form = document.getElementById("form")
const lista = document.getElementById("lista")
const inputsenha = document.getElementById("senha")
const inputsource = document.getElementById("source")

const respostas = await fetch("/api/passwords")

if (!respostas.ok) {
    window.location.href = "/"                    // 401 (sem sessão) → volta pro login
} else {
    const senha = await respostas.json()

    senha.forEach(({ source, password }) => {
        const li = document.createElement("li");
        li.textContent = `${source} => ${password}`;

        const botao = document.createElement("button");
        botao.textContent = "apagar"
        botao.addEventListener("click", async () => {
            await fetch("/api/passwords", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source }),  // cada botão "lembra" o seu source
            });
            location.reload()                      // recarrega para atualizar a lista
        });

        li.appendChild(botao)
        lista.appendChild(li);
    });
}
```

**JS (`senhas.js`) — parte 2: salvar e sair:**

```js
form.addEventListener("submit", async (event) => {
    event.preventDefault()
    const source = inputsource.value
    const password = inputsenha.value;
    await fetch("/api/passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, password }),
    });
    location.reload();
});

const botaoLogout = document.getElementById("logout");
botaoLogout.addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
});
```

**Conceitos:**
- **`respostas.ok`** é `true` para respostas de sucesso (status 200–299) e `false` para erro
  (como o 401). É o jeito limpo de perguntar "deu certo?". Se não deu, redireciona para o login.
- **Construir a lista com o DOM:** `document.createElement("li")` cria o elemento; `textContent`
  põe o texto; `appendChild` pendura o elemento na página.
- **`textContent` em vez de `innerHTML`:** `textContent` trata o conteúdo como **texto puro**.
  Se uma senha tivesse `<script>`, com `innerHTML` esse script **rodaria** (ataque **XSS**); com
  `textContent`, não. Segurança por padrão.
- **Closure (o detalhe esperto do botão):** cada botão "apagar" é criado **dentro** de uma volta
  do `forEach`, então ele "lembra" o `source` **daquela** senha. Por isso o botão da linha do
  `gmail` apaga o `gmail`, e não outro. Uma função criada dentro de um escopo "carrega" as
  variáveis daquele escopo — isso é uma **closure**.
- **`location.reload()`** recarrega a página. É um jeito simples (embora "na marra") de atualizar
  a lista depois de salvar/apagar: ao recarregar, o código de listar roda de novo com os dados
  atualizados.

---

## 10. Referência das rotas da API

| Método | Rota | Precisa login? | Recebe (body) | Devolve |
|---|---|:---:|---|---|
| `POST` | `/api/login` | não | `{ senha }` | `{ ok, mensagem }` (+ cookie de sessão se acertar) |
| `GET` | `/api/passwords` | **sim** | — | array de `{ _id, source, password }` |
| `POST` | `/api/passwords` | **sim** | `{ source, password }` | `{ ok, mensagem }` |
| `DELETE` | `/api/passwords` | **sim** | `{ source }` | `{ ok, mensagem }` |
| `POST` | `/api/logout` | não | — | `{ ok, mensagem }` (destrói a sessão) |
| `GET` | `/`, `/index.html`, `/senhas.html`, `/config.js`, `/senhas.js` | não | — | os arquivos de `public/` (via `@fastify/static`) |

**Códigos de status usados:**
- **200** (implícito ao retornar um objeto) → deu certo.
- **401** (`reply.code(401)`) → não autorizado (senha errada ou sem sessão).

**Contratos (o "combinado" entre front e back):**
- Login: front envia `{ senha }`; back responde `{ ok, mensagem }`.
- Senhas: `GET` devolve um array; `POST` e `DELETE` recebem os dados no body e respondem
  `{ ok, mensagem }`.

---

## 11. O ciclo de autenticação (sessão e cookie)

Este é o conceito mais denso do projeto. A analogia do **guarda-volumes / pulseira** ajuda.

### O problema: o HTTP tem "amnésia"

Cada requisição HTTP é independente. O servidor **não lembra** que você acertou a senha há cinco
segundos. Para ele, todo pedido é de um estranho. Sessão + cookie resolvem isso.

### As peças

- **Cookie** = um pedacinho de texto que o navegador **guarda** (amarrado ao site) e **reenvia
  sozinho** em todo pedido. No projeto, o cookie guarda só um **id de sessão** (ex.: `sessionId`).
- **Sessão** = uma "gaveta" de dados do **lado do servidor**, identificada por aquele id. Os dados
  de verdade (`{ logado: true }`) ficam no servidor, não no navegador.

### A analogia 🎟️

- Você deixa a mochila (os **dados**: `logado: true`) no balcão → fica **com o servidor**.
- Ganha uma **ficha com um número** (o **cookie** `sessionId`) → a ficha **não** tem a mochila,
  só o número.
- Ao voltar, mostra a ficha; o servidor usa o número para achar a mochila.

**Frase-chave:** *o cookie carrega só o número; os dados moram no servidor.*

### O fluxo completo

1. **Login** (`POST /api/login`): você envia a senha. O servidor confere com `bcrypt`.
2. Senha certa → o código faz `request.session.logado = true` (escreve na gaveta).
3. Como a sessão mudou, o `@fastify/session`:
   - gera um `sessionId` único,
   - guarda `{ logado: true }` no servidor sob esse id,
   - manda um `Set-Cookie: sessionId=...` na resposta.
4. O navegador **guarda o cookie** e, a partir daí, o **reenvia automaticamente** em todo pedido.
5. **Rotas protegidas** (`/api/passwords`): o servidor lê o cookie, acha a sessão, e o
   `if (!request.session.logado)` deixa passar. Sem cookie válido → **401**.
6. **Logout** (`POST /api/logout`): `request.session.destroy()` **joga a mochila fora** (apaga a
   sessão no servidor). A ficha velha que sobrar no navegador não vale mais nada.

### Por que os dados ficam no servidor (segurança)

Se `logado: true` ficasse **no cookie**, o usuário poderia abrir o F12 e trocar para `true` sem
saber a senha. Guardando no **servidor** e mandando só o **número da ficha** (ainda por cima
**assinado** com o `secret`), ninguém falsifica o acesso. É por isso que, mesmo com o cookie ainda
visível no navegador **depois do logout**, você continua bloqueado: a mochila no servidor foi
destruída.

### Detalhe prático: sessões em memória

Por padrão, o `@fastify/session` guarda as sessões **na memória** do servidor. Então **reiniciar o
servidor "esquece" todo mundo** — todos precisam logar de novo. (Em produção, usa-se um
armazenamento externo, como Redis, para as sessões sobreviverem a reinícios.)

---

## 12. Glossário de conceitos

| Termo | O que é |
|---|---|
| **CLI** | *Command-Line Interface*. Programa usado pelo terminal. |
| **GUI / Web** | Interface gráfica. Aqui, as telas no navegador. |
| **Node.js** | Ambiente que roda JavaScript no back-end. |
| **ESM** | *ECMAScript Modules*: o sistema de `import`/`export`. Ligado por `"type":"module"`. |
| **`export` nomeado / default** | Nomeado importa com `{ }`; default importa sem `{ }`. |
| **top-level await** | `await` fora de função, no topo do arquivo. Só em módulos ESM. |
| **MongoDB** | Banco de dados de documentos (objetos JSON). |
| **coleção / documento** | Coleção = tabela; documento = uma linha (objeto JSON). |
| **cursor** | Ponteiro preguiçoso de um `find`; vira lista com `.toArray()`. |
| **CRUD** | Create, Read, Update, Delete. |
| **upsert** | Update + insert: atualiza se existe, cria se não existe. |
| **`$set`** | Operador do Mongo que altera só os campos indicados. |
| **hash / bcrypt** | Transformação de mão única da senha; segura para guardar. |
| **Fastify** | Framework web do Node usado no servidor. |
| **rota** | Combinação de verbo + caminho (ex.: `POST /api/login`). |
| **verbo HTTP** | `GET` (ler), `POST` (enviar), `DELETE` (apagar). |
| **`request` / `reply`** | O pedido que chega / a resposta que você monta. |
| **status HTTP** | Código do resultado: 200 = ok, 401 = não autorizado. |
| **JSON** | Formato de texto para trocar dados. `stringify` ↔ `parse`/`.json()`. |
| **`fetch`** | Função do navegador para fazer requisições HTTP. |
| **DOM** | A árvore de elementos da página. Manipulada com `createElement`, `appendChild`, etc. |
| **`textContent` vs `innerHTML`** | Texto puro (seguro) vs HTML interpretado (pode causar XSS). |
| **XSS** | *Cross-Site Scripting*: injeção de script malicioso via conteúdo não tratado. |
| **closure** | Função que "lembra" as variáveis do escopo onde foi criada. |
| **cookie** | Texto guardado pelo navegador e reenviado automaticamente. |
| **sessão** | Dados do usuário guardados no servidor, ligados a um id. |
| **DRY** | *Don't Repeat Yourself*: não repita regra; escreva uma vez, reutilize. |
| **efeito colateral** | Ação além de calcular/devolver (ex.: imprimir, perguntar). |

---

## 13. Dívidas técnicas e próximos passos

Coisas conhecidas que ainda podem melhorar (ótimos exercícios de estudo):

- **Senhas guardadas em texto puro.** As senhas dos serviços estão no banco **sem criptografia**.
  O ideal seria criptografia **reversível** (diferente do hash da senha-mestra, que é de mão
  única, porque a senha do serviço precisa ser lida de volta).
- **Checagem de login repetida.** O `if (!request.session.logado)` está copiado nas três rotas.
  Dá para juntar num "porteiro" único usando um **hook `preHandler`** do Fastify (aplica a mesma
  verificação a várias rotas sem repetir).
- **Atualizar a tela sem recarregar.** Hoje, salvar/apagar usa `location.reload()`. Uma versão
  mais elegante adicionaria/removeria só o `<li>` afetado, sem recarregar a página inteira.
- **Faxina.** Renomear `public/config.js` para algo como `login.js` (o nome atual é enganoso) e
  remover eventuais arquivos de rascunho.
- **Nomes consistentes no front.** No `senhas.js`, a variável que recebe o array chama-se `senha`
  (singular); `senhas` seria mais descritivo para uma lista.

---

*Documento gerado a partir do código real do projeto, para fins de estudo dos conceitos de
back-end e front-end aplicados na migração de CLI para Web.*
