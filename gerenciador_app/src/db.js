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