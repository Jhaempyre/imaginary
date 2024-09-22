import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { bucket } from "../utils/gcp.js";
import fs from 'fs/promises';
import path from 'path';
import compressImage from "../utils/imageCompression.js";

const uploadImage = asyncHandler(async (req, res) => {
    const { isPublic } = req.body; // Public or private flag
    let filePath, compressedFilePath;

    try {
        if (!req.file) {
            return res.status(400).json(
                new ApiResponse(400, {}, "No file uploaded")
            );
        }

        filePath = path.join('./public/temp', req.file.filename);
        compressedFilePath = path.join('./public/temp', `compressed_${req.file.filename}`);

        // Compress the image
        await compressImage(filePath, compressedFilePath);

        // Upload the compressed file to GCP
        const blob = bucket.file(`compressed_${req.file.filename}`);
        await blob.save(await fs.readFile(compressedFilePath), {
            resumable: false,
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        if (isPublic) {
            // Make the file publicly accessible
            await blob.makePublic();
        }

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

        // Clean up local files
        const cleanupTasks = [
            deleteFileWithRetry(compressedFilePath),
            deleteFileWithRetry(filePath)
        ];

        await Promise.all(cleanupTasks);

        return res.status(200).json(
            new ApiResponse(200, { url: publicUrl }, `File uploaded ${isPublic ? 'publicly' : 'privately'} and removed from local directory successfully`)
        );

    } catch (error) {
        console.error("Upload Error: ", error);

        // Attempt to clean up any leftover files
        if (filePath) await deleteFileWithRetry(filePath);
        if (compressedFilePath) await deleteFileWithRetry(compressedFilePath);

        throw new ApiError(400, error.message || "Error uploading file");
    }
});

async function deleteFileWithRetry(filePath, maxRetries = 5, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await fs.unlink(filePath);
            console.log(`Successfully deleted ${filePath}`);
            return;
        } catch (error) {
            if (i === maxRetries - 1) {
                console.error(`Failed to delete ${filePath} after ${maxRetries} attempts:`, error);
            } else {
                console.log(`Attempt ${i + 1} to delete ${filePath} failed, retrying in ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

export default uploadImage;