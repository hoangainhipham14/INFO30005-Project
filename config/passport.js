require("dotenv").config(); // for JWT password key

// used to create our local strategy for authenticating
// using customername and password
const LocalStrategy = require("passport-local").Strategy;

const Customer = require("../models/customer");
const Vendor = require('../models/vendor');

// the following is required if you wanted to use passport-jwt
// JSON Web Tokens
const passportJWT = require("passport-jwt");
const JwtStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

module.exports = function (passport) {
  // these two functions are used by passport to store information
  // in and retrieve data from sessions. We are using customer's object id
  passport.serializeUser((customer, done) => {
    done(null, customer._id);
  });

  passport.deserializeUser((_id, done) => {
    Customer.findById(_id, (err, data) => {
      done(err, data);
    });
  });

  /* ==========================================================================
   *
   * should these local ones exist?
   * 
   * ======================================================================= */


  // strategy to login
  // this method only takes in customername and password, and the field names
  // should match of those in the login form
  passport.use(
    "local-login",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      }, // pass the req as the first arg to the callback for verification
      function (req, email, password, done) {
        // you can read more about the nextTick() function here:
        // https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/
        // we are using it because without it the Customer.findOne does not work,
        // so it's part of the 'syntax'
        process.nextTick(function () {
          // see if the customer with the email exists
          Customer.findOne({ email: email }, function (err, customer) {
            // if there are errors, customer is not found or password
            // does match, send back errors
            if (err) return done(err);
            if (!customer)
              return done(
                null,
                false,
                req.flash("loginMessage", "No customer found.")
              );

            if (!customer.validPassword(password)) {
              // false in done() indicates to the strategy that authentication has
              // failed
              return done(
                null,
                false,
                req.flash("loginMessage", "Oops! Wrong password.")
              );
            }
            // otherwise, we put the customer's email in the session
            else {
              // in app.js, we have indicated that we will be using sessions
              // the server uses the included modules to create and manage
              // sessions. each client gets assigned a unique identifier and the
              // server uses that identifier to identify different clients
              // all this is handled by the session middleware that we are using
              req.session.email = email; // for demonstration of using express-session

              // done() is used by the strategy to set the authentication status with
              // details of the customer who was authenticated
              return done(
                null,
                customer,
                req.flash("loginMessage", "Login successful")
              );
            }
          });
        });
      }
    )
  );

  // for signup
  passport.use(
    "local-signup",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      }, // pass the req as the first arg to the callback for verification

      function (req, email, password, done) {
        process.nextTick(function () {
          Customer.findOne({ email: email }, function (err, existingCustomer) {
            // search a customer by the username (email in our case)
            // if customer is not found or exists, exit with false indicating
            // authentication failure
            if (err) {
              console.log(err);
              return done(err);
            }
            if (existingCustomer) {
              return done(
                null,
                false,
                req.flash("signupMessage", "That email is already taken.")
              );
            } else {
              const regexNum = new RegExp("(?=.*[0-9])");
              const regexLetter = new RegExp("(?=.*[A-Za-z])");

              if (
                !(
                  regexNum.test(password) &&
                  regexLetter.test(password) &&
                  password.length > 8
                )
              )
                return done(null, false, {
                  message:
                    "error: password needs to have at least 8 characters, one letter and one number",
                });

              // otherwise
              // create a new customer
              var newCustomer = new Customer();

              newCustomer.email = email;
              newCustomer.password = newCustomer.generateHash(password);
              newCustomer.givenName = req.body.givenName;
              newCustomer.familyName = req.body.familyName;

              // and save the customer
              newCustomer.save(function (err) {
                if (err) throw err;

                return done(null, newCustomer);
              });

              // put the customer's email in the session so that it can now be used for all
              // communications between the client (browser) and the app
              req.session.email = email;
            }
          });
        });
      }
    )
  );

  /* ==========================================================================
   *
   * CUSTOMER SIGNUP, LOGIN, JWT
   * 
   * ======================================================================= */



  // depending on what data you store in your token, setup a strategy
  // to verify that the token is valid. This strategy is used to check
  // that the client has a valid token
  passport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // client puts token in request header
        secretOrKey: process.env.PASSPORT_KEY, // the key that was used to sign the token
        passReqToCallback: true,
      },
      (req, jwt_payload, done) => {
        // passport will put the decrypted token in jwt_payload variable

        // here I'm simply searching for a customer with the email addr
        // that was added to the token. _id was added to the token
        // body that was signed earlier in the customerRouter.js file
        // when logging in the customer
        console.log(jwt_payload.body._id);
        Customer.findOne({ email: jwt_payload.body._id }, (err, customer) => {
          if (err) {
            return done(err, false);
          }
          // if we found customer, provide the customer instance to passport
          if (customer) {
            return done(null, customer);
          } else {
            // otherwise assign false to indicate that authentication failed
            return done(null, false);
          }
        });
      }
    )
  );

  //Create a passport middleware to handle Customer login
  passport.use(
    "login",
    new LocalStrategy(
      {
        usernameField: "email", // get email and password
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          //Find the customer associated with the email provided by the customer
          await Customer.findOne({ email: email }, function (err, customer) {
            // if customer is not found or there are other errors
            if (err) return done(err);
            if (!customer)
              return done(null, false, { message: "No customer found." });

            // customer is found but the password doesn't match
            if (!customer.validPassword(password))
              return done(null, false, { message: "Oops! Wrong password." });
            // everything is fine, provide customer instance to passport
            else {
              return done(null, customer, { message: "Login successful" });
            }
          });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  //Create a passport middleware to handle Customer signup
  /* on success, returns the user object. On failure, returns unauthorized */
  passport.use(
    "signup",
    new LocalStrategy(
      {
        usernameField: "email", // get email and password
        passwordField: "password",
        passReqToCallback: true,
      },
      (req, email, password, done) => {
        process.nextTick(function () {
          Customer.findOne({ email: email }, function (err, existingCustomer) {
            // search a customer by the username (email in our case)
            // if customer is not found or exists, exit with false indicating
            // authentication failure
            if (err) {
              console.log(err);
              return done(err);
            }
            if (existingCustomer) {
              // return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
              // this message seems not to get sent to the user
              return done(null, false, {
                message: "error: Already existing user",
              });
            } else {
              // otherwise
              // create a new customer
              let newCustomer = new Customer();

              newCustomer.email = email;
              newCustomer.password = newCustomer.generateHash(password);
              newCustomer.givenName = req.body.givenName;
              newCustomer.familyName = req.body.familyName;

              // and save the customer
              newCustomer.save(function (err) {
                if (err) throw err;

                return done(null, newCustomer);
              });

              // put the customer's email in the session so that it can now be used for all
              // communications between the client (browser) and the app
              req.session.email = email;
            }
          });
        });
      }
    )
  );


  /* ==========================================================================
   *
   * VENDOR SIGNUP, LOGIN, JWT
   * 
   * ======================================================================= */


  //Create a passport middleware to handle Vendor signup
  /* on success, returns the user object. On failure, returns unauthorized */
  passport.use(
    "vendor-signup",
    new LocalStrategy(
      {
        usernameField: "vanName",
        passwordField: "password",
        passReqToCallback: true,
      },
      (req, vanName, password, done) => {
        process.nextTick(function () {
          Vendor.findOne({ vanName: vanName }, function (err, existingVendor) {
            // search a vendor by the vanName
            // if vendor is not found or exists, exit with false indicating
            // authentication failure
            if (err) {
              console.log(err);
              return done(err);
            }
            if (existingVendor) {
              return done(null, false, {
                message: "error: Already existing vendor",
              });
            } else {
              // otherwise
              // create a new vendor
              let newVendor = new Vendor();

              newVendor.password = newVendor.generateHash(password);
              newVendor.vanName = req.body.vanName;

              // and save the vendor
              newVendor.save(function (err) {
                if (err) throw err;

                return done(null, newVendor);
              });
            }
          });
        });
      }
    )
  );

  //Create a passport middleware to handle Vendor login
  passport.use(
    "vendor-login",
    new LocalStrategy(
      {
        usernameField: "vanName",
        passwordField: "password",
      },
      async (vanName, password, done) => {
        try {
          //Find the customer associated with the email provided by the customer
          await Vendor.findOne({ vanName: vanName }, function (err, vendor) {
            // if customer is not found or there are other errors
            if (err) return done(err);
            if (!vendor)
              return done(null, false, { message: "No vendor found." });

            // vendor is found but the password doesn't match
            if (!vendor.validPassword(password))
              return done(null, false, { message: "Oops! Wrong password." });
            // everything is fine, provide vendor instance to passport
            else {
              return done(null, vendor, { message: "Login successful" });
            }
          });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(
    "vendor-jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // client puts token in request header
        secretOrKey: process.env.PASSPORT_KEY, // the key that was used to sign the token
        passReqToCallback: true,
      },
      (req, jwt_payload, done) => {
        // passport will put the decrypted token in jwt_payload variable
        // find the vendor with the id stored in the token
        Vendor.findOne({ _id: jwt_payload.body._id }, (err, vendor) => {
          if (err) {
            console.log(err)
            return done(err, false);
          }
          // if we found a vendor, provide the vendor instance to passport
          if (vendor) {
            return done(null, vendor);
          } else {
            // otherwise assign false to indicate that authentication failed
            return done(null, false);
          }
        });
      }
    )
  );

};
