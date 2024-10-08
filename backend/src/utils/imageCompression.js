import sharp from 'sharp';
import path from 'path';

const compressImage = async (inputPath, outputPath) => {
    
   try {
         const image = sharp(inputPath);
     
         // Get metadata to determine the original format
         const { format } = await image.metadata();
     
         // Supported formats for compression
         const supportedFormats = ['jpeg', 'png', 'webp', 'tiff', 'avif'];
     
         if (!supportedFormats.includes(format)) {
           throw new Error(`Unsupported image format: ${format}`);
         }
     
         await image
           .resize(800) // Optional: Resize to a max width of 800px
           .toFormat(format, { quality: 80 }) // Maintain the original format and apply quality setting
           .toFile(outputPath);
           
       } catch (error) {
         throw new Error(`Failed to process image: ${error.message}`);
       }
}




//we will add functionality for developer to shape things like they can choose format and desired quality , it's currently hardcoded only .
//we will also add functionality to handle errors and exceptions

export default compressImage;