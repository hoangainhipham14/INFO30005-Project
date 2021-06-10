const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const snackSchema = new Schema({
  name: String,
  price: String,
  photo: String,
});

/* make model available to other files 
   compile the schema into a model */
module.exports = mongoose.model("Snack", snackSchema);
