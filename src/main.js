const sdk = require('node-appwrite');

module.exports = async function (context) {
    const client = new sdk.Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(context.req.headers['x-appwrite-key'] || process.env.API_KEY); 

    const databases = new sdk.Databases(client);

    // Hidden internal IDs
    const DATABASE_ID = '697f9f61003677e2c3b7';
    const COLLECTION_ID = 'samplingplan';

    try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
        return context.res.json(response);
    } catch (err) {
        return context.res.json({ error: err.message }, 500);
    }
};