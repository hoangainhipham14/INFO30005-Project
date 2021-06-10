var ObjectId = require("mongodb").ObjectId;
const Order = require("../models/order");
const Customer = require("../models/customer");
const Vendor = require("../models/vendor");
const Snack = require("../models/snack");

// rate experience
const rateExperience = (req, res) => {
  // check if order no in request
  if (req.body.orderNo == undefined) {
    return res.status(400).json({ msg: "Missing order number" });
  }

  Order.findOne({ orderNo: req.body.orderNo })
    .then((order) => {
      // check if rate is in request
      if (req.body.rate == undefined) {
        return res.status(400).json({ msg: "Missing rate" });
      }

      // check if rate is from 1-5
      if (req.body.rate > 5) {
        return res.status(400).json({ msg: "rating has to range from 1-5" });
      }

      // if order status is "Picked up", allow customer rate
      if (order.orderStatus == "Picked up") {
        order.rate = req.body.rate;

        // if comment is in request, store in DB
        // it's optional
        if (req.body.comment != undefined) {
          order.comment = req.body.comment;
        }

        order.save();
        return res.status(200).send(order);
      } else {
        // send msg to remind customers rate after pick up
        return res.status(400).send({ msg: "Rate after pick up" });
      }
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
};

// update order to remove/add snacks, increase/decrease quantity, cancel order
const updateOrder = (req, res) => {
  // check if order no in request
  if (req.body.orderNo == undefined) {
    return res.status(400).json({ msg: "Missing order number" });
  }

  // check if vendor ID in request
  if (req.body.vendorID == undefined) {
    return res.status(400).json({ msg: "Missing vendor ID" });
  }

  Order.findOne({ orderNo: req.body.orderNo })
    .then((order) => {
      Vendor.findOne({ _id: req.body.vendorID }).then((vendor) => {
        var date = new Date();
        order.remainTime =
          vendor.timeLimit -
          Math.floor(
            (date.getTime() - order.orderTime.getTime()) / (60 * 1000)
          );

        if (
          order.remainTime <= 0 ||
          order.orderStatus == "fulfilled" ||
          order.orderStatus == "Fulfilled"
        ) {
          order.discount = true;
          order.remainTime = 0;
          order.save();
          return res.status(400).json({
            msg: "No longer be able to change order",
          });
        }

        // check if snacks in request
        if (req.body.snacks != undefined) {
          // update snacks
          order.snacks = req.body.snacks;
        }

        // check if orderStatus is in request
        if (req.body.orderStatus != undefined) {
          // update order status
          order.orderStatus = req.body.orderStatus;
          // update remaining time until discount
          order.remainTimeUntilDiscount = 15;
          order.discount = false;
        } else {
          return res.status(400).json({
            msg: "Missing order status",
          });
        }

        // update order time
        order.orderTime = new Date();
        order.save();
        return res.status(200).send(order);
      });
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
};

// allow vendor to update order status
// protected by Vendor's JWT, though we don't actually access it.
// Should we have a check to ensure that the order belogns to the vendor?
const updateOrderStatus = (req, res) => {
  // check if order no in request
  if (req.body.orderNo == undefined) {
    return res.status(400).json({ msg: "Missing order number" });
  }

  Order.findOne({ orderNo: req.body.orderNo })
    .then((order) => {
      if (order.vendorID != req.user._id) {
        return res
          .status(401)
          .json({ msg: "You can't change another vendor's order status" });
      }

      // check if orderStatus is in request
      if (req.body.orderStatus != undefined) {
        // update order status
        order.orderStatus = req.body.orderStatus;
      } else {
        return res.status(400).json({
          msg: "Missing order status",
        });
      }

      order.save();
      return res.status(200).send(order);
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
};

// show a specific order
const findOrder = (req, res) => {
  // check if order no in request
  if (req.body.orderNo == undefined) {
    return res.status(400).json({ msg: "Missing order number" });
  }

  Order.findOne({ orderNo: req.body.orderNo })
    .then((order) => {
      const timeUntilDiscount = 15;
      var date = new Date();
      order.remainTimeUntilDiscount =
        timeUntilDiscount -
        Math.floor((date.getTime() - order.orderTime.getTime()) / (60 * 1000));
      order.remainTime = order.remainTimeUntilDiscount;

      if (order.remainTime <= 0) {
        order.remainTime = 0;
      }

      if (order.remainTimeUntilDiscount <= 0) {
        // record discount
        order.discount = true;
        order.remainTimeUntilDiscount = 0;
        order.save();
      }
      return res.status(200).send(order);
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
};

//  View each order
const findSnackOrder = (req, res) => {
  Snack.findOne({ _id: req.query.id })
    .then((snack) => {
      console.log(snack);
      return res.send(snack);
    })
    .catch((err) => {
      console.log(err);
      return res.send(err);
    });
};

//  Show list of all outstanding orders for logged in customer
const findOutstanding = (req, res) => {
  Order.find({
    customerID: req.user._id,
    orderStatus: "Outstanding",
  })
    .then((order) => {
      console.log(order);
      return res.status(200).send(order);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
};

//  Show list of all outstanding orders for logged in customer
const findAllOrder = (req, res) => {
  Order.find({
    customerID: req.user._id,
  })
    .then((order) => {
      console.log(order);
      return res.status(200).send(order);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
};

// Show list of all outstanding orders for a given van id
// protected by Vendor's JWT
const findVanCurrentOrders = (req, res) => {
  Order.find({
    vendorID: req.user._id,
    $or: [{ orderStatus: "Outstanding" }, { orderStatus: "Fulfilled" }],
  })
    .sort({ orderTime: 1 })
    .then((order) => {
      console.log(order);
      return res.json({
        order: order,
      });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
};

// Show list of order history for a given van id
// protected by Vendor's JWT
const findVanOrders = (req, res) => {
  Order.find({
    vendorID: req.user._id,
  })
    .sort({ orderNo: -1 })
    .then((order) => {
      console.log(order);
      return res.json({
        order: order,
      });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
};

// Customer starts a new order by requesting a snack
// frontend doesn't need to send the time
const newOrder = (req, res) => {
  // check if order number in request
  if (req.body.vendorID == undefined) {
    return res.status(400).json({ msg: "Missing vendor ID" });
  }

  // check if snacks in request
  if (req.body.snacks == undefined) {
    return res.status(400).json({ msg: "Missing snacks" });
  }

  Order.find({})
    .then((orders) => {
      Vendor.findOne({ _id: req.body.vendorID }).then((vendor) => {
        if (!vendor) {
          return res.status(400).json({ msg: "vendor not found" });
        }

        let newOrder = new Order();

        newOrder.orderNo = orders.length + 1;
        newOrder.discount = false;
        newOrder.customerID = req.user._id;
        newOrder.vendorID = req.body.vendorID;
        newOrder.remainTimeUntilDiscount = 15;
        newOrder.orderStatus = "Outstanding";
        newOrder.snacks = req.body.snacks;
        newOrder.remainTime = vendor.timeLimit;
        // format time to display
        newOrder.orderTime = new Date();
        var date = newOrder.orderTime;

        newOrder.timeDisplay = formatTime(newOrder.orderTime);

        // and save the customer
        newOrder.save();
        res.status(200).send(newOrder);
      });
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
};

/* format the date into nicer string */
function formatTime(date) {
  var dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  var mm =
    date.getMonth() < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1;
  var yyyy = date.getFullYear();
  var formattedDate = dd + "/" + mm + "/" + yyyy;
  var hours = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
  var minutes =
    date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();

  return formattedDate + " " + hours + ":" + minutes;
}

module.exports = {
  rateExperience,
  updateOrderStatus,
  updateOrder,
  findAllOrder,
  findOutstanding,
  findVanCurrentOrders,
  findVanOrders,
  newOrder,
  findSnackOrder,
  findOrder,
};
