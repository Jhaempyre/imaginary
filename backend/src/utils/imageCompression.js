import sharp from 'sharp';
import path from 'path';

const compressImage = async (inputPath, outputPath) => {
    await sharp(inputPath)
        .resize(800) // Optional: Resize to a max width of 800px
        .toFormat('jpeg', { quality: 80 }) // Change to desired format and quality
        .toFile(outputPath);
};



//we will add functionality for developer to shape things like they can choose format and desired quality , it's currently hardcoded only .
//we will also add functionality to handle errors and exceptions

export default compressImage;