const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

describe('Import script', () => {
  it('importa uno zip nella cartella Media', () => {
    // Crea zip dummy
    const zip = new AdmZip();
    const testFile = 'Media/test-import.txt';
    fs.writeFileSync(testFile, 'import test');
    zip.addLocalFile(testFile);
    const zipPath = './test-import.zip';
    zip.writeZip(zipPath);
    fs.unlinkSync(testFile);
    // Esegui import
    const output = execSync(`sh ./scripts/import.sh ${zipPath}`).toString();
    expect(output).toMatch(/Import completato/);
    // Cleanup
    fs.unlinkSync(zipPath);
    fs.unlinkSync('Media/test-import.txt');
  });
}); 