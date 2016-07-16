#!/usr/bin/env node
import * as child_process from "child_process";
import * as path from "path";
import {fromCallback, toCallback} from "@cspotcode/promise-cb";
const portfinder = require('portfinder');

async function main() {
  const nwAppPath = path.join(__dirname, '../nw-app');
  
  const shellScriptExtension = process.platform === 'win32' ? '.cmd' : '';
  const nodeDebugExecutable = path.join(require.resolve('node-inspector/package.json'), '../../.bin/node-debug') + shellScriptExtension;
  // nw renames its own package.json to work around some sort of bug.  Hacks on hacks on hacks.
  let nwPackage: any;
  let nwPackagePath: string;
  try {
    nwPackage = require(nwPackagePath = 'nw/package.json');
  } catch(e) {
    nwPackage = require(nwPackagePath = 'nw/package_backup.json');
  }
  const nwJs = require.resolve(path.join('nw', nwPackage.bin['nw']));

  const userDataDir = path.join(__dirname, '..', 'nw-user-data-dir');

  const webPort = await getPort();
  const debugPort = await getPort(webPort + 1);

  const nodeDebugArgs = [
    '-c',
    `--web-port=${webPort}`,
    `--debug-port=${debugPort}`,
    ...process.argv.slice(2)
  ];
  const debuggedProcess = child_process.spawn(nodeDebugExecutable, nodeDebugArgs, {
    stdio: 'inherit',
    shell: true
  });
  
  const inspectorArgs = [
    `http://127.0.0.1:${webPort}?port=${debugPort}`,
    `--nwapp=${nwAppPath}`,
    `--user-data-dir=${userDataDir}`
  ];
  const inspectorApp = child_process.spawn('node', [nwJs, ...inspectorArgs], {
    stdio: 'ignore',
    detached: true
  });
  
  const [exitCode, signal] = await waitForProcessToQuit(debuggedProcess);
}

/**
 * Note: not re-entrant.  Never run twice concurrently; only sequentially.
 */
async function getPort(startingFrom: number = portfinder.basePort): Promise<number> {
  const oldPort = portfinder.basePort;
  portfinder.basePort = startingFrom;
  const port = await fromCallback<number>(cb => portfinder.getPort(cb));
  portfinder.basePort = startingFrom;
  return port;
}

function waitForProcessToQuit(childProcess): Promise<[number,string]> {
  return new Promise((resolve, reject) => {
    childProcess.on('exit', (code: number, signal: string) => {
      resolve([code, signal]);
    });
  });
}

main().then(() => {
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
