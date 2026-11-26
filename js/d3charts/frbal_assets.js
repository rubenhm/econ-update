
var pt = pt || {};

pt.plotFRBalAssets = pt.plotFRBalAssets || {};
pt.plotFRBalAssets.svg = null;

// Keys for legends
function plotFRBalAssetsLabelTag(key) {
          if (key === "TraditionalHoldings") {
            return "Traditional security holdings";
          } else if (key === "AllLiquidityFacilities") {
            return "Liquidity facilities";
          } else if (key === "SupportforSpecificInstitutions") {
            return "Support for specific institutions";
          } else if (key === "LSAPs") {
            return "Large-scale asset purchases";
          } else if (key === "Other") {
            return "Other assets";
          }
   }



// Initialize SVG
pt.plotFRBalAssets.init = function () {
    'use strict';
    // Define svg
    pt.plotFRBalAssets.svg = d3.select("#frbal_assets .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);

};


// Prepare chart
pt.plotFRBalAssets.chart = function(error,data) {
    'use strict';
    if (error) {
        return pt.displayError(error);
    }

  // parse data
  // Generate Other and "Traditional" 
  console.log(data);
  console.log(data[69]);
  var traditionalHoldings = data[69].SecuritiesHeldOutright/1e6;
  console.log(traditionalHoldings);
  data.forEach(function (d) {
    d.date = parseDate(d.date);
    d.TotalAssets = +d.TotalAssets/1e6;
    d.SecuritiesHeldOutright = +d.SecuritiesHeldOutright/1e6;
    d.AllLiquidityFacilities = +d.AllLiquidityFacilities/1e6;
    d.SupportforSpecificInstitutions = +d.SupportforSpecificInstitutions/1e6;
    d.Other = d.TotalAssets - ( d.SecuritiesHeldOutright + d.AllLiquidityFacilities + d.SupportforSpecificInstitutions );
    if (d.date < parseDate("2008-11-26")) {
      d.TraditionalHoldings = d.SecuritiesHeldOutright;
    } else {
      d.TraditionalHoldings = traditionalHoldings;
    }
    d.LSAPs =  d.SecuritiesHeldOutright - d.TraditionalHoldings;
  });
  console.log(data);
  // Column names
  pt.plotFRBalAssets.keys = ["TraditionalHoldings","AllLiquidityFacilities","SupportforSpecificInstitutions" , "LSAPs","Other"];
  

  // Max y-values
  pt.plotFRBalAssets.maxDateVal = d3.max(data, function(d){
      var vals = d3.keys(d).map(function(key){ 
        return (key !== 'date' & key !== 'TotalAssets' & key !== "SecuritiesHeldOutright") ? d[key] : 0 }
        );
      return d3.sum(vals);
  });

  // var parseDate = d3.timeParse("%Y-%m-%d");

  pt.plotFRBalAssets.x = d3.scaleTime().range([0, pt.innerWidth]),
  pt.plotFRBalAssets.y = d3.scaleLinear().range([pt.innerHeight, 0]),
  pt.plotFRBalAssets.z = d3.scaleOrdinal(d3.schemeCategory10);

  pt.plotFRBalAssets.stack = d3.stack();

  pt.plotFRBalAssets.area = d3.area()
      .x(function(d, i) { return pt.plotFRBalAssets.x(d.data.date); })
      .y0(function(d)   { return pt.plotFRBalAssets.y(d[0]); })
      .y1(function(d)   { return pt.plotFRBalAssets.y(d[1]); });


  pt.plotFRBalAssets.x.domain(d3.extent(data, function(d) { return d.date; }));
  pt.plotFRBalAssets.y.domain([0, pt.plotFRBalAssets.maxDateVal]);
  pt.plotFRBalAssets.z.domain(pt.plotFRBalAssets.keys);
  console.log(pt.plotFRBalAssets.z.domain() )
  pt.plotFRBalAssets.stack.keys(pt.plotFRBalAssets.keys);


  pt.plotFRBalAssets.yAxis = d3.axisLeft(pt.plotFRBalAssets.y).ticks(10);
  pt.plotFRBalAssets.xAxis = d3.axisBottom(pt.plotFRBalAssets.x)
                .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth()==0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });                  

// Define chart group
  pt.plotFRBalAssets.chartGroup = pt.plotFRBalAssets.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

  pt.plotFRBalAssets.layer = pt.plotFRBalAssets.chartGroup.selectAll(".layer")
    .data(pt.plotFRBalAssets.stack(data))
    .enter().append("g")
      .attr("class", "layer");

  pt.plotFRBalAssets.layer.append("path")
      .attr("class", "area")
      .style("fill", function(d) { return pt.plotFRBalAssets.z(d.key); })
      .attr("d", pt.plotFRBalAssets.area);


  pt.plotFRBalAssets.chartGroup.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + pt.innerHeight + ")")
      .call(pt.plotFRBalAssets.xAxis);

  pt.plotFRBalAssets.chartGroup.append("g")
      .attr("class", "y axis")
      .call(pt.plotFRBalAssets.yAxis);

  //Add legends
  pt.plotFRBalAssets.legend = pt.plotFRBalAssets.chartGroup.selectAll(".legend")
        .data(pt.plotFRBalAssets.z.domain())
        .enter().append("g")
        .attr("class", "legend");
  pt.plotFRBalAssets.legend.append("rect")
     .attr("x", pt.plotFRBalAssets.x(parseDate("2008-07-01")) - 40 -10)
     .attr("y", function(d,i){ return -i*20 + 80;})
     .attr("width", 10)
     .attr("height", 10)
     .style("fill", pt.plotFRBalAssets.z);
  pt.plotFRBalAssets.legend.append("text")
     .attr("x", pt.plotFRBalAssets.x(parseDate("2008-07-01")) - 40 + 5)
     .attr("y", function(d,i) {return -i*20 + 85;})
     .attr("dy", ".35em")
     .style("text-anchor", "start")
     .text(function(d, i) {
          return plotFRBalAssetsLabelTag(pt.plotFRBalAssets.keys[i]);
        } )
     .style("fill", pt.plotFRBalAssets.z);


  //Add labels to axes
  pt.plotFRBalAssets.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Trillions of dollars");

};


