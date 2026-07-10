import Fastify from "fastify"
import fastifyStatic from "@fastify/static"
import path from "node:path";
import { fileURLToPath } from "node:url"
const app = Fastify();
const port = 3000;

const _dirname = path.dirname(fileURLToPath(import.meta.url));
app.register (fastifyStatic, {
    root: path.join(_dirname, "..", "public"),
});
app.get("/", async (request, reply) => {
    return "servidor online!";
});

await app.listen({port});
console.log(" servidor on em http://localhost:3000");