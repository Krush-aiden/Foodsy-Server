import multer from "multer";

// Configure disk storage
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept only PNG and JPEG files
  if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("Only PNG and JPEG files are allowed!"), false); // Reject the file
  }
};

// Set up Multer with storage and file filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
});

export default upload;
