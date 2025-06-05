const { execSync } = require('child_process');

describe('Restore script', () => {
  it('esegue restore senza errori', () => {
    const output = execSync('sh ./scripts/restore.sh').toString();
    expect(output).toMatch(/Restore completato/);
  });
}); 