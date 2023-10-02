const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  subjectname: {
    type: String,
    required: true,
  },
  filename: {
    type: String, 
    required: true,
  },
  pdf: {
    type: String, 
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const File = mongoose.model("File", fileSchema);

module.exports = File;
