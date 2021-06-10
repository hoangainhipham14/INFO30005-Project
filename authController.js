const Validator = require("validator");
const isEmpty = require("is-empty");

// Validate sign in details
function validateSignin(data) {
  let errors = {};

  // email checks
  if (!Validator.isEmail(data.email)) {
    errors.email = "Email is invalid";
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
}

module.exports.validateSignin = validateSignin;
