import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { bucket } from "../utils/gcp.js";
import fs from 'fs';
import path from 'path';
import { promisify } from 'util'; // For using async/await with fs

const unlinkAsync = promisify(fs.unlink); // Convert fs.unlink to return a promise

const uploadImage = asyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json(
                new ApiResponse(400, {}, "No file uploaded")
            );
        }

        const filePath = path.join('./public/temp', req.file.filename);
        const blob = bucket.file(req.file.filename);

        // Create stream to upload file from disk
        const blobStream = blob.createWriteStream({
            resumable: false,
        });

        // Handle error in blob stream
        blobStream.on('error', (err) => {
            throw new ApiError(400, err.message);
        });

        // Upload the file from disk
        fs.createReadStream(filePath).pipe(blobStream);

        // Handle finish event after file is uploaded
        blobStream.on('finish', async () => {
            await blob.makePublic();

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            
            // Remove file from local disk after successful upload
            await unlinkAsync(filePath);

            return res.status(200).json(
                new ApiResponse(200, { url: publicUrl }, "File uploaded and removed from local directory successfully")
            );
        });

    } catch (error) {
        console.error("Upload Error: ", error.message);
        throw new ApiError(400, error.message);
    }
});

export default uploadImage;
