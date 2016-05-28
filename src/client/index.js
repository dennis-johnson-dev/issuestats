import d3 from 'd3';
import moment from 'moment';
import _ from 'lodash';
import Immutable from 'immutable';
import IOClient from 'socket.io-client';
import ParseIssues from './utils/ParseIssues';
import './styles/main.css';

const ioClient = IOClient();

// initial data
let data = [];

const margin = {top: 30, right: 20, bottom: 30, left: 50},
  width = 640 - margin.left - margin.right,
  height = 360 - margin.top - margin.bottom;

// Parse the date / time
const parseDate = d3.time.format("%d-%b-%Y").parse;

// Set the ranges
const x = d3.time.scale().range([0, width]);
const y = d3.scale.linear().range([height, 0]);

// Define the axes
const xAxis = d3.svg.axis().scale(x)
  .orient("bottom").ticks(5);
const yAxis = d3.svg.axis().scale(y)
  .orient("left").ticks(5);

// Define the line
const valueline = d3.svg.line()
  .x((d) => x(d.x))
  .y((d) => y(d.y))

// Adds the svg canvas
const svg = d3.select(".chart-holder")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Scale the range of the data
x.domain(d3.extent(data, (d) => d.x));
y.domain([0, d3.max(data, (d) => d.y)]);

// Add the X Axis
svg.append("g")
.attr("class", "x axis")
.attr("transform", "translate(0," + height + ")")
.call(xAxis);

// Add the Y Axis
svg.append("g")
.attr("class", "y axis")
.call(yAxis);

// Add the valueline path.
svg.append("path")
  .attr("class", "line")
  .attr("d", valueline(data));

const update = (newData) => {

  // Scale the range of the data again
	x.domain(d3.extent(newData, (d) => d.x));
  y.domain([0, d3.max(newData, (d) => d.y)]);

  // Select the section we want to apply our changes to
  const svg = d3.select(".chart-holder").transition();

  // Make the changes
  svg.select(".line")
    .attr("d", valueline(newData));
  // svg.selectAll("dot")
  //     .data(newData)
  //   .enter().append("circle")
  //     .attr("r", 3.5)
  //     .attr("cx", function(d) { return x(d.x); })
  //     .attr("cy", function(d) { return y(d.y); });
  svg.select(".x.axis")
    .call(xAxis);
  svg.select(".y.axis")
    .call(yAxis);
};

// ioClient.on('update', (msg, foo) => {
//   console.log('yo');
//   console.log(msg, foo);
// });

ioClient.on('firstRequest', (firstIssues) => {
  data = firstIssues;
  update(ParseIssues(firstIssues));
});
