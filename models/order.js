const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  orderNo: Number,
  customerID: {
    type: String,
    required: true,
  },
  vendorID: String,
  snacks: [
    {
      ID: {
        type: String,
        required: true,
      },
      quantity: {
        type: String,
        required: true,
      },
    },
  ],
  orderTime: Date,
  remainTime: String,
  remainTimeUntilDiscount: String,
  timeDisplay: String,
  discount: Boolean,
  orderStatus: String,
  rate: String,
  comment: String,
});

/* make model available to other files 
   compile the schema into a model */
module.exports = mongoose.model("Order", orderSchema);
