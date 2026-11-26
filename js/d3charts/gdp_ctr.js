// Reads data from a CSV file with quarterly GDP Growth contributions and Total
// Uses the example on stacked bars + line
// https://bl.ocks.org/WillTurman/9c4142944f6132855fd318350f552b7b
// And the example on stacked bars and grouped bars
// http://bl.ocks.org/gencay/4629518
// Data are from FRED. The data structure is as follows:
// TODO: the iteration separating the variables in 2 columns is not ready
var pt = pt || {};
pt.plotGdpCtr = pt.plotGdpCtr || {};
pt.plotGdpCtr.svg = null;
// Keys for Legends
function labelTag(key) {
          if (key === "fxbus") {
            return "Business Fixed Investment";
          } else if (key === "fxres") {
            return "Residential Fixed Investment";
          } else if (key === "netex") {
            return "Net Exports";
          } else if (key === "chinv") {
            return "Change Private Inventories";
          } else if (key === "pcons") {
            return "Consumption";
          } else if (key === "govtx") {
            return "Government";
          } else {
            return "GDP";
          }
   }
function myBoolean(num) {
  return Boolean(num<0)*0 + Boolean(num>=0)*num;
}
function sumPos(d) {
  return +(myBoolean(d.fxbus) +
          myBoolean(d.fxres) +
          myBoolean(d.chinv) +
          myBoolean(d.pcons) +
          myBoolean(d.govtx));
}
function sumNeg(d) {
  return -(myBoolean(-d.fxbus) +
          myBoolean(-d.fxres) +
          myBoolean(-d.chinv) +
          myBoolean(-d.pcons) +
          myBoolean(-d.govtx));
}
var innerColumns = {
   "column1" : [
   "pcons",
   "fxbus",
   "fxres",
   "chinv",
   "netex",
   "govtx"],
   "column2" : ["total"]
};

pt.plotGdpCtr.init = function () {
    'use strict';
    // Main chart group
    pt.plotGdpCtr.svg = d3.select("#gdpctr .placeholder").append("svg")
                   .attr("width", pt.outerWidth)
                   .attr("height", pt.outerHeight);
};

