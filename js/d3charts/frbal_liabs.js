
var pt = pt || {};

pt.plotFRBalLiabs = pt.plotFRBalLiabs || {};
pt.plotFRBalLiabs.svg = null;

// Keys for legends
function plotFRBalLiabsLabelTag(key) {
          if (key === "CurrencyinCirculation") {
            return "Currency in circulation";
          } else if (key === "DepositsofDepositoryInstitutions") {
            return "Deposits held by depository institutions";
          } else if (key === "Other") {
            return "Other";
          } else if (key === "TreasuryBalance") {
            return "Treasury balance";
          }
   }



// Initialize SVG
pt.plotFRBalLiabs.init = function () {
    'use strict';
    // Define svg
    pt.plotFRBalLiabs.svg = d3.select("#frbal_liabs .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);

};


// Prepare chart
pt.plotFRBalLiabs.chart = function(error,data) {
    'use strict';
    if (error) {
        return pt.displayError(error);
    }

  // parse data
  // Generate Other 
  data.forEach(function (d) {
    d.date = parseDate(d.date);
    d.TotalAssets = +d.TotalAssets/1e6;
    d.CurrencyinCirculation = +d.CurrencyinCirculation/1e6;
    d.TreasuryBalance = +d.TreasuryBalance/1e6;
    d.DepositsofDepositoryInstitutions = +d.DepositsofDepositoryInstitutions/1e6;
    d.Other = d.TotalAssets - ( d.CurrencyinCirculation + d.TreasuryBalance + d.DepositsofDepositoryInstitutions );
  });
  console.log(data);
  // Column names
  pt.plotFRBalLiabs.keys = ["CurrencyinCirculation","DepositsofDepositoryInstitutions","TreasuryBalance" ,"Other"];
  // Max y-values
  pt.plotFRBalLiabs.maxDateVal = d3.max(data, function(d){
      var vals = d3.keys(d).map(function(key){ 
        return (key !== 'date' & key !== 'TotalAssets' ) ? d[key] : 0 }
        );
      return d3.sum(vals);
  });

  // var parseDate = d3.timeParse("%Y-%m-%d");

  pt.plotFRBalLiabs.x = d3.scaleTime().range([0, pt.innerWidth]),
  pt.plotFRBalLiabs.y = d3.scaleLinear().range([pt.innerHeight, 0]),
  pt.plotFRBalLiabs.z = d3.scaleOrdinal(d3.schemeCategory10);

  pt.plotFRBalLiabs.stack = d3.stack();

  pt.plotFRBalLiabs.area = d3.area()
      .x(function(d, i) { return pt.plotFRBalLiabs.x(d.data.date); })
      .y0(function(d)   { return pt.plotFRBalLiabs.y(d[0]); })
      .y1(function(d)   { return pt.plotFRBalLiabs.y(d[1]); });


  pt.plotFRBalLiabs.x.domain(d3.extent(data, function(d) { return d.date; }));
  pt.plotFRBalLiabs.y.domain([0, pt.plotFRBalLiabs.maxDateVal]);
  pt.plotFRBalLiabs.z.domain(pt.plotFRBalLiabs.keys);
  pt.plotFRBalLiabs.stack.keys(pt.plotFRBalLiabs.keys);
  console.log(pt.plotFRBalLiabs.stack(data));

  pt.plotFRBalLiabs.yAxis = d3.axisLeft(pt.plotFRBalLiabs.y).ticks(10);
  pt.plotFRBalLiabs.xAxis = d3.axisBottom(pt.plotFRBalLiabs.x)
                .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth()==0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });                  

// Define chart group
  pt.plotFRBalLiabs.chartGroup = pt.plotFRBalLiabs.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

  pt.plotFRBalLiabs.layer = pt.plotFRBalLiabs.chartGroup.selectAll(".layer")
    .data(pt.plotFRBalLiabs.stack(data))
    .enter().append("g")
      .attr("class", "layer");

  pt.plotFRBalLiabs.layer.append("path")
      .attr("class", "area")
      .style("fill", function(d) { return pt.plotFRBalLiabs.z(d.key); })
      .attr("d", pt.plotFRBalLiabs.area);


  pt.plotFRBalLiabs.chartGroup.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + pt.innerHeight + ")")
      .call(pt.plotFRBalLiabs.xAxis);

  pt.plotFRBalLiabs.chartGroup.append("g")
      .attr("class", "y axis")
      .call(pt.plotFRBalLiabs.yAxis);

  //Add legends
  pt.plotFRBalLiabs.legend = pt.plotFRBalLiabs.chartGroup.selectAll(".legend")
        .data(pt.plotFRBalLiabs.z.domain())
        .enter().append("g")
        .attr("class", "legend");
  pt.plotFRBalLiabs.legend.append("rect")
     .attr("x", pt.plotFRBalLiabs.x(parseDate("2008-07-01")) - 40 -10)
     .attr("y", function(d,i){ return -i*20 + 65;})
     .attr("width", 10)
     .attr("height", 10)
     .style("fill", pt.plotFRBalLiabs.z);
  pt.plotFRBalLiabs.legend.append("text")
     .attr("x", pt.plotFRBalLiabs.x(parseDate("2008-07-01")) - 40 +5)
     .attr("y", function(d,i) {return -i*20 + 70;})
     .attr("dy", ".35em")
     .style("text-anchor", "start")
     .text(function(d, i) {return plotFRBalLiabsLabelTag(pt.plotFRBalLiabs.keys[i]);} )
     .style("fill", pt.plotFRBalLiabs.z);


  //Add labels to axes
  pt.plotFRBalLiabs.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Trillions of dollars");

};


