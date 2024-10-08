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
import sharp from "sharp";
import { image } from "../models/image.models.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadViaImaginary = asyncHandler(async (req, res) => {
    const { isPublic  } = req.body;
    let originalFilePath, compressedFilePath;

    
    try {


        // -------------------------currently working for image only------------------------------v-1.0.0 release 

        if (!req.file) {
            return res.status(400).json(
                new ApiResponse(400, {}, "No file uploaded")
            );
        }
        //geting file and userInformation

        const OriginalFileName = req.file.filename
        console.log("original",OriginalFileName)
        const username = req.theUser.username
        console.log(username)
        const user_id = req.theUser._id
        console.log(req.file.mimetype)
        console.log("req.file",req.file)
        //genrating uniquename
        const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}-preview${req.file.filename}`;
        
        const tempDir = os.tmpdir();
        console.log("tempdir",tempDir)        
        originalFilePath = path.join(tempDir, uniqueFilename);
        compressedFilePath = path.join(tempDir, `compressed_${uniqueFilename}`);
                   
        // Move the uploaded file to the temp directory
        await fsPromises.rename(req.file.path, originalFilePath);

        // Compress the image outside the main process means without blocking the main thread of execution
        await compressImageOutsideProcess(originalFilePath, compressedFilePath);
        const metadata  = await sharp(originalFilePath).metadata()
        console.log(metadata)
        const nameOfFile = req.file.originalname
        const sizeOfFile = req.file.size
        const typeOfFile = req.file.mimetype
        const width = metadata.width
        const height = metadata.height
        


        // Upload the compressed file to GCP
        const blob = bucket.file(uniqueFilename);
        console.log("blob",blob)
        await pipeline(
            fs.createReadStream(compressedFilePath),
            blob.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: req.file.mimetype,
                }
            })
        );
        console.log("pipelines")
        if (isPublic) {
            await blob.makePublic();
        }

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;



        // Clean up local files
        await Promise.all([
            fsPromises.unlink(originalFilePath).catch(error => console.error(`Failed to delete original file: ${error.message}`)),
            fsPromises.unlink(compressedFilePath).catch(error => console.error(`Failed to delete compressed file: ${error.message}`))
        ]);
        const picture = await image.create({
            imageUrl : publicUrl,
            ownerId : user_id ,
            fileName : nameOfFile,
            fileSize : sizeOfFile,
            fileType : typeOfFile,
            width : width ,
            height : height ,
            metadata:metadata , 
            isPublic : isPublic

        })
        return res.status(200).json(
            new ApiResponse(200, {imageResponse:picture}, `File uploaded ${isPublic ? 'publicly' : 'privately'} and processed successfully`)
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

        //it creating a child process or running on non i/o thread 
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
export default uploadViaImaginary;