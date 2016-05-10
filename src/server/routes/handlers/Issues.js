import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import Immutable from 'immutable';
import moment from 'moment';
import Request from 'request';
import { getLastPageLink, buildRemaingPageLinks } from '../lib/Utils';

export const getAllIssues = (req, reply) => {
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
      console.log(res.headers);
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
          })
        })
      ).then((links) => {
        const allRemainingIssues = links.reduce((acc, link) => {
          link.forEach((innerIssue) => {
            acc.push(innerIssue);
          });

          return acc;
        }, []);

        let allIssues = JSON.parse(res.body).concat(allRemainingIssues).filter((innerIssue) => {
          return typeof innerIssue.pull_request === 'undefined';
        });

        allIssues = _.sortBy(allIssues, (item) => moment(item.created_at).valueOf());
        let dates = Immutable.OrderedMap({});

        for (let i = 0; i < allIssues.length; i++) {
          const createdDate = moment(allIssues[i].created_at);
          const now = moment();
          const endDate = moment(allIssues[i].closed_at || now);
          let dateIndex = createdDate;

          do {
            if (dates.has(dateIndex.format('YYYY-MM-DD'))) {
              dates = dates.set(dateIndex.format('YYYY-MM-DD'), dates.get(dateIndex.format('YYYY-MM-DD')).push(allIssues[i].number));
            } else {
              dates = dates.set(dateIndex.format('YYYY-MM-DD'), Immutable.List([allIssues[i].number]));
            }
            dateIndex = moment(dateIndex).add(1, 'day');
          } while (dateIndex.format('YYYY-MM-DD') <= endDate.format('YYYY-MM-DD'))
        }

        let finalResult = dates.map((val, key) => {
          return {
            x: key,
            y: val.size
          };
        }).toArray();

        const labels = JSON.stringify(dates.map((val, key) => key).toArray());
        const data = JSON.stringify(dates.map((val, key) => val.size).toArray());

        reply(
          `<!DOCTYPE html>
          <html>
          <head>
          </head>
          <body>
            <div class="chart">
              <canvas class="chartHolder" width="400" height="400"></canvas>
            </div>
            <script>
              var data = ${data};
              var labels = ${labels};
            </script>
            <script src="/assets/client.js"></script>
          </body>
          </html>
        `);
      })
      .catch((e) => console.log(e)
    );
  });
}
