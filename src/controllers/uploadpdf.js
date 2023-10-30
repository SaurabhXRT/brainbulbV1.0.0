const express = require("express");
const app = express();
const User = require("../model/User");
const File = require("../model/Upload");
const jwt = require("jsonwebtoken");
const checkAuth = require("../middleware/checkauth");
const router = express.Router();
const fileUpload = require("express-fileupload");
app.use(fileUpload());
const streamifier = require("streamifier");
app.use(express.json());
router.use(express.json());
app.use(express.urlencoded({ extended: true }));
// const multer = require("multer");
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

const { google } = require("googleapis");
const drive = google.drive("v3");
const auth = new google.auth.GoogleAuth({
  keyFile: "key.json",
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const driveClient = async () => {
  const authClient = await auth.getClient();
  google.options({ auth: authClient });
  return drive;
};

router.post("/upload", checkAuth, async (req, res) => {
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
    if (!req.files || !req.files.pdf) {
      return res.status(400).send("No file uploaded.");
    }
    const drive = await driveClient();
    const uploadedFile = req.files.pdf;
    
    console.log(uploadedFile);
    const fileMetadata = {
      name: uploadedFile.name,
    };

    const media = {
      mimeType: uploadedFile.type,
      body: streamifier.createReadStream(uploadedFile.data),
    };

    // const fileStream = streamifier.createReadStream(req.file.buffer);
    // const media = {
    //   mimeType: "application/pdf",
    //   body: fileStream,
    // };


    

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

    const file = new File({
      subjectname: req.body.subjectname,
      filename: uploadedFile.name,
      pdf: response.data.webViewLink,
      uploadedBy: user._id,
    });

    await file.save();
    console.log(file);
    res.redirect("/upload?success=true");
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
      .populate("uploadedBy", "username") 
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
