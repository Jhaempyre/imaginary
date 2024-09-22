import crypto from 'crypto';
import fs from 'fs';
import { promisify } from 'util';

const algorithm = 'aes-256-cbc'; // Encryption algorithm
const key = crypto.randomBytes(32); // Key for encryption
const iv = crypto.randomBytes(16);  // Initialization vector



//will think on it later ....