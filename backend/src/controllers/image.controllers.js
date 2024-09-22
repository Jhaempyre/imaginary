import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { bucket } from "../utils/gcp.js";

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
            resumable: false, // Non-resumable for simplicity
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
        blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            console.log("Upload finished, public URL: ", publicUrl);
            
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
