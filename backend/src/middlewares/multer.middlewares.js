import multer from "multer";
import path from "path"; // Node.js module to handle file paths

// Configure disk storage for multer
const storage = multer.diskStorage({
  // Define the destination folder for uploaded files
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Saving files to './public/temp'
  },
  
  // Modify the file's original name to something unique
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const fileExtension = path.extname(file.originalname); // Extract the file extension
    const baseName = path.basename(file.originalname, fileExtension); // Get the base name without the extension

    // Create a unique file name (e.g., 'image-1234567890.jpg')
    cb(null, `${baseName}-${uniqueSuffix}${fileExtension}`);
  }
});

// Export the multer instance with the configured storage
export const upload = multer({ storage: storage });
