const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const bodyParser = require("body-parser");
const cookie = require("cookie");
const router = express.Router();
app.use(bodyParser.json());
const SecretKey = require("../config/crypto");
router.use(express.json());
const jwtSecret = SecretKey;
const checkAuth = require("../middleware/checkauth");

// router.post("/checkuser", async (req, res) => {
//   try {
//     const { username } = req.body;
//     const user = await User.findOne({ username });
//     if (user) {
//       // User exists
//       return res.json({ userExists: true });
//     } else {
//       // User doesn't exist
//       return res.json({ userExists: false });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

router.post("/checkuser", async (req, res) => {
  try {
    const { username, mobileNumber } = req.body;

    // Check if a user with the given username exists
   const userByUsername = await User.findOne({ username,  isVerified: true });

    // Check if a user with the given mobile number exists
    const userByMobileNumber = await User.findOne({ mobileNumber, isVerified: true });


    if (userByUsername && userByMobileNumber) {
      // Both username and mobile number exist
      return res.json({ userExists: true, message: "User already exists with this username and mobile number." });
    } else if (userByUsername) {
      // Username exists
      return res.json({ userExists: true, message: "User already exists with this username." });
    } else if (userByMobileNumber) {
      // Mobile number exists
      return res.json({ userExists: true, message: "User already exists with this mobile number." });
    } else {
      // User doesn't exist
      return res.json({ userExists: false });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { username, mobileNumber, password } = req.body;
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user
    const user = new User({
      username,
      mobileNumber,
      password: hashedPassword,
    });

    await user.save();
    console.log("user saved");

    res.status(201).json({ message: "User created. Please verify OTP." });
    // res.render("verifyotp", {mobileNumber: user.mobileNumber});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/verifyotp", (req, res) => {
  const mobileNumber = req.query.mobileNumber;
  const verificationId = req.query.verificationId;
  res.render("verifyotp", { mobileNumber, verificationId });
});

router.post("/verifyotp", async (req, res) => {
  try {
    const mobileNumber = req.body.mobileNumber;
    if (!mobileNumber) {
      return res
        .status(400)
        .json({ error: "Mobile number is missing in the request body" });
    }

    // Remove non-numeric characters and ensure it starts with "+"
    let formattedMobileNumber = mobileNumber.replace(/\D/g, "");
    if (!formattedMobileNumber.startsWith("+")) {
      formattedMobileNumber = `+${formattedMobileNumber}`;
    }

    console.log(formattedMobileNumber);

    // Now you can proceed with the rest of your code
    const user = await User.findOne({ mobileNumber: formattedMobileNumber });
    user.isVerified = true;
    await user.save();
    const token = jwt.sign({ username: user.username }, jwtSecret, {
      expiresIn: "1h",
    });
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      })
    );

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      res.send("user not found");
    } else {
    const isvalidPassword = await bcrypt.compare(password, user.password);
    if (isvalidPassword) {
      const token = jwt.sign({ username: user.username }, jwtSecret, {
        expiresIn: "1h",
      });
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "strict",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        })
      );
      res.redirect("/");
    } else {
      res.send("wrong password");
    }
    }
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get("/logout", (req, res) => {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize("token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    })
  );

  res.redirect("/");
});

router.get("/dashboard", checkAuth, (req, res) => {
  res.render("dashboard");
});

module.exports = router;
