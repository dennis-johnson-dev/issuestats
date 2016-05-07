import Hapi from 'hapi';
import routes from './routes';

const server = new Hapi.Server();
server.connection({ port: 3000 });

server.route(routes);

server.start((err) => {
  if (err) {
    throw err;
  }

  console.log('Server running at:', server.info.uri);
});
