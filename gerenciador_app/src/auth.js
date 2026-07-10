import bcrypt from "bcrypt"

export const saveNewPassword = async (authCollection, password) => 
    {
        const hash = bcrypt.hashSync(password, 10);
        await authCollection.insertOne({"type": "auth", hash})
    }

export const compareHashedPassword = async (authCollection, password) => 
    {
        const { hash } = await authCollection.findOne({"type": "auth"})
        return await bcrypt.compare(password, hash);
    }