// for database login details
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');

module.exports = (app) => {

  if (process.env.NODE_ENV == "test") {
    // we are doing unit testing, run on local mock server
    dbAddress = "mongodb://localhost:27017/Snacks-in-a-van";
  } else {
    // running the actualy site, connect to MongoDB Atlas
    CONNECTION_STRING = "mongodb+srv://<username>:<password>@cluster0.0dbcfz4.mongodb.net/Snacks-in-a-van?retryWrites=true&w=majority&ssl=true";
    dbAddress = CONNECTION_STRING.replace("<username>", process.env.USERNAME).replace("<password>", process.env.PASSWORD);
  }

  const client = new MongoClient(dbAddress, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
      useUnifiedTopology: true
    }
  });

  async function connectDB() {
    try {
      await client.connect();
      console.log("DB has been connected");
    } catch (error) {
      console.log("Error connecting to the database:", error);
      process.exit(1);
    } finally {
      await client.close();
    }
  }

  connectDB();
}