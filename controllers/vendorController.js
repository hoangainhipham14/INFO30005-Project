const Vendors = require("../models/vendor");
const jwt = require("jsonwebtoken");
const { deserializeUser } = require("passport");
const passport = require("passport");
require("../config/passport")(passport);

// find all vendors
const findall = (req, res) => {
  Vendors.find({})
    .then((result) => {
      return res.send(result);
    })
    .catch((result) => {
      return res.status(400).send(result);
    });
};

// Setting van status (vendor sends location, marks van as ready-for-orders)
// takes in vednor ID from JWT
const setStatus = (req, res) => {
  // ensure fields are ok
  if (
    req.body.locationString === undefined ||
    req.body.gps === undefined ||
    req.body.ready === undefined ||
    !(typeof req.body.ready === typeof true)
  ) {
    return res.status(400).json({ msg: "invalid input" });
  } else if (req.body.gps.length != 2) {
    return res.status(400).json({ msg: "gps must be of length 2" });
  }

  // find vendor and update
  Vendors.findOne({ _id: req.user._id })
    .then((vendor) => {
      vendor.locationString = req.body.locationString;
      vendor.loc.coordinates = req.body.gps;
      vendor.ready = req.body.ready;
      vendor.save();
      return res.sendStatus(200);
    })
    .catch((err) => {
      return res.status(400).json({ msg: "Could not find specified vendor" });
    });
};

const signup = (req, res) => {
  const body = { _id: req.user._id };
  const token = jwt.sign({ body }, process.env.PASSPORT_KEY);
  //Send back the token to the client, as well as the signed-up details
  Vendors.findOne({ vanName: req.user.vanName }, (err, data) => {
    if (err) {
      return res.status(500);
    } else {
      return res.status(200).json({
        token: token,
        vanName: data.vanName,
        ready: data.ready,
        _id: data._id,
      });
    }
  });
};

const login = (req, res) => {
  passport.authenticate("vendor-login", async (err, vendor, info) => {
    try {
      // if there were errors during executing the strategy
      // or the customer was not found, we display and error
      if (err || !vendor) {
        return res.status(400).json({ message: "incorrect vanName/password" });
      }
      req.login(vendor, { session: false }, async (error) => {
        if (error) return res.status(400).send(error);

        // We don't want to store sensitive information such as the
        // vendor password in the token so we pick only the vendor's _id
        const body = { _id: vendor._id };

        //Sign the JWT token and populate the payload with the vendor id
        const token = jwt.sign({ body }, process.env.PASSPORT_KEY);

        //Send back the token to the client
        return res.status(200).json({
          token: token,
          vanName: vendor.vanName,
          locationString: vendor.locationString,
          ready: vendor.ready,
          loc: vendor.loc,
          _id: vendor._id,
        });
      });
    } catch (error) {
      return res.status(500).send(error);
    }
  })(req, res);
};

// add vendor
const addVendor = (req, res) => {
  // check if van name in request
  if (req.body.vanName == undefined) {
    return res.status(400).json({ msg: "Missing van name" });
  }

  // check if passsword in request
  if (req.body.password == undefined) {
    return res.status(400).json({ msg: "Missing password" });
  }

  // check if time limit in request
  if (req.body.timeLimit == undefined) {
    return res.status(400).json({ msg: "Missing time limit" });
  }

  const newVendor = new Vendors({
    vanName: req.body.vanName,
    password: req.body.password,
    // time limit for changing order
    timeLimit: req.body.timeLimit,
  });

  newVendor.save((err) => {
    const duplicateKeyErrorCode = 11000;
    if (err && err.code == duplicateKeyErrorCode) {
      return res
        .status(400)
        .json({ msg: "Vendor with that name already exists!" });
    }
    res.status(200).send(newVendor);
  });
};

// allow vendor to change password
const changePassword = async (req, res) => {
  // check if password in request
  if (req.body.password == undefined) {
    return res.status(400).json({ msg: "Missing password" });
  }
  // check if new password in request
  if (req.body.newPassword == undefined) {
    return res.status(400).json({ msg: "Missing new password" });
  }
  Vendors.findOne({ _id: req.user._id })
    .then((vendor) => {
      if (!vendor)
        return res.status(400).json({ msg: "Required vendor doesn't exist" });

      // check if entered password is valid
      if (!vendor.validPassword(req.body.password))
        return res.status(400).json({ msg: "Incorrect password" });

      // hash password
      vendor.password = vendor.generateHash(req.body.newPassword);
      vendor.save();
      return res.status(200).send(vendor);
    })
    .catch((err) => {
      return res.status(500).send(err);
    });
};

