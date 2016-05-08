import { buildServer } from './server';

async function start() {
  const server = await buildServer();

  server.start(() => {
    console.log('Server running at:', server.info.uri);
  });
}

start();
