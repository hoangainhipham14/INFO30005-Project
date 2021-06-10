const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

const vendorSchema = new Schema({
  password: {
    type: String,
    required: true,
  },
  vanName: {
    type: String,
    required: true,
    unique: true,
  },
  ready: {
    type: Boolean,
    required: true,
    default: false,
  },
  locationString: {
    type: String,
    required: false,
  },
  /* set up for GeoJSON: https://stackoverflow.com/a/32200007 */
  loc: {
    type: { type: String },
    coordinates: [Number],
  },

  timeLimit: String,
});


vendorSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

vendorSchema.methods.validPassword = function(password) {
  /* arrow function changes 'this'! */
  /* second item is the hash */
  return bcrypt.compareSync(password, this.password);
}


/* make model available to other files 
   compile the schema into a model */
module.exports = mongoose.model("Vendor", vendorSchema);
