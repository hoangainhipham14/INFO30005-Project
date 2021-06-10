const Customer = require("../models/customer");
const jwt = require("jsonwebtoken");
const { deserializeUser } = require("passport");
const passport = require("passport");
require("../config/passport")(passport);
const { validateSignin } = require("./authController");

/* signup a user
 * on success, send a JWT token and user information back to the client with status 200
 * on failure, returns `Unauthorized` and status 401
 * on server err, returns 500
 */
const signup = (req, res) => {
  const body = { _id: req.user.email };
  const token = jwt.sign({ body }, process.env.PASSPORT_KEY);
  //Send back the token to the client, as well as the signed-up details
  Customer.findOne({ email: req.user.email }, (err, data) => {
    console.log(data);
    if (err) {
      return res.status(500);
    } else {
      return res.status(200).json({
        token: token,
        familyName: data.familyName,
        givenName: data.givenName,
        email: data.email,
        _id: data._id,
      });
    }
  });
};

/* POST /login
 * fields: email, password
 * returns:
 *          sucess:  JWT as a string
 *          failure: JSON object {message: "incorrect email/password"} or error message
 */
const login = async (req, res) => {
  // passport.authenticate is provided by passport to authenticate
  // customers
  // 'login' is the name of strategy that we have defined in the
  // passport.js file in the config folder
  // customer and info should be passed by the 'login' strategy
  // to passport.authenticate -- see the code for the strategy
  const { errors, isValid } = validateSignin(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  passport.authenticate("login", async (err, customer, info) => {
    try {
      // if there were errors during executing the strategy
      // or the customer was not found, we display and error
      if (err || !customer) {
        // const error = new Error('Couldn\'t authenticate user')
        return res.status(400).json({ message: "incorrect email/password" });
      }

      // otherwise, we use the req.login to store the customer details
      // in the session. By setting session to false, we are essentially
      // asking the client to give us the token with each request
      req.login(customer, { session: false }, async (error) => {
        if (error) return res.status(400).send(error);

        // We don't want to store sensitive information such as the
        // customer password in the token so we pick only the customer's email
        const body = { _id: customer.email };

        //Sign the JWT token and populate the payload with the customer email
        const token = jwt.sign({ body }, process.env.PASSPORT_KEY);

        //Send back the token to the client
        res.status(200); // OK status
        // send the token

        // we shouldn't need cookies?
        // res.cookie('jwt',token, { httpOnly: false, sameSite: false, secure: true, domain:"http://localhost:3000"});
        return res.json({
          token: token,
          familyName: customer.familyName,
          givenName: customer.givenName,
          email: customer.email,
          _id: customer._id,
        });
      });
    } catch (error) {
      return res.status(500).send(error);
    }
  })(req, res);
};

// update customer password
// use jwt
const changePassword = async (req, res) => {
  // check if password in request
  if (req.body.password == undefined) {
    return res.status(400).json({ msg: "Missing password" });
  }

  // check if new password in request
  if (req.body.newPassword == undefined) {
    return res.status(400).json({ msg: "Missing new password" });
  }

  Customer.findOne({ _id: req.user._id })
    .then((customer) => {
      // return error if there's no customer
      if (!customer)
        return res
          .status(400)
          .json({ msg: "Could not find username in database" });

      // check if entered password is valid
      if (!customer.validPassword(req.body.password))
        return res.status(400).json({ msg: "Incorrect password" });

      // check password policy
      const regexNum = new RegExp("(?=.*[0-9])");
      const regexLetter = new RegExp("(?=.*[A-Za-z])");

      if (
        !(
          regexNum.test(req.body.newPassword) &&
          regexLetter.test(req.body.newPassword) &&
          req.body.newPassword.length > 8
        )
      )
        return res.status(400).json({
          msg: "Password needs to have at least 8 characters, one letter and one number",
        });

      // hash password
      customer.password = customer.generateHash(req.body.newPassword);
      // update customer in database
      customer.save();
      return res.status(200).send(customer);
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
};

// update customer given name or family name
// use jwt
const changeName = (req, res) => {
  Customer.findOne({ _id: req.user._id })
    .then((customer) => {
      // check if request is correct
      if (req.body.familyName == undefined && req.body.givenName == undefined) {
        return res.sendStatus(400);
      } else {
        // update family name if family name is in request
        if (req.body.familyName != undefined) {
          customer.familyName = req.body.familyName;
        }

        // update given name if given name is in request
        if (req.body.givenName != undefined) {
          customer.givenName = req.body.givenName;
        }

        // update customer
        customer.save();
        return res.status(200).send(customer);
      }
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
};


/* ===================== SIMPLE GETTERS ====================== */

const getCustomerByID = (req, res) => {
  Customer.findOne({_id: req.params.id}, (err, customer) => {
    if (err) {
      return res.status(404).json({msg: "could not find specified customer", err: err});
    }
    return res.status(200).json({
      familyName: customer.familyName,
      givenName: customer.givenName,
      email: customer.email,
      _id: customer._id,
    })
  })
};

const getCustomerByToken = (req, res) => {
  Customer.findOne({_id: req.user._id}, (err, customer) => {
    if (err) {
      return res.status(404).json({msg: "could not find specified customer", err: err});
    }
    return res.status(200).json({
      familyName: customer.familyName,
      givenName: customer.givenName,
      email: customer.email,
      _id: customer._id,
    })
  })
};

module.exports = {
  changeName,
  changePassword,
  signup,
  login,
  getCustomerByID,
  getCustomerByToken,
};
