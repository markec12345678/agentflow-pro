import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const guestPath = path.join(__dirname, 'src', 'app', 'guest');
console.log('src/app/guest:', fs.readdirSync(guestPath).join(' | '));

const apiGuestPath = path.join(__dirname, 'src', 'app', 'api', 'guest');
console.log('src/app/api/guest:', fs.readdirSync(apiGuestPath).join(' | '));