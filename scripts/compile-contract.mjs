import { spawnSync } from 'node:child_process';

const command = process.env.MIDNIGHT_COMPACT_BIN ?? 'compact';
const probe = spawnSync(command, ['--version'], { encoding: 'utf8', shell: true });
const probeOutput = `${probe.stdout ?? ''}${probe.stderr ?? ''}`;
if (probeOutput.includes('Listing ') || probeOutput.includes('The system cannot find the file specified')) {
  console.error('The command named "compact" is Windows file compression, not the Midnight Compact compiler.');
  console.error('Install the Midnight Compact compiler and set MIDNIGHT_COMPACT_BIN to its executable if needed.');
  process.exit(1);
}

const result = spawnSync(command, ['compile', 'src/private-party-rsvp.compact', 'src/managed/private-party'], {
  cwd: 'contract',
  stdio: 'inherit',
  shell: true,
});
process.exit(result.status ?? 1);
