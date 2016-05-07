const { getAllIssues } = require('../handlers/issues');

module.exports = [{
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
   handler: getAllIssues
}];
