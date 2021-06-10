// express
const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true })); // replaces body-parser
app.use(express.json());

//allow cors
const cors = require("cors");

app.use(
  cors({
    credentials: true, // from Express docs: adds the Access-Control-Allow-Credentials CORS header
    origin: "https://snacks-in-a-van-info30005.herokuapp.com/", // or your heroku url
  })
);

const dotenv = require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const jwt = require("jsonwebtoken");

// configure passport authenticator -- making sure we can access
// the strategies
require("./config/passport")(passport);

// set up session store with contents of secret key. Can probably get rid of this
app.use(
  session({
    secret: process.env.PASSPORT_KEY,
    resave: true,
    saveUninitialized: true,
  })
);

// set up passport middleware
app.use(passport.initialize());
app.use(passport.session());
// app.use(flash);

// connect to database
require("./models/index.js")(app);

// connect to routers
const vendorRouter = require("./routes/vendorRouter.js");
const customerRouter = require("./routes/customerRouter.js");
// const { initialize } = require("passport");

// send HTTP requests to router
app.use("/vendors", vendorRouter);
app.use("/customers", customerRouter);

// start server and listen for HTTP requests
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

module.exports = app;
