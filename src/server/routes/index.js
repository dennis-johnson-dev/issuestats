import * as Issues from './handlers/Issues';

export default [{
  method: 'GET',
   path: '/',
   handler: (request, reply) => {
     reply(
       `<!DOCTYPE html>
       <html>
         <head>

         </head>
         <body>
          yo, try adding a owner | org/repo to the URL
        </body>
       </html>
       `
     );
   }
}, {
  method: 'GET',
    path: '/{owner}/{repo}',
    handler: Issues.getAllIssues
}, {
  method: 'GET',
  path: '/assets/{param*}',
  handler: {
    directory: {
      path: 'build'
    }
  }
}, {
  method: 'GET',
  path: '/test',
  handler: (req, reply) => {
    return reply(
      `<!DOCTYPE html>
      <html>
      <head>
      </head>
      <body>
        <svg class="chart-holder" width="500" height="500"></svg>
        <script src="/assets/client.js"></script>
      </body>
      </html>
    `);
  }
}];
