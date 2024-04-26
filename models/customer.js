const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const customerSchema = new Schema({
  password: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  givenName: {
    type: String,
    required: true,
  },

  familyName: {
    type: String,
    required: true,
  },
});

customerSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

customerSchema.methods.validPassword = function(password) {
  /* arrow function changes 'this'! */
  /* second item is the hash */
  return bcrypt.compareSync(password, this.password);
}

/* make model available to other files 
   compile the schema into a model */
module.exports = mongoose.model("Customer", customerSchema);
