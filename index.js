// for database login details
require("dotenv").config();

module.exports = (app) => {

const mongoose = require("mongoose");

if (process.env.NODE_ENV == "test"){
  // we are doing unit testing, run on local mock server
  dbAddress = "mongodb://localhost:27017/Snacks-in-a-van";
} else {
  // running the actualy site, connect to MongoDB Atlas
  CONNECTION_STRING =
    "mongodb+srv://<username>:<password>@cluster0.lpfxj.mongodb.net/Snacks-in-a-van?retryWrites=true&w=majority";
  dbAddress = CONNECTION_STRING.replace(
    "<username>",
    process.env.MONGO_USERNAME
  ).replace("<password>", process.env.MONGO_PASSWORD);
}

mongoose.connect(dbAddress, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  dbName: "Snacks-in-a-van",
});

const db = mongoose.connection;

db.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

db.once("open", async () => {
  app.emit("DBready");    // this line lets us signal when the DB is ready
  console.log("Connected to " + dbAddress);
});

}
