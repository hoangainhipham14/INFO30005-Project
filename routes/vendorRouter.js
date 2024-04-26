// add vendor router
const express = require("express");
const vendorRouter = express.Router();

const passport = require("passport");
require("../config/passport")(passport);

// import body parser to parse requests
var bodyParser = require("body-parser");
vendorRouter.use(bodyParser.json());

// connect to controller
const vendorController = require("../controllers/vendorController");
const orderController = require("../controllers/orderController.js");

/* ========================= ACCOUNT ========================= */

// sign up a new vendor
vendorRouter.post("/signup", 
  passport.authenticate("vendor-signup"), 
  (req, res) => vendorController.signup(req, res)
);

// log in a vendor
vendorRouter.post("/login", (req, res) =>
  vendorController.login(req, res)
);

//change password
vendorRouter.post("/changePassword",
  passport.authenticate("vendor-jwt", { session: false }),
  (req, res) => vendorController.changePassword(req, res)
);

/* Send location & mark for open for business
Change location
Mark for closing */
vendorRouter.post("/setStatus", 
  passport.authenticate("vendor-jwt", { session: false }),
  (req, res) => vendorController.setStatus(req, res)
);

/* =================== SIMPLE GET REQUESTS =================== */

// process routes by calling controller functions
vendorRouter.get("/findall", (req, res) => vendorController.findall(req, res));

// get vendor by the MongoDB _id field
vendorRouter.get("/getVendorByID/:id", (req, res) => vendorController.getVendorByID(req, res));

// get vendor by the JWT stored
vendorRouter.get("/getVendorByToken", 
  passport.authenticate("vendor-jwt", { session: false }),
  (req, res) => vendorController.getVendorByToken(req, res)
);

/* ========================= ORDERS ========================== */

// protected by Vendor's JWT
vendorRouter.get("/viewCurrentOrders",
  passport.authenticate("vendor-jwt", { session: false }),
  (req, res) => orderController.findVanCurrentOrders(req, res)
);

// protected by Vendor's JWT
vendorRouter.get("/viewOrderHistory",
  passport.authenticate("vendor-jwt", { session: false }),
  (req, res) => orderController.findVanOrders(req, res)
);

// public route
vendorRouter.get("/viewOrder", (req, res) =>
  orderController.findOrder(req, res)
);

// update order, e.g. set order status as fulfilled
// protected by Vendor's JWT
vendorRouter.post("/updateOrder",
  passport.authenticate("vendor-jwt", { session: false }),
  (req, res) => orderController.updateOrderStatus(req, res)
);

// get the info of one vendor
// public route.
vendorRouter.post("/vanDetails", (req, res) =>
  vendorController.vendorDetail(req, res)
);

module.exports = vendorRouter;
