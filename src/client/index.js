import d3 from 'd3';
import moment from 'moment';
import _ from 'lodash';
import Immutable from 'immutable';
import IOClient from 'socket.io-client';
import ParseIssues from './utils/ParseIssues';
import './styles/main.css';

// initial data
const processStart = moment();
let data = ParseIssues(issues);
console.log('processing cost', moment().diff(processStart));

const margin = {top: 30, right: 0, bottom: 30, left: 50},
  width = 800 - margin.left - margin.right,
  height = 360 - margin.top - margin.bottom;

const div = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Parse the date / time
const parseDate = d3.time.format("%d-%b-%Y").parse;

const formatTime = d3.time.format("%e %B");

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

svg.selectAll("dot")
    .data(data)
  .enter().append("circle")
    .attr("class", "circle")
    .attr("r", 2)
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .on("mouseover", (d) => {
      div.transition()
        .duration(200)
        .style("opacity", .9);
      div	.html(formatTime(d.x) + "<br/>"  + d.y)
        .style("left", (d3.event.pageX - 32) + "px")
        .style("top", (d3.event.pageY - 39) + "px");
    })
    .on("mouseout", function(d) {
      div.transition()
        .duration(500)
        .style("opacity", 0);
    })
