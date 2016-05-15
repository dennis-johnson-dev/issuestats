import { buildServer } from './server';
import SocketIO from 'socket.io';

async function start() {
  const server = await buildServer();

  server.start(() => {
    console.log('Server running at:', server.info.uri);
  });
}

start();
