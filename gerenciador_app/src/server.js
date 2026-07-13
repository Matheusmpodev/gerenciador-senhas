import { connectDB } from "./db.js";
import { compareHashedPassword } from "./auth.js";
import { getPasswords, savePassword } from "./passwords.js";
import { deletePassword } from "./passwords.js"
import Fastify from "fastify"
import fastifyStatic from "@fastify/static"
import path from "node:path";
import { fileURLToPath } from "node:url"
import fastifyCookie from "@fastify/cookie"
import fastifySession from "@fastify/session"

const app = Fastify();
app.register(fastifyCookie)
app.register(fastifySession, {
    secret: "frase-secreta-para-iniciar-o-servidor-que-tem-que-ter-no-minimo-trinta-e-dois-caracteres",
    cookie: {secure: false},
})

const port = 3000;
const { authCollection, passwordCollection } = await connectDB()

const _dirname = path.dirname(fileURLToPath(import.meta.url));
app.register (fastifyStatic, {
    root: path.join(_dirname, "..", "public"),
});

app.post("/api/login", async (request, reply) => {
    const { senha } = request.body;
    const ok = await compareHashedPassword(authCollection, senha)

    if (!ok) {
        return reply.code(401).send({ ok: false, mensagem: "senha incorreta" });
    }
    request.session.logado = true;
    return { ok: true, mensagem: "senha correta" };
});

app.get("/api/passwords", async (request, reply) => {

    if (!request.session.logado) {
        return reply.code(401).send({ ok: false, mensagem: "faça login primeiro" });
    }
    const senhas = await getPasswords(passwordCollection);
    return senhas;
});

app.post("/api/passwords", async (request, reply) => {
    if (!request.session.logado) {
        return reply.code(401).send({ ok: false, mensagem: "faça login primeiro" });
    }


    const { source, password } = request.body
    await savePassword(passwordCollection, source,  password);
    return { ok: true, mensagem: "senha salva"};
})

app.delete("/api/passwords", async (request, reply) => {
    if (!request.session.logado) {
        return reply.code(401).send({ ok: false, mensagem: "faça login primeiro" });
    }


    const { source } = request.body
    await deletePassword(passwordCollection, source);
    return { ok: true, mensagem: "senha apagada" }
})

app.post("/api/logout", async (request, reply) => {
    request.session.destroy();
    return { ok: true, mensagem: "deslogado" };
});



await app.listen({port});
console.log(" servidor on em http://localhost:3000");
