import { connectDB } from "./db.js";
import { compareHashedPassword } from "./auth.js";
import { getPasswords, savePassword } from "./passwords.js";
import { deletePassword } from "./passwords.js"
import Fastify from "fastify"
import fastifyStatic from "@fastify/static"
import path from "node:path";
import { fileURLToPath } from "node:url"
const app = Fastify();
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
    return { ok: true, mensagem: "senha correta" };
});

app.get("/api/passwords", async (request, reply) => {
    const senhas = await getPasswords(passwordCollection);
    return senhas;
});

app.post("/api/passwords", async (request, reply) => {
    const { source, password } = request.body
    await savePassword(passwordCollection, source,  password);
    return { ok: true, mensagem: "senha salva"};
})

app.delete("/api/passwords", async (request, reply) => {
    const { source } = request.body
    await deletePassword(passwordCollection, source);
    return { ok: true, mensagem: "senha apagada" }
})

await app.listen({port});
console.log(" servidor on em http://localhost:3000");
