import { Storage } from '@google-cloud/storage';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current directory name in an ES module
const __filename = fileURLToPath(import.meta.url);  // This gives the current file path
const __dirname = path.dirname(__filename);         // This gives the current directory

// Initialize Google Cloud Storage with the credentials file
const storage = new Storage({
  keyFilename: path.join(__dirname, '../utils/gcp-credentials.json'),  // Path to the service account key file
  projectId: process.env.GCP_PROJECT_ID,  // Set the GCP Project ID in your .env file
});

// Reference to the specific storage bucket
const bucketName = process.env.GCP_BUCKET_NAME;  // Set the bucket name in your .env file
const bucket = storage.bucket(bucketName);

export {
  storage,
  bucket
};
