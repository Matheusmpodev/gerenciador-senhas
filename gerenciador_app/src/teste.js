import { connectDB } from "./db.js" // o ./ mostra que é pacote seu e nn npm e que é na mesma pasta

const { authCollection, passwordCollection } = await connectDB()

console.log(`senhas salvas: ${await passwordCollection.countDocuments()}`)
console.log(`senhas mestras: ${await authCollection.countDocuments()}`)

process.exit(0)