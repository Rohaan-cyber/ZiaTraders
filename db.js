const dotenv = require('dotenv')
dotenv.config()
const { MongoClient } = require('mongodb')

const client = new MongoClient(process.env.CONNECTIONSTRING)
let db

async function connectToDb() {
    if (!db) {
        await client.connect()
        db = client.db() // use default DB from URI
        console.log("✅ Connected to MongoDB")
    }
    return db
}

function getDb() {
    if (!db) throw new Error("❌ Database not connected yet!")
    return db
}

module.exports = { connectToDb, getDb }
