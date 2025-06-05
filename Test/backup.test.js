const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Backup script', () => {
  it('crea uno zip della cartella Media', () => {
    const output = execSync('sh ./scripts/backup.sh').toString().trim();
    expect(output).toMatch(/media-backup-\d{8}-\d{6}\.zip/);
    expect(fs.existsSync(output)).toBe(true);
    // Cleanup
    fs.unlinkSync(output);
  });
}); 