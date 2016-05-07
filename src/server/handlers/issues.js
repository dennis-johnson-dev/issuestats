import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import moment from 'moment';
import Request from 'request';
import { getLastPageLink, buildRemaingPageLinks } from '../lib/Utils';

export const getAllIssues = (req, reply) => {
  const allIssues = require('../../../data/issues.json');
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
}
