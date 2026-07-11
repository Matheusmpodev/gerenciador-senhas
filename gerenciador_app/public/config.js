const form = document.getElementById("form")
const mensagem = document.getElementById("mensagem");
const input = document.getElementById("source-senha");

form.addEventListener("submit", async (event) => {
    event.preventDefault()

    
const senha = input.value 

const resposta = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senha }),
});

const dados = await resposta.json();

mensagem.textContent = dados.mensagem;
});