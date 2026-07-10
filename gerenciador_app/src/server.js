import { connectDB } from "./db.js";
import { compareHashedPassword } from "./auth.js";
import Fastify from "fastify"
import fastifyStatic from "@fastify/static"
import path from "node:path";
import { fileURLToPath } from "node:url"
const app = Fastify();
const port = 3000;
const { authCollection } = await connectDB()

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

await app.listen({port});
console.log(" servidor on em http://localhost:3000");