const vendorDetail = async (req, res) => {
  Vendors.findOne({ _id: req.body.id })
    .then((vendor) => {
      vendor = vendor.toObject();
      delete vendor.password;
      return res.status(200).send(vendor);
    })
    .catch((err) => {
      res.status(400).send(err);
    });
};

/* parameters:
 * req.body.lat, req.body.lon
 */
const nearestVans = async (req, res) => {
  let reqGPS = {
    lat: req.query.lat,
    lon: req.query.lon,
  };

  /* get the list of all vans that are ready */
  let vendors = await Vendors.find({ ready: true });

  vendors = vendors.sort((a, b) => {
    /* ensure the entries exist, the coordinates may not ahve been entered */
    if (a == undefined && b == undefined) {
      return 0;
    } else if (a == undefined || a.loc.coordinates == undefined) {
      return 1;
    } else if (b == undefined || b.loc.coordinates == undefined) {
      return -1;
    }

    let aGPS = {
      lat: a.loc.coordinates[1],
      lon: a.loc.coordinates[0],
    };
    let bGPS = {
      lat: b.loc.coordinates[1],
      lon: b.loc.coordinates[0],
    };

    return (
      gpsDistanceInMetres(reqGPS, aGPS) - gpsDistanceInMetres(reqGPS, bGPS)
    );
  });

  /* package up the array so that it includes the information about the vendors that we care about */
  let vendorArray = [];
  for (let v of vendors) {
    van = {
      distance: Math.floor(
        gpsDistanceInMetres(reqGPS, {
          lat: v.loc.coordinates[1],
          lon: v.loc.coordinates[0],
        }) / 1000.0
      ),
      vanID: v._id,
      vanName: v.vanName,
      ready: v.ready,
      locationString: v.locationString,
      coordinates: v.loc.coordinates,
    };
    vendorArray.push(van);
  }

  return res.send(vendorArray);
};

const gpsDistanceInMetres = (gps1, gps2) => {
  /* https://stackoverflow.com/a/19356480 */
  let lat_dist = Number(gps1.lat) - Number(gps2.lat);
  let lon_dist = Number(gps1.lon) - Number(gps2.lon);
  let lat_mid = (Number(gps1.lat) + Number(gps2.lat)) / 2.0;

  let m_per_degree_lat =
    111132.954 -
    559.822 * Math.cos(2.0 * lat_mid) +
    1.175 * Math.cos(4.0 * lat_mid);
  let m_per_degree_lon = (Math.PI / 180) * 6367449 * Math.cos(lat_mid);

  return Math.sqrt(
    lat_dist * m_per_degree_lat * (lat_dist * m_per_degree_lat) +
      lon_dist * m_per_degree_lon * (lon_dist * m_per_degree_lon)
  );
};


/* =================== SIMPLE GET REQUESTS =================== */

const getVendorByID = (req, res) => {
  Vendors.findOne({_id: req.params.id})
    .then( vendor => {
      if (!vendor) {
        return res.status(404).json({msg: "No vendor found with that ID"});
      }

      return res.status(200).json({
        vanName: vendor.vanName,
        ready: vendor.ready,
        locationString: vendor.locationString,
        loc: vendor.loc,
        _id: vendor._id
      })
    })
    .catch(err => {
      return res.status(400).json({msg: "No vendor found with that ID", err: err})
    })
  };

const getVendorByToken = (req, res) => {
  Vendors.findOne({_id: req.user._id})
    .then( vendor => {
      if (!vendor) {
        // this should never happen, but it's worth guarding against anyway
        return res.status(404).json({msg: "No vendor found with that ID"});
      }

      return res.status(200).json({
        vanName: vendor.vanName,
        ready: vendor.ready,
        locationString: vendor.locationString,
        loc: vendor.loc,
        _id: vendor._id
      })
    })
    .catch(err => {
      return res.status(400).send(err)
    });
}


module.exports = {
  findall,
  addVendor,
  signup,
  login,
  setStatus,
  changePassword,
  vendorDetail,
  getVendorByID,
  getVendorByToken,
  nearestVans,
};
