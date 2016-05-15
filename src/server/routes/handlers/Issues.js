import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import Immutable from 'immutable';
import moment from 'moment';
import Request from 'request';
import { getLastPageLink, buildRemaingPageLinks } from '../lib/Utils';
import SocketIO from 'socket.io';

export const getAllIssues = (req, reply) => {
  const io = SocketIO(req.server.listener);

  reply(
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

  io.on('connection', (socket) => {
    console.log('connected');

    const options = {
      headers: {
        "Authorization": `token ${process.env.ISSUE_STATS_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "user-agent": "IssueStats"
      },
      method: 'GET',
      url: `https://api.github.com/repos/${req.params.owner}/${req.params.repo}/issues?per_page=100&sort=created&state=all`
    };

    Request(options, (err, res) => {
      console.log('Remaining requests', res.headers['x-ratelimit-remaining']);
      let lastLinks = [];
      if (res.headers.link) {
        const lastPage = getLastPageLink(res.headers.link);
        lastLinks = buildRemaingPageLinks(req.params.owner, req.params.repo, lastPage);
      }
      return Promise.all(
        lastLinks.map((link) => {
          return new Promise((resolve, reject) => {
            Request(link, (err, resp) => {
              resolve(JSON.parse(resp.body));
            });
          }).then((val) => {
            io.emit('processing', val);
            return val;
          });
        })
      ).then((links) => {
        const allRemainingIssues = links.reduce((acc, link) => {
          link.forEach((innerIssue) => {
            acc.push(innerIssue);
          });

          return acc;
        }, []);

        const allIssues = JSON.parse(res.body).concat(allRemainingIssues).filter((innerIssue) => {
          return typeof innerIssue.pull_request === 'undefined';
        });

        const sortedIssues = _.sortBy(allIssues, (item) => moment(item.created_at).valueOf());
        let dates = Immutable.OrderedMap({});

        for (let i = 0; i < sortedIssues.length; i++) {
          const createdDate = moment(sortedIssues[i].created_at);
          const now = moment();
          const endDate = moment(sortedIssues[i].closed_at || now);
          let dateIndex = createdDate;

          do {
            if (dates.has(dateIndex.format('YYYY-MM-DD'))) {
              dates = dates.set(dateIndex.format('YYYY-MM-DD'),
                dates.get(dateIndex.format('YYYY-MM-DD')).push(allIssues[i].number)
              );
            } else {
              dates = dates.set(dateIndex.format('YYYY-MM-DD'),
                Immutable.List([allIssues[i].number])
              );
            }
            dateIndex = moment(dateIndex).add(1, 'day');
          } while (dateIndex.format('YYYY-MM-DD') <= endDate.format('YYYY-MM-DD'))
        }

        const finalResult = dates.map((val, key) => {
          return {
            x: key,
            y: val.size
          };
        }).toArray();

        io.emit('update', finalResult);
      }).catch((e) => console.log(e));
    });
  });
};
