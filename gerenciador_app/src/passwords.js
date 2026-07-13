export const getPasswords = async (passwordCollection) => 
    {
        return await passwordCollection.find({}).toArray();
    }

export const savePassword = async (passwordCollection, source, password) => 
    {
        await passwordCollection.findOneAndUpdate(
            { source },
            { $set: { password } },
            { returnDocument: "after", upsert: true }
        );
    };

export const deletePassword = async (passwordCollection, source) => {
    await passwordCollection.deleteOne({ source });
};