// utils/compressWorker.js
import compressImage from "./imageCompression.js";

process.on('message', async ({ inputPath, outputPath }) => {
    try {
        await compressImage(inputPath, outputPath);
        process.send({ success: true });
    } catch (error) {
        process.send({ success: false, error: error.message });
    } finally {
        process.exit();
    }
});