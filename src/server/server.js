import Hapi from 'hapi';
import Path from 'path';

import plugins from './plugins';
import routes from './routes';

export const buildServer = async () => {
  return new Promise((resolve, reject) => {
    const server = new Hapi.Server();
    server.connection({
      port: 3000
    });

    server.register(plugins, (error) => {
      if (error) {
        console.error(error);
        reject(error);
      }

      server.route(routes);
      resolve(server);
    });
  });
};
