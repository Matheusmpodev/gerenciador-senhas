import bcrypt from "bcrypt";
import promptModule from "prompt-sync"
const prompt = promptModule();


const saveNewPassword = async (password) => 
{
    const hash = bcrypt.hashSync(password, 10);
    await authCollection.insertOne({"type": "auth", hash})//mesma coisa de ({"type": "auth", hash: hash})
    console.log("sua senha foi salva");
    showMenu();
}

const compareHashedPassword = async (password) => 
    {
        const { hash } = await authCollection.findOne({ "type": "auth"})
        return await bcrypt.compare(password, hash);
    }

const promptNewPassword = () => 
    {
        const response = prompt("digite sua senha de acesso nova: ");
        return saveNewPassword(response);
    }

const promptOldPassword = async () => 
    {
            let verified = false;
            while (!verified) 
                {
                    const response = prompt("digite sua senha de acesso: ");
                    const result = await compareHashedPassword(response);
                    if (result) 
                        {
                            console.log("senha correta.")
                            verified = true;
                            showMenu();
                        } else {
                            console.log("senha incorreta, tente novamente");
                        };
                };
            
    }; 

    const showMenu = async () => 
        {
            console.log(`
            1. Ver senhas
            2. Salvar nova senha
            3. Verificar senha
            4. Sair    
                `);
            const response = prompt(">")

            switch(response) {
                case "1": 
                    await viewPasswords();
                    break;
                case "2":
                    await promptManageNewPassword();
                    break;
                case "3":
                    await promptOldPassword();
                    break;
                case "4":
                    process.exit()
                default:
                    console.log(`resposta invalida`);
                    await showMenu();
            }
        };

        const viewPasswords = async () => 
            {
                const passwords = await passwordCollection.find({}).toArray();
                passwords.forEach(({ source, password },index)=> {
                    console.log(`${index + 1}. ${source} => ${password}`);
                });
                showMenu()
            };

        const promptManageNewPassword = async () => {
            const source = prompt("enter name for password: ");
            const password = prompt("enter password to save: ");

            await passwordCollection.findOneAndUpdate(
                { source },
                { $set: { password } },
                {
                    ReturnDocument: "after",
                    upsert: true,  
                }
         );
         console.log(`Password for ${source} has been saved!`)
         showMenu()
        };

    import { MongoClient, ReturnDocument } from "mongodb";
    const dbUrl = "mongodb://localhost:27017";
    const client = new MongoClient(dbUrl);
    let hasPasswords = false
    let passwordCollection, authCollection;
    const dbName = "senhas_app";
    
    const main = async () => {
        try {
            await client.connect()
            console.log("Connected successfully to server");
            const db = client.db(dbName);
            authCollection = db.collection("auth");
            passwordCollection = db.collection("passwords");
            const hashedPassword = await authCollection.findOne({type: "auth" });
            hasPasswords = !!hashedPassword;
        } catch (error) {
            console.error("Erro na conexão do database:", error);
            process.exit(1);
        }
    }

    await main();
    if (!hasPasswords) {
        promptNewPassword();
    } else {promptOldPassword()}