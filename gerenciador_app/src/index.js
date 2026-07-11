import { connectDB } from "./db.js";
import { saveNewPassword, compareHashedPassword } from "./auth.js";  
import promptModule from "prompt-sync"
const prompt = promptModule();


const promptNewPassword = async () => 
    {
        const response = prompt("digite sua senha de acesso nova: ");
        await saveNewPassword(authCollection, response);
        console.log("sua senha foi salva")
        showMenu()
    }

const promptOldPassword = async () => 
    {
            let verified = false;
            while (!verified) 
                {
                    const response = prompt("digite sua senha de acesso: ");
                    const result = await compareHashedPassword(authCollection, response);
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

    
    const { authCollection, passwordCollection } = await connectDB();

    const hasPasswords = !!(await authCollection.findOne({ type: "auth" }));

    if (!hasPasswords) {
        promptNewPassword();
    } else {promptOldPassword()}