pt.plotGdpCtr.chart = function (error,data) {
      'use strict';
    // Scales: Ordinal Band Scale for X and Linear for Y
    pt.plotGdpCtr.x0 = d3.scaleBand()
        .rangeRound([0,pt.innerWidth])
        .padding(0.25)
        .align(0.5);
    pt.plotGdpCtr.y = d3.scaleLinear()
         .rangeRound([pt.innerHeight, 0]);
    // A linear scale for the Zero line
    pt.plotGdpCtr.center = d3.scaleLinear()
         .range([0,pt.innerWidth]);
    // An ordinal scale for colors
    pt.plotGdpCtr.color = d3.scaleOrdinal()
         // .range(colors.slice(1));
         .range(colors);
    // Define Axes
    pt.plotGdpCtr.xAxis = d3.axisBottom(pt.plotGdpCtr.x0).tickFormat(quarterDate);
    pt.plotGdpCtr.yAxis = d3.axisLeft(pt.plotGdpCtr.y);
    pt.plotGdpCtr.centerLine = d3.axisTop(pt.plotGdpCtr.center).ticks(0);
// Process data
    data.forEach( function (d) {
      d.date = parseDate(d.DATE);
      d.total= Number(d.RGDP);
      d.pcons= Number(d.PCE);
      d.netex= Number(d.NetExp);
      d.govtx= Number(d.Govt);
      d.fxbus= Number(d.FxInvTot - d.FxInvRes);
      d.fxres= Number(d.FxInvRes);
      d.chinv= Number(d.ChgPrivInv);
    });
    var keys = [
                'total',
                'pcons',
                'netex',
                'fxbus',
                'chinv',
                'fxres',
                'govtx'
              ];
    // slice data to last 4 quarters only
    // First filter data to obs with RGDP
    data = data.filter( function (d) {
      return d.RGDP  !== "";
    });
    // Now, keep only last 4 quarters
    data = data.slice(data.length-4,data.length);
    // var keys = d3.keys(data[0]);
    // var keys = keys.filter(function(key) {
    //       if (key !== "date" ) {
    //         return key;
    //       }
    //   });
    // console.log(data);
    // Calculate rect segments heights
    data.forEach(function(d) {
      var yPos = [];
      var yNeg = [];
      var d_date = d.date;
      d.components = keys.map(function(key){
        var ic;
        for (ic in innerColumns) {
          if (innerColumns[ic].indexOf(key) >=0) {
                if (!yPos[ic]){
                  yPos[ic]=0;
                }
                if (!yNeg[ic]){
                  yNeg[ic]=0;
                }
                if (d[key] >= 0) {
                  return {key: key, column: ic, y1: yPos[ic], y0: yPos[ic] += d[key], date: d_date };
                } else if (d[key] < 0 ) {
                  return {key: key, column: ic, y0: yNeg[ic], y1: yNeg[ic] += d[key], date: d_date };
                }
          }
        }
      });
    });

    // console.log(data);

    // Determine min/max GDP growth
    // var y_min = d3.min(data, function(d) { return d. });
    // var y_max = d3.max(data, function(d) { return d.total });
    var y_min = d3.min(data, function(d){return Math.min(sumNeg(d),d.total); });
    var y_max = d3.max(data, function(d){return Math.max(sumPos(d),d.total); });
    // Determine min/max dates
    var minDate = d3.min(data, function(d) { return d.date; });
    var maxDate = d3.max(data, function(d) { return d.date; });

    // console.log("Dates range=["+quarterDate(minDate)+","+quarterDate(maxDate)+"]");
    // console.log("Values range=["+y_min+","+y_max+"]");
    
    // Complete scale generators
    // Set scales and axes, .domain will be set dynamically
    // http://stackoverflow.com/questions/38539508/how-does-the-d3-scaleband-work
    // http://stackoverflow.com/questions/36435384/d3-js-combining-bar-and-line-chart
    pt.plotGdpCtr.x0.domain(data.map(function(d) {return d.date; }));
    pt.plotGdpCtr.y.domain([y_min,y_max]).nice(10);
    pt.plotGdpCtr.color.domain(keys);
    pt.plotGdpCtr.chartGroup = pt.plotGdpCtr.svg.append("g")
        .attr("transform", "translate("+pt.margin.left+","+pt.margin.top+")");

    pt.plotGdpCtr.entry = pt.plotGdpCtr.chartGroup.selectAll(".entry")
        .data(data)
        .enter().append("g")
        .attr("class","bar group")
        .attr("transform", function (d) {return "translate("+ pt.plotGdpCtr.x0(d.date)+",0)"; });

    pt.plotGdpCtr.entry.selectAll("rect")
    .data(function(d) { return d.components;})
    .enter().append("rect")
    // .attr("class", "bar datum")
    .attr("width", (pt.plotGdpCtr.x0.bandwidth() - pt.plotGdpCtr.x0.padding())/2)
    .attr("x", function(d) {
           // Column 1:
                 // console.log(typeof(d.column))
                 // console.log(typeof(x0(d.date)))
                 if (d.column == "column1") {
                  return ;
                 } else {
                  return +10 + (pt.plotGdpCtr.x0.bandwidth()-pt.plotGdpCtr.x0.padding())/2;
                 }
                 // console.log(pt.plotGdpCtr.x0(d.date))
           ;})
    .attr("y", function(d) { return pt.plotGdpCtr.y(d.y0); })
    .attr("height", function (d) { return Math.abs(pt.plotGdpCtr.y(d.y0) - pt.plotGdpCtr.y(d.y1)); })
    .style("fill", function (d) { return pt.plotGdpCtr.color(d.key); });

    pt.plotGdpCtr.entry.selectAll(".bartext")
    .data(function(d) { return d.components;})
    .enter()
    .append("text")
    .attr("class", "bartext")
    .attr("text-anchor", "middle")
    .attr("x", function(d) {
   // Column 1:
         // console.log(typeof(d.column))
         // console.log(typeof(x0(d.date)))
         if (d.column == "column1") {
          return -20 ;
         } else {
          return (2.5*pt.plotGdpCtr.x0.bandwidth()/3 );
         }
         console.log(pt.plotGdpCtr.x0(d.date))
      ;})
    .attr("y", function(d,i) {
            if (d.column == "column1") {
                return pt.plotGdpCtr.y(d.y0) + 15;
            } else {
                return pt.plotGdpCtr.y(d.y0) - 10; }
          })
    .text( function (d) {
          var barval = d3.format("-.2f")( d.y0-d.y1 );
          if (barval >= 0.1) {
            return barval;
          } else {
            return "";
          }
          });

    // Add Axes
    pt.plotGdpCtr.chartGroup.append("g")
      .attr("class", "y axis")
      .call(pt.plotGdpCtr.yAxis);
    pt.plotGdpCtr.chartGroup.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,"+pt.innerHeight+")")
      .call(pt.plotGdpCtr.xAxis);
    pt.plotGdpCtr.chartGroup.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,"+pt.plotGdpCtr.y(0)+")")
      .call(pt.plotGdpCtr.centerLine);
    pt.plotGdpCtr.legend = pt.plotGdpCtr.chartGroup.selectAll(".legend")
          .data(pt.plotGdpCtr.color.domain())
          .enter().append("g")
          .attr("class", "legend");
    pt.plotGdpCtr.legend.append("rect")
       .attr("x", pt.plotGdpCtr.x0(parseDate("2017-07-01")) - 90 -10)
       .attr("y", function(d,i){ return i*20 + 355;})
       .attr("width", 10)
       .attr("height", 10)
       .style("fill", pt.plotGdpCtr.color);
    pt.plotGdpCtr.legend.append("text")
       .attr("x", pt.plotGdpCtr.x0(parseDate("2017-07-01")) - 90 + 5)
       .attr("y", function(d,i) {return i*20 + 360;})
       .attr("dy", ".35em")
       .style("text-anchor", "start")
       .text(function(d, i) {return labelTag(keys[i]);} )
       .style("fill", pt.plotGdpCtr.color);

    // Add labels to axes
    pt.plotGdpCtr.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Percent");
};