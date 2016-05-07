const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const moment = require('moment');
const Request = require('request');
const { getLastPageLink, buildRemaingPageLinks } = require('../lib/Utils');

module.exports = {
  getAllIssues: (req, reply) => {
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
      if (res.headers.link) {
        const lastPage = getLastPageLink(res.headers.link);
        const lastLinks = buildRemaingPageLinks(req.params.owner, req.params.repo, lastPage);
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

          const allIssues = JSON.parse(res.body).concat(allRemainingIssues).filter((innerIssue) => {
            return typeof innerIssue.pull_request === 'undefined';
          });

          fs.writeFile(path.resolve(__dirname, '../data/issues.json'), JSON.stringify(allIssues), {
            encoding: 'utf8'
          });

          const dataTwo = allIssues.reduce((acc, issue) => {
            const day = moment(issue.created_at).format('YYYY-MM-DD');
            acc[day] = acc[day] ? acc[day] + 1 : 1;
            return acc;
          }, {});

          const sortedDays = _.sortBy(Object.keys(dataTwo));
          let sortedKeys = {};

          _.each(sortedDays, (day) => {
            sortedKeys[day] = dataTwo[day];
          });

          let finalResult = [];
          _.each(sortedKeys, (val, key) => {
            const previous = finalResult.length ? finalResult[finalResult.length - 1] : { y: 0 };
            finalResult.push({
              x: key,
              y: val + previous.y
            });
          });

          const data = JSON.stringify(finalResult);

          reply(
            `<!DOCTYPE html>
            <html>
            <head>
              <script src="https://npmcdn.com/moment@2.13.0/min/moment.min.js"></script>
              <script src="https://cdn.jsdelivr.net/lodash/4.11.2/lodash.core.min.js"></script>
              <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.0.1/Chart.min.js"></script>
            </head>
            <body>
              <canvas id="myChart" width="400" height="400"></canvas>
              <script>
                var chartData = ${data}.map((datum) => {
                  return {
                    x: new moment(datum.x).toDate(),
                    y: datum.y
                  };
                });
                var ctx = document.getElementById("myChart");
                var timeFormat = 'MM/DD/YYYY HH:mm';
                var myChart = new Chart(ctx, {
                  type: 'line',
                  options: {
                    responsive: true
                  },
                  data: {
                    datasets: [
                      {
                        fill: false,
                        label: 'Issues Opened',
                        data: chartData
                      },
                    ]
                  },
                  options: {
                    scales: {
                      xAxes: [{
            						type: "time",
            						time: {
            							format: timeFormat,
            							tooltipFormat: 'll HH:mm'
            						},
            						scaleLabel: {
            							display: true,
            							labelString: 'Date'
            						}
            					}],
            					yAxes: [{
            						scaleLabel: {
            							display: true,
            							labelString: 'value'
            						}
            					}]
                    }
                  }
                });
              </script>
            </body>
            </html>
          `);
        }).catch((e) => {
          console.log('something bad happened', e);
        });
      } else {
        return reply(
          `<!DOCTYPE html>
          <html>
          <head>
          </head>
          <body>
            yo!
          </body>
          </html>
          `
        );
      }
    });
  }
};
