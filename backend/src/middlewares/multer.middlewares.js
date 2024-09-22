import multer from "multer";
import path from "path";

// Set storage engine for multer (disk storage)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp"); // Save the file to this temp directory
    },
    filename: function (req, file, cb) {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    }
});

export const upload = multer({ storage: storage });
