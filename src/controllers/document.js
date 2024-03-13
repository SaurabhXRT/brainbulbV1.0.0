const express = require("express");
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const streamifier = require("streamifier");

const app = express();
const db = require("../config/db");
app.use(express.json());
const router = express.Router();
// app.use(bodyParser.json());
// app.use(express.json());
router.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

const fileschema = new mongoose.Schema({
  pdf: {
    type: String,
  },
});
const File = mongoose.model("Files", fileschema);

const { google } = require("googleapis");


const drive = google.drive("v3");

const auth = new google.auth.GoogleAuth({
  keyFile: "../key.json",
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const driveClient = async () => {
  const authClient = await auth.getClient();
  google.options({ auth: authClient });
  return drive;
};

// const uri =
//   "mongodb+srv://saurabhkumar:rVKACHYbuzYy7VMs@cluster0.n4zogin.mongodb.net/blogginggg?retryWrites=true&w=majority";

// mongoose.set("strictQuery", false);
// mongoose.connect(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// const db = mongoose.connection;

// db.on("error", console.error.bind(console, "connection error:"));
// db.once("open", function () {
//   console.log("Connected to MongoDB...");
// });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

router.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const drive = await driveClient();
    const fileMetadata = {
      name: req.file.originalname,
    };
    const fileStream = streamifier.createReadStream(req.file.buffer);
    const media = {
      mimeType: "application/pdf",
      body: fileStream,
    };
    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "webViewLink, id",
    });
    const fileId = response.data.id;
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader", 
        type: "anyone",
      },
    });
    const file = new File({ pdf: response.data.webViewLink });
    await file.save();
    console.log(file);
    res.json({ success: true, message: "File uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error uploading file" });
  }
});


router.get("/search", async (req, res) => {
    try {
      const decodedToken = jwt.decode(req.cookies.token);
      if (!decodedToken) {
        return res.status(401).send("Unauthorized");
      }
      const username = decodedToken.username;
      const user = await User.findOne({ username });
      const searchQuery = req.query.subjectname;
      const results = await File.find({
        subjectname: { $regex: searchQuery, $options: "i" },
      })
        .populate("uploadedBy", "username") // Populate the 'uploadedBy' field with the 'username' property
        .exec();
      if (results.length === 0) {
        return res.render("searchpdf", { displayResultsx: "block" });
      } else {
        const formattedResults = results.map((result) => ({
          subjectname: result.subjectname,
          filename: result.filename,
          pdf: result.pdf,
          uploadedBy: result.uploadedBy.username, 
        }));
        res.render("searchpdf", {
          formattedResults,
          user,
          displayResults: "block",
        });
        return;
      }
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Error searching for documents." });
    }
  });

module.exports = router;

