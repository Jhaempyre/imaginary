import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { bucket } from "../utils/gcp.js";
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import os from 'os';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadImage = asyncHandler(async (req, res) => {
    const { isPublic } = req.body;
    let originalFilePath, compressedFilePath;

    try {
        if (!req.file) {
            return res.status(400).json(
                new ApiResponse(400, {}, "No file uploaded")
            );
        }

        const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}-${req.file.filename}`;
        const tempDir = os.tmpdir();
        
        originalFilePath = path.join(tempDir, uniqueFilename);
        compressedFilePath = path.join(tempDir, `compressed_${uniqueFilename}`);

        // Move the uploaded file to the temp directory
        await fsPromises.rename(req.file.path, originalFilePath);

        // Compress the image outside the main process
        await compressImageOutsideProcess(originalFilePath, compressedFilePath);

        // Upload the compressed file to GCP
        const blob = bucket.file(uniqueFilename);
        await pipeline(
            fs.createReadStream(compressedFilePath),
            blob.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: req.file.mimetype,
                }
            })
        );

        if (isPublic) {
            await blob.makePublic();
        }

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

        // Clean up local files
        await Promise.all([
            fsPromises.unlink(originalFilePath).catch(error => console.error(`Failed to delete original file: ${error.message}`)),
            fsPromises.unlink(compressedFilePath).catch(error => console.error(`Failed to delete compressed file: ${error.message}`))
        ]);

        return res.status(200).json(
            new ApiResponse(200, { url: publicUrl }, `File uploaded ${isPublic ? 'publicly' : 'privately'} and processed successfully`)
        );

    } catch (error) {
        console.error("Upload Error: ", error);
        
        // Attempt to clean up any leftover files
        if (originalFilePath) await fsPromises.unlink(originalFilePath).catch(() => {});
        if (compressedFilePath) await fsPromises.unlink(compressedFilePath).catch(() => {});

        throw new ApiError(400, error.message || "Error uploading file");
    }
});

async function compressImageOutsideProcess(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const compressProcess = fork(path.join(__dirname, '../utils', 'compressWorker.js'));
        
        compressProcess.send({ inputPath, outputPath });
        
        compressProcess.on('message', (message) => {
            if (message.success) {
                resolve();
            } else {
                reject(new Error(message.error));
            }
        });
        
        compressProcess.on('error', reject);
        compressProcess.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Compression process exited with code ${code}`));
            }
        });
    });
}



//*things to learn in deep here is //
/* 
file system
os 
pipelines 
outside the process
fs link and unlink 
 
*/
export default uploadImage;