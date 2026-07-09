import Fastify from "fastify"
const app = Fastify();
const port = 3000;

app.get("/", async (request, reply) => {
    return "servidor online!";
});

await app.listen({port});
console.log(" servidor on em http://localhost:3000");