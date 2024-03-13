const express = require("express");
//const cloudinary = require("cloudinary").v2;
const app = express();
const bodyParser = require("body-parser");
const User = require("../model/User");
const Post = require("../model/Userpost");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const checkAuth = require("../middleware/checkauth");
const router = express.Router();
app.use(bodyParser.json());
router.use(express.json());

router.get("/:username", checkAuth, async (req, res) => {
  try {
    const decodedToken = jwt.decode(req.cookies.token);
    if (!decodedToken) {
      return res.status(401).send("Unauthorized");
    }

    const username = decodedToken.username;
    const userProfile = await User.findOne({ username })
      .populate("pendingConnections")
      .populate("connections"); 
    if (!userProfile) {
      return res.status(404).json({ message: "User not found." });
    }
    const userPosts = await Post.find({ author: userProfile._id })
      .sort({ createdAt: -1 })
      .populate("author");
    const connectedUserIds = userProfile.connections;
    const connectedUsers = await User.find({ _id: { $in: connectedUserIds } });
    const pendingConnectionUsersIds = userProfile.pendingConnections;
    const pendingConnectionUsers = await User.find({ _id: { $in: pendingConnectionUsersIds }})

    res.render("profile", {
      userProfile,
      userPosts,
      connectedUsers,
      pendingConnectionUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error retrieving user profile." });
  }
});
router.post("/accept/:userId", checkAuth, async (req, res) => {
  try {
    const decodedToken = jwt.decode(req.cookies.token);
    if (!decodedToken) {
      return res.status(401).send("Unauthorized");
    }
    const username = decodedToken.username;
    const currentUser  = await User.findOne({ username })
    const userIdToAccept = req.params.userId;
    const userToAccept = await User.findById(userIdToAccept);
    if (!userToAccept) {
      return res.status(404).json({ message: "User to accept not found." });
    }
    if (!currentUser.pendingConnections.includes(userToAccept._id)) {
      return res.status(400).json({ message: "Connection request not found." });
    }
    currentUser.connections.push(userToAccept._id);
    userToAccept.connections.push(currentUser._id);
    currentUser.pendingConnections = currentUser.pendingConnections.filter(
      (id) => id.toString() !== userToAccept._id.toString()
    );
    userToAccept.sentConnections =  userToAccept.sentConnections.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await userToAccept.save();

    res.json({ message: "Connection accepted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error accepting the connection." });
  }
});


module.exports = router;
