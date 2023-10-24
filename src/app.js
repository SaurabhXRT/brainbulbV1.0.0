const express = require("express");
const cloudinary = require("cloudinary").v2;
const app = express();
const fileupload = require("express-fileupload");
app.use(fileupload({ useTempFiles: true }));
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const PORT = 3000;
const hbs = require("hbs");
const moment = require('moment');
//const Handlebars = require("express-handlebars");
//const exphbs = hbs.create();
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./config/db");
const checkAuth = require("./middleware/checkauth");
//const twilio = require("twilio");
const User = require("./model/User");
const Post = require("./model/Userpost");
const File = require("./model/Upload");
const multer = require("multer");
const streamifier = require("streamifier");
const hbsHelpers = {
  timeago: function(date) {
  return moment(date).fromNow();
}
};
const storage = multer.memoryStorage();
const upload = multer({ storage });

hbs.registerHelper(hbsHelpers);
hbs.registerHelper("ifEqual", function (a, b, options) {
  return a.toString() === b.toString() ? options.fn(this) : options.inverse(this);
});


app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "../public")));
const template_path = path.join(__dirname, "../views");

app.set("views", template_path);
app.set("view engine", "hbs");

app.get("/login", (req, res) => {
  // res.send("hello");
  res.render("login");
});
app.get("/signup", (req, res) => {
  // res.send("hello");
  res.render("signup");
});

app.get("/upload", checkAuth, (req,res) =>{
   const success = req.query.success === "true";
   res.render("uploaddocument", {success});
});

app.get("/searchpdf", checkAuth, (req,res) =>{
  res.render("searchpdf");
})

app.get("/", checkAuth, async (req, res) => {
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

    // 1. Retrieve posts from user's connections
    const connectedUsers = user.connections; // Assuming this contains user IDs
    const feedPosts = await Post.find({ author: { $in: connectedUsers } })
      .sort({ createdAt: -1 }) // Sort by most recent posts first
      .populate("author");

    // 2. Retrieve the user's own posts
    const userPosts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 }) // Sort by most recent posts first
      .populate("author");

    // 3. Retrieve users who are not connected to the current user
    // const nonConnectedUsers = await User.find({
    //     _id: {
    //       $nin: connectedUsers.concat(user._id), // Exclude connected users and current user
    //     },
    //     _id: {
    //       $nin: user.pendingConnections, // Exclude users with pending connection requests
    //     },
    //   });
    const excludedUserIds = connectedUsers.concat(user._id, user.pendingConnections, user.sentConnections);

    const nonConnectedUsers = await User.find({
      _id: {
        $nin: excludedUserIds,
      },
       isVerified: true,
    });
    
    const combinedFeed = [...feedPosts, ...userPosts].map((post) => ({
      ...post.toObject(),
      user: { _id: user._id }, // Add user._id to each post
    }));
    combinedFeed.sort((a, b) => b.createdAt - a.createdAt);

    res.render("home", {
      user,
      combinedFeed,
      nonConnectedUsers,
    });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

const authController = require("./controllers/auth");
app.use("/auth", authController);

const postController = require("./controllers/post");
app.use("/v1", postController);

const userController = require("./controllers/user");
app.use("/v2", userController);

const uploadController = require("./controllers/uploadpdf");
app.use("/v3", uploadController);

app.get("/logout", (req, res) => {
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

app.listen(PORT, () => {
  console.log(`server is running at port no ${PORT}`);
});
