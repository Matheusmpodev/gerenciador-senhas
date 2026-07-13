const form = document.getElementById("form")
const lista = document.getElementById("lista")
const inputsenha = document.getElementById("senha")
const inputsource = document.getElementById("source")


const respostas = await fetch("/api/passwords")

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
            body: JSON.stringify({ source }),  
        });
        location.reload()
    });
    
    li.appendChild(botao)
    lista.appendChild(li);
});

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
})