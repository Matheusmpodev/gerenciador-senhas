import bcrypt from "bcrypt";
import promptModule from "prompt-sync"
const prompt = promptModule();
const mockDB = { passwords: {}};

const saveNewPassword = (password) => 
{
    mockDB.hash = bcrypt.hashSync(password, 10);
    console.log("sua senha foi salva");
    showMenu();
}

const compareHashedPassword = async (password) => 
    {
        return await bcrypt.compare(password, mockDB.hash);
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

            if (response === "1") viewPasswords();
            else if (response === "2") promptManageNewPassword();
            else if (response === "3") promptOldPassword();
            else if (response === "4") process.exit();
            else {
                console.log(`That' s an invalid response.`);
                showMenu();
            }
        };

        const viewPasswords = () => 
            {
                const {passwords} = mockDB;
                Object.entries(passwords).forEach(([key, value], index) => {
                    console.log(`${index + 1}. ${key} => ${value}`);
                });
                showMenu()
            }

        const promptManageNewPassword = () => {
            const source = prompt("enter name for password: ");
            const password = prompt("enter password to save: ");

            mockDB.passwords[source] = password;
            console.log(`Password for ${source} has been saved!`);
            showMenu()
        };

        if (!mockDB.hash) 
            {
            promptNewPassword()
            } else 
                {
                    promptOldPassword();
                }