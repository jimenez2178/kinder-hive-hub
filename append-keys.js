const fs = require('fs');
let content = fs.readFileSync('keys.txt', 'utf16le');
if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
}
const keys = JSON.parse(content);
const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const newEnv = envContent + `\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n`;
fs.writeFileSync(envPath, newEnv);
console.log('Keys added to .env.local');
