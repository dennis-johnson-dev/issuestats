import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import Immutable from 'immutable';
import moment from 'moment';
import Request from 'request';
import { buildRemaingPageLinks, getLastPageLink, getRequestOptions } from '../lib/Utils';
import SocketIO from 'socket.io';

export const getAllIssues = (req, reply) => {

    const options = getRequestOptions(req.params.owner, req.params.repo, 0);
    Request(options, (err, res) => {
      if (err) {
        console.log('there was an error contacting github', err);
        return err;
      }

      console.log('Remaining requests', res.headers['x-ratelimit-remaining']);

      let lastLinks = [];

      if (res.headers.link) {
        const lastPage = getLastPageLink(res.headers.link);
        lastLinks = buildRemaingPageLinks(req.params.owner, req.params.repo, lastPage);
      }

      // first request
      // io.emit('firstRequest', JSON.parse(res.body));

      return Promise.all(
        lastLinks.map((link, i) => {
          return new Promise((resolve, reject) => {
            Request(link, (err, resp) => {
              if (err) {
                console.log('there was an error contacting github', err);
                return err;
              }
              resolve(JSON.parse(resp.body));
            });
          });
        })
      ).then((vals) => {
        const flatVals = _.flatten(vals);
        let issues = JSON.parse(res.body).concat(flatVals).filter((innerIssue) => {
          return typeof innerIssue.pull_request === 'undefined';
        });
        console.log(issues.length);

        reply(
          `<!DOCTYPE html>
          <html>
          <head>
            <title>Issue Stats</title>
          </head>
          <body>
            <svg class="chart-holder" width="800" height="500"></svg>
            <script>
              
            </script>
            <script src="/assets/client.js"></script>
          </body>
          </html>
        `);
      }).catch((e) => console.log(e));
    });
  });
};
