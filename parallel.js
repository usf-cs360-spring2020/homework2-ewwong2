/**
 * Inspirations: https://www.d3-graph-gallery.com/graph/parallel_basic.html
 * For structure: https://blockbuilder.org/sjengle/8c2b8064e0e6971a89f0
 */

// setup svg
const svg = d3.select('body').select('svg#parallel');

// get current hard-coded size of svg
const size = {
  width: parseInt(svg.attr('width')),
  height: parseInt(svg.attr('height'))
};

// set padding
const pad = {top: 15, right: 85, bottom: 25, left: 15};

// setup plot area
const plot = svg.select('g#plot');
plot.attr('transform', `translate(${pad.left}, ${pad.top})`);

// setup plot width and height
const width = size.width - pad.left - pad.right;
const height = size.height - pad.top - pad.bottom;

// setup scales and ranges
// This will be filled with each dimension later.
const y = {};
// From the https://www.d3-graph-gallery.com/graph/parallel_basic.html, we will
// set up the x-axis to help align the y-axes
// Domain will be set soon...
const x = d3.scalePoint()
  .range([0, width])
  .padding(0.5);

const color = d3.scaleOrdinal()
  .range(d3.schemeTableau10);

var dimensions;

d3.csv("mrc_table2_1.csv", convert).then(draw);

function draw(data) {
  // console.table(data);
  // Type will be used as color so we will not make an axis for it
  dimensions = d3.keys(data[0]).filter(d => d != "Type");

  for (dim in dimensions) {
    let name = dimensions[dim];
    y[name] = d3.scaleLinear()
      .domain(d3.extent(data, d => d[name]))
      .range([height, 0]);
  }

  x.domain(dimensions);

  color.domain(data.map(d => d['Type']));

  // since our g elements are already in the proper order, we can draw our svg
  // elements in any order we want
  drawLines(data);
  drawAxis(data);
  drawLegend(data);
}

/**
 * Since all data has been preprocessed in Python, we just need to make sure
 * float values are treated as floats.
 */
function convert(input) {
  input['Parent Rank'] = +input['Parent Rank'];
  input['Kid Rank'] = +input['Kid Rank'];
  input['Mobility Rate'] = +input['Mobility Rate'];
  input['Tier'] = +input['Tier'];
  return input;
}

/**
 * The path function take a row of the csv as input, and return x and y
 * coordinates of the line to draw for this raw.
 */
function path(d) {
  return d3.line()(dimensions.map(dim => [x(dim), y[dim](d[dim])]));
}

/**
 * Convert string to kebab case. From:
 * https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-123.php
 */
function kebabCase(str) {
  return str && str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.toLowerCase())
    .join('-');
}

/**
 * Draw the lines for the parallel coordinates
 */
function drawLines(data) {
  // Draw the lines
  plot.select('g#lines').selectAll('myPath')
    .data(data)
    .enter().append('path')
      .attr("class", d => "line " + kebabCase(d['Type']))
      .attr('d', path)
      .style('fill', 'none')
      .style('stroke', d => color(d['Type']))
      .style('stroke-width', 2)
      .style('opacity', 0.2)
      .on("mouseover", highlight)
      .on("mouseleave", doNotHighlight );
}

/**
 * Draw the axes for the parallel coordinates
 */
function drawAxis(data) {
  // Draw the axes
  svg.select('g#y').selectAll('myAxis')
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .append('g')
    .attr("class", "axis")
    // translate element to its right position on the x axis
    .attr('transform', d => `translate(${x(d)})`)
    // And I build the axis with the call function
    .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
    // Add axis title
    .append('text')
      .style('text-anchor', 'middle')
      .attr('y', height)
      .attr('dy', 15)
      .text(d => d)
      .style('fill', 'black');
}

function drawLegend(data) {
  let types = [... new Set(data.map(d => d['Type']))];
  let lConfig = {
    'x': 780,
    'y': 20,
    'width': 175,
    'height': 120,
    'p': 10,
    'marker': {
      'width': 15,
      'height': 3,
      'size': 15
    }
  };
  // Legend from: https://www.d3-graph-gallery.com/graph/custom_legend.html
  svg.select("g#legend").append("rect")
    .attr("fill", "whitesmoke")
    .attr("stroke-width", 1)
    .attr("stroke", "gainsboro")
    .attr("x", lConfig.x)
    .attr("y", lConfig.y)
    .attr("rx", 8)
    .attr("ry", 8)
    .attr("width", lConfig.width)
    .attr("height", lConfig.height);

  svg.select("g#legend").append("text")
    .attr("x", lConfig.x + lConfig.width/2)
    .attr("y", lConfig.y + 2*lConfig.p)
    .attr("text-anchor", "middle")
    .text("College Type");

  svg.select("g#legend").selectAll("mydots")
    .data(types)
    .enter()
    .append("rect")
      .attr("class", d => `legend ${kebabCase(d)}-legend`)
      .attr("x", lConfig.x + lConfig.p)
      .attr("y", (d,i) => lConfig.y + 3.5*lConfig.p + i*(lConfig.marker.size+5)) // 100 is where the first dot appears. 25 is the distance between dots
      .attr("width", lConfig.marker.width)
      .attr("height", lConfig.marker.height)
      .style("fill", d => color(d))

  // Add one dot in the legend for each name.
  svg.select("g#legend").selectAll("mylabels")
    .data(types)
    .enter()
    .append("text")
      .attr("class", d => `legend ${kebabCase(d)}-legend`)
      .attr("x", lConfig.x + 2*lConfig.p + lConfig.marker.size*1.2)
      .attr("y", (d,i) => lConfig.y + 3*lConfig.p  + i*(lConfig.marker.size+5) + (lConfig.marker.size/2)) // 100 is where the first dot appears. 25 is the distance between dots
      .style("fill", d => color(d))
      .text(d => d)
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")
}

var highlight = function(d) {

  let type = d['Type'];

  // first every group turns grey
  d3.selectAll(".line")
    .transition().duration(150)
    .style("stroke", "lightgrey")
    .style("opacity", "0.1");
  d3.selectAll(".legend")
    .transition().duration(150)
    .style("opacity", "0.2");
  // Second the hovered specie takes its color
  d3.selectAll("." + kebabCase(type))
    .transition().duration(150)
    .style("stroke", color(type))
    .style("opacity", "0.5");
  d3.selectAll(`.${kebabCase(type)}-legend`)
    .transition().duration(150)
    .style("opacity", "1");
}

// Unhighlight
var doNotHighlight = function(d){
  d3.selectAll(".line")
    .transition().duration(150).delay(800)
    .style("stroke", d => color(d['Type']))
    .style("opacity", "0.2")
  d3.selectAll(".legend")
    .transition().duration(150).delay(800)
    .style("opacity", "1")
}
