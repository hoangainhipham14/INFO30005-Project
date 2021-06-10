require("dotenv").config(); // for JWT password key

// add customer router
const express = require("express");

const jwt = require("jsonwebtoken");
const { deserializeUser } = require("passport");

// we will use the passport strategies we defined in
// passport.js file in config folder to signup and login
// a user.
const passport = require("passport");
require("../config/passport")(passport);

const customerRouter = express.Router();

// connect to controller
const menuController = require("../controllers/menuController.js");
const orderController = require("../controllers/orderController.js");
const customerController = require("../controllers/customerController");
const vendorController = require("../controllers/vendorController");

/* ========================= ACCOUNTS ========================= */

/* POST /login
 * fields: email, password
 * returns:
 *          sucess:  JWT token with status 200
 *          failure: JSON object {message: "incorrect email/password"} or error message
 */
customerRouter.post("/login", async (req, res) =>
  customerController.login(req, res)
);

/* POST /signup
 * fields: email, password, givenName, FamilyName
 * returns:
 *          success: JWT token  with status 200
 *          failure: returns `Unauthorized`
 */
customerRouter.post("/signup", passport.authenticate("signup"), (req, res) =>
  customerController.signup(req, res)
);

/* POST /changePassword
 * fields: {
 *             password: String, // user's current password, to verify it's them
 *             newPassword: String, // the password to change to
 *         }
 * returns:
 *          success: updated customer with status 200
 *          failure: json with status 400 and relevant messasge
 *          failure: server error with status 500
 */
customerRouter.post(
  "/changePassword",
  passport.authenticate("jwt", { session: false }),
  (req, res) => customerController.changePassword(req, res)
);

/* POST /changeName
 * fields: new family name or given name
 * returns:
 *          success: updated customer with status 200
 *          failure: json with status 400
 */
customerRouter.post(
  "/changeName",
  passport.authenticate("jwt", { session: false }),
  (req, res) => customerController.changeName(req, res)
);
/* ========================= MENU ========================= */

/* get the full menu */
customerRouter.get("/menu", (req, res) => menuController.getMenu(req, res));

/* view a specific snack */
customerRouter.get("/menu/:snack", (req, res) =>
  menuController.getSnack(req, res)
);

/* ========================= ORDERS ========================= */

/* view list of outstanding orders */
customerRouter.get(
  "/viewOutstandingOrders",
  passport.authenticate("jwt", { session: false }),
  (req, res) => orderController.findOutstanding(req, res)
);

/* view all order under a customer */
customerRouter.get(
  "/findAllOrder",
  passport.authenticate("jwt", { session: false }),
  (req, res) => orderController.findAllOrder(req, res)
);

/* view a specific order */
customerRouter.get(
  "/viewOrder",
  passport.authenticate("jwt", { session: false }),
  (req, res) => orderController.findOrder(req, res)
);

/* view a snack by inputing its ID */
customerRouter.get(
  "/findSnackOrder",
  (req, res) => orderController.findSnackOrder(req, res)
);

/* rate experience */
customerRouter.post(
  "/rateExperience",
  passport.authenticate("jwt", { session: false }),
  (req, res) => orderController.rateExperience(req, res)
);

/* place a new order */
customerRouter.post(
  "/newOrder",
  passport.authenticate("jwt", { session: false }),
  (req, res) => orderController.newOrder(req, res)
);

/* update order */
customerRouter.post(
  "/updateOrder",
  passport.authenticate("jwt", { session: false }),
  (req, res) => orderController.updateOrder(req, res)
);

/* cancel order */
customerRouter.post(
  "/cancelOrder",
  passport.authenticate("jwt", { session: false }),
  (req, res) => orderController.updateOrder(req, res)
);

/* ======================== FINDING VANS ====================== */

/* find the closest vans */
customerRouter.get("/nearestVans", (req, res) =>
  vendorController.nearestVans(req, res)
);


/* ===================== SIMPLE GETTERS ====================== */

/* Find Customer by ID */
customerRouter.get("/getCustomerByID/:id", (req, res) =>
  customerController.getCustomerByID(req, res)
);

/* find Customer by JWT token */
customerRouter.get("/getCustomerByToken",
  passport.authenticate("jwt", { session: false }),
  (req, res) => customerController.getCustomerByToken(req, res)
);


// export the router
module.exports = customerRouter;
