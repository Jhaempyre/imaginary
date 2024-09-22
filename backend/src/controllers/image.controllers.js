import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { bucket } from "../utils/gcp.js";
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const uploadImage = asyncHandler(async (req, res) => {
    try {
        console.log("1");

        if (!req.file) {
            return res.status(400).json(
                new ApiResponse(400, {}, "No file uploaded")
            );
        }
        
        console.log("2");

        const fileName = `${Date.now()}-${req.file.originalname}`;
        console.log("Generated file name: ", fileName);
        
        const blob = bucket.file(fileName);
        console.log("GCP Blob: ", blob);

        const blobStream = blob.createWriteStream({
            resumable: false,
        });

        console.log("Blob stream created, starting upload...");

        // Write the file buffer to the blob stream
        blobStream.end(req.file.buffer);

        // Error handling for the stream
        blobStream.on('error', (err) => {
            console.error("Stream Error: ", err.message);
            throw new ApiError(400, err.message);
        });


        // Finish event is triggered when the file is fully uploaded
        blobStream.on('finish', async () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            console.log("Upload finished, public URL: ", publicUrl);
            // Get the current directory name in an ES module
            const __filename = fileURLToPath(import.meta.url);  // This gives the current file path
            const __dirname = path.dirname(__filename);         // This gives the current directory
            // Remove the file from the local public/temp directory
            const filePath = path.join(__dirname, '../../public/temp', req.file.originalname); // Adjust the path based on your structure
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("Error removing file: ", err.message);
                } else {
                    console.log("File removed from local directory successfully.");
                }
            });

            return res.status(200).json(
                new ApiResponse(200, { url: publicUrl }, "File uploaded successfully")
            );
        });

    } catch (error) {
        console.error("Upload Error: ", error.message);
        throw new ApiError(400, error.message);
    }
});

export default uploadImage;
