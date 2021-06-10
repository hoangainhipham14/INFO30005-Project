const Snack = require("../models/snack");

// view details of a snack
const getSnack = (req, res) => {
  Snack.findOne({ name: req.params.snack })
    .then((result) => {
      res.status(200).send(result);
    })
    .catch((err) => {
      res.sendStatus(400);
    });
};

// view menu of snacks
const getMenu = (req, res) => {
  Snack.find({})
    .then((result) => {
      res.status(200).send(result);
    })
    .catch((err) => {
      res.sendStatus(400);
    });
};

module.exports = {
  getSnack,
  getMenu,
};
