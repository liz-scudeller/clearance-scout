import { createApp } from './app.js';
import { env, validateEnv } from './config/env.js';

validateEnv();

const app = createApp();
const startPort = Number(env.port);
let currentPort = startPort;
let server = listen(currentPort);

function listen(port) {
  const nextServer = app.listen(port, () => {
    const fallbackNote = port === startPort ? '' : ` (PORT ${startPort} was busy)`;
    console.log(`SaleRadar API listening on http://localhost:${port}${fallbackNote}`);
  });

  nextServer.on('error', (error) => handleListenError(error));
  return nextServer;
}

function handleListenError(error) {
  if (error.code === 'EADDRINUSE') {
    currentPort += 1;
    if (currentPort > startPort + 10) {
      console.error(`Ports ${startPort}-${currentPort} are unavailable. Stop another server or set PORT in server/.env.`);
      process.exit(1);
    }

    console.warn(`Port ${currentPort - 1} is already in use. Trying ${currentPort}...`);
    server = listen(currentPort);
    return;
  }

  throw error;
}
