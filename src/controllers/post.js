const express = require("express");
const cloudinary = require("cloudinary").v2;
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
const fileupload = require("express-fileupload");

app.use(fileupload({ useTempFiles: true }));

cloudinary.config({
  cloud_name: "dar4ws6v6",
  api_key: "131471632671278",
  api_secret: "d0UW2ogmMnEEMcNVcDpzG33HKkY",
});

router.post("/post", checkAuth, async (req, res) => {
  try {
    const decodedToken = jwt.decode(req.cookies.token);
    if (!decodedToken) {
      return res.status(401).send("Unauthorized");
    }

    const username = decodedToken.username;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).send("User not found.");
    }
    if (!req.files || !req.files.image) {
      return res.status(400).send("No image file provided.");
    }

    const file = req.files.image;

    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "uploads",
    });
    const postimage = result.secure_url;

    const newpost = new Post({
      text: req.body.text,
      image: postimage,
      author: user._id,
    });
    await newpost.save();
    user.posts.push(newpost._id);
    await user.save();
    res.redirect("/");
    // res.render("dashboard");
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.post("/connect", checkAuth, async (req, res) => {
  try {
    const decodedToken = jwt.decode(req.cookies.token);
    if (!decodedToken) {
      return res.status(401).send("Unauthorized");
    }

    const username = decodedToken.username;
    const currentUser = await User.findOne({ username });
    const userIdToConnect = req.body.userId; // The ID of the user to connect with
    //const currentUser = req.user;
    const userToConnect = await User.findById(userIdToConnect);

    if (!userToConnect) {
      return res.status(404).json({ message: "User not found." });
    }
    if (currentUser.connections.includes(userIdToConnect)) {
      return res.status(400).json({ message: "Already connected." });
    }
    if (currentUser.pendingConnections.includes(userToConnect._id)) {
      return res
        .status(400)
        .json({ message: "Already in pending connection." });
    }
    currentUser.sentConnections.push(userIdToConnect);
    await currentUser.save();
    userToConnect.pendingConnections.push(currentUser._id);
    await userToConnect.save();
    res.json({ message: "Connection request sent." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error connecting to the user." });
  }
});
router.get("/:username", checkAuth, async (req, res) => {
  try {
    const decodedToken = jwt.decode(req.cookies.token);
    if (!decodedToken) {
      return res.status(401).send("Unauthorized");
    }
    const currentUsername = decodedToken.username;
    const otherUsername = req.params.username;
    const currentUser = await User.findOne({ username: currentUsername });
    if (!currentUser) {
      return res.status(404).send("Current user not found.");
    }
    const otherUser = await User.findOne({ username: otherUsername })
      .populate("connections") 
      .populate("pendingConnections"); 
    if (!otherUser) {
      return res.status(404).json({ message: "Other user not found." });
    }
    const otherUserPosts = await Post.find({ author: otherUser._id })
      .sort({ createdAt: -1 }) 
      .populate("author");
    const otherUserConnections = otherUser.connections;
    const otherUserConnectionStatus = otherUserConnections.map((connectionId) => {
      const currentuserisConnected = connectionId.equals(currentUser._id);
      return {
        userId: connectionId,
        currentuserisConnected,
      };
    });
    
    // const otherUserPendingConnections = otherUser.pendingConnections;
    //const isConnected = otherUserConnections.includes(currentUser._id);
    //const isConnected = otherUserConnections.some(id => id.toString() === currentUser._id.toString());
    const isConnected = otherUserConnections.some((id) =>
      id.equals(currentUser._id)
    );
    const hasPendingRequest = currentUser.pendingConnections.some((id) =>
      id.equals(otherUser._id)
    );
    const hasSentConnectionRequest = currentUser.sentConnections.some((id) =>
      id.equals(otherUser._id)
    );
    // const otherUserConnectionStatus = otherUserConnections.map((connectionId) => {
    //   const userisConnected = currentUser.connections.some(userConnectionId =>
    //     userConnectionId.equals(connectionId)
    //   );
    //   const hehasPendingRequest = currentUser.pendingConnections.some(pendingId =>
    //     pendingId.equals(connectionId)
    //   );
    //   const hehasSentConnectionRequest = currentUser.sentConnections.some(sentId =>
    //     sentId.equals(connectionId)
    //   );
    //   console.log(isConnected);
    //   console.log(hasPendingRequest);
    //   console.log(hasSentConnectionRequest);
    
    //   return {
    //     userId: connectionId,
    //     userisConnected,
    //     hehasPendingRequest,
    //     hehasSentConnectionRequest,
    //   };
    // });

    // const otherUserConnectionStatus = otherUserConnections.map((id) => {
      
    //   const currentuserisConnected = id.equals(currentUser._id);
    //   const isConnected = currentUser.connections.some(ids => ids.equals(id));
    //   console.log(isConnected);
    //   //const hasPendingRequest = currentUser.pendingConnections.includes(id);
    //   const hasPendingRequest = id.equals(currentUser.pendingConnections.some(ids => ids));
    //   // const hasSentConnectionRequest = currentUser.sentConnections.some(ids => ids._id.equals(id));
    //   //const hasSentConnectionRequest = currentUser.sentConnections.filter(ids => ids.toString() === id.toString()).length > 0;
    //   const hasSentConnectionRequest = id.equals(currentUser.sentConnections.some(ids => ids));
  
  
    //   return {
    //     userId: id,
    //     isConnected,
    //     currentuserisConnected,
    //     hasPendingRequest,
    //     hasSentConnectionRequest,
    //   };
    // });

   

    res.render("otheruserprofile", {
      currentUser,
      otherUser,
      otherUserConnections,
      otherUserPosts,
      isConnected,
      hasPendingRequest,
      hasSentConnectionRequest,
      otherUserConnectionStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error retrieving other user profile." });
  }
});

module.exports = router;
