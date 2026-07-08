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
        await bcrypt.compare(password, mockDB.hash);
    }

const promptNewPassword = () => 
    {
        const response = prompt("digite sua senha de acesso nova");
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
                            console.log("Password verified.")
                            verified = true;
                            showMenu();
                        } else {
                            console.log("senha incorreta, tente novamente");
                        };
                };
            
    }; 