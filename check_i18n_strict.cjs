const fs = require('fs');
const path = require('path');

const arDir = path.join(__dirname, 'src/locales/ar');

function checkArFiles() {
    console.log('--- Checking Arabic Files (Strict) ---');
    const files = fs.readdirSync(arDir);
    files.forEach(file => {
        const data = require(path.join(arDir, file));
        checkArKeys(data, file);
    });
}

function checkArKeys(obj, prefix) {
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            const val = obj[key];
            if (/[a-zA-Z]/.test(val)) {
                console.log(`[${prefix}] ${key}: ${val}`);
            }
        } else if (typeof obj[key] === 'object') {
            checkArKeys(obj[key], `${prefix}.${key}`);
        }
    }
}

checkArFiles();
