const fs = require('fs');
const path = require('path');

const arDir = path.join(__dirname, 'src/locales/ar');
const frDir = path.join(__dirname, 'src/locales/fr');

function checkArFiles() {
    console.log('--- Checking Arabic Files ---');
    const files = fs.readdirSync(arDir);
    files.forEach(file => {
        const data = require(path.join(arDir, file));
        checkArKeys(data, file);
    });
}

function checkArKeys(obj, prefix) {
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            // Match if it contains [A-Za-z] but ignore placeholders like {{...}}, "MaClinic", "SOAP", "I10", emails, "+1"
            const val = obj[key];
            const cleanVal = val.replace(/\{\{[^}]+\}\}/g, '').replace(/MaClinic/g, '').replace(/SOAP/g, '').replace(/[a-zA-Z]@[a-zA-Z]+\.[a-zA-Z]+/g, '').replace(/I10/g, '').replace(/PDF/g, '').replace(/[SOPAQ]\s*—/g, '');
            if (/[a-zA-Z]/.test(cleanVal)) {
                console.log(`[${prefix}] ${key}: ${val}`);
            }
        } else if (typeof obj[key] === 'object') {
            checkArKeys(obj[key], `${prefix}.${key}`);
        }
    }
}

function checkFrFiles() {
    console.log('--- Checking French Files ---');
    const files = fs.readdirSync(frDir);
    files.forEach(file => {
        const data = require(path.join(frDir, file));
        checkFrKeys(data, file);
    });
}

function checkFrKeys(obj, prefix) {
    // looking for english words like Health, Avenue, Medical, Penicillin, Pollen
    const engWords = ['Health', 'Avenue', 'Medical', 'District', 'Penicillin', 'Pollen', 'Staff', 'SOAP', 'Default'];
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            const val = obj[key];
            for (const word of engWords) {
                if (val.includes(word)) {
                    console.log(`[${prefix}] ${key}: ${val}`);
                    break;
                }
            }
        } else if (typeof obj[key] === 'object') {
            checkFrKeys(obj[key], `${prefix}.${key}`);
        }
    }
}

checkArFiles();
checkFrFiles();
