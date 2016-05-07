import { getAllIssues } from '../handlers/Issues';

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
   handler: getAllIssues
}];
