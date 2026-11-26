// Reads data from a CSV file with quarterly GDP Growth and GDPNow
// Data are from FRED. The data structure is as follows:
//

var pt = pt || {};

pt.plotGdpGrowth = pt.plotGdpGrowth || {};
pt.plotGdpGrowth.svg = null;

var valueLabelMargin = 5;

pt.plotGdpGrowth.init = function () {
  'use strict';

  // Define SVG
  pt.plotGdpGrowth.svg = d3.select("#gdp .placeholder")
      .append("svg")
      .attr("width", pt.outerWidth)
      .attr("height", pt.outerHeight);

};


pt.plotGdpGrowth.chart = function(error,data) {
    'use strict';

    if (error) {
      return pt.displayError(error);
    }

    // Parse data and make data numeric
    data.forEach( function (d) {
        d.date = parseDate(d.DATE);
        d.gdp  = +d.RGDP;
        d.gdpnow = +d.GDPNOW;
    });


    // console.log(data);

    // Determine initial date
    pt.plotGdpGrowth.minDate = d3.min(data,function(d){ return d.date; });
    // Define max date
    pt.plotGdpGrowth.maxDate = d3.max(data,function(d){ return d.date; });
    // Find min,max gdp growth rate 
    pt.plotGdpGrowth.minValue = d3.min(data,function(d){ return Math.min(d.gdp,d.gdpnow); });
    pt.plotGdpGrowth.maxValue = d3.max(data,function(d){ return Math.max(d.gdp,d.gdpnow); });

    // console.log("Dates range=["+pt.plotGdpGrowth.minDate+","+pt.plotGdpGrowth.maxDate+"]");
    // console.log("Values range=["+pt.plotGdpGrowth.minValue+","+pt.plotGdpGrowth.maxValue+"]");
    // console.log("minDate="+pt.plotGdpGrowth.minDate+", month="+pt.plotGdpGrowth.minDate.getMonth()+1+", year="+pt.plotGdpGrowth.minDate.getFullYear());

    // Complete scale generators
    // Set scales and axes, .domain will be set dynamically
    // http://stackoverflow.com/questions/38539508/how-does-the-d3-scaleband-work
    // http://stackoverflow.com/questions/36435384/d3-js-combining-bar-and-line-chart

    pt.plotGdpGrowth.x = d3.scaleBand()
                        .rangeRound([0,pt.innerWidth])
                        .domain(data.map(function(d) {return d.date; }))
                        .padding(0.2)
                        .paddingOuter(0.2)
                        .align(0.5);

    pt.plotGdpGrowth.y = d3.scaleLinear()
                        .domain(d3.extent([pt.plotGdpGrowth.minValue,pt.plotGdpGrowth.maxValue]))
                        .range([pt.innerHeight, 0])
                        .nice();


    // Define Axes
    pt.plotGdpGrowth.xAxis = d3.axisBottom(pt.plotGdpGrowth.x)
               .tickFormat(quarterDate);

    // console.log(pt.plotGdpGrowth.x.domain());
    // console.log(pt.plotGdpGrowth.x.domain().map(quarterDate));

    pt.plotGdpGrowth.yAxis = d3.axisLeft(pt.plotGdpGrowth.y).ticks(5);

    // Append chart group to svg
    pt.plotGdpGrowth.chartGroup = pt.plotGdpGrowth.svg.append("g")
              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    // Add axes
    pt.plotGdpGrowth.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+pt.innerHeight+")").call(pt.plotGdpGrowth.xAxis);
    pt.plotGdpGrowth.chartGroup.append("g").attr("class","y axis").call(pt.plotGdpGrowth.yAxis);

    // Split data in two arrays
    var dataGdp = data.filter( function (d) {
      return d.RGDP !== "";
    });
    // console.log(dataGdp);
    var dataGdpNow = data.filter( function (d) {
      return d.GDPNOW !== "";
    });
    // Remove all but the last observation
    dataGdpNow = dataGdpNow.filter(function (d,i) {
      return i === dataGdpNow.length-1;
    });

    // console.log(dataGdpNow);
    // Define bar chart and add to chart
    // TODO: fix the negative height for recession years
    pt.plotGdpGrowth.chartGroup.selectAll("bar gdp")
              .data(dataGdp)
              .enter().append("rect")
              .attr("class","bar gdp")
              .attr("x", function(d) { return pt.plotGdpGrowth.x(d.date); })
              .attr("y", function(d) {
                if (d.gdp>0) {
                  return pt.plotGdpGrowth.y(d.gdp);
                } else {
                  return pt.plotGdpGrowth.y(0);
                }
              })
              .attr("width", pt.plotGdpGrowth.x.bandwidth())
              .attr("height", function (d) {
                return Math.abs(pt.plotGdpGrowth.y(0) - pt.plotGdpGrowth.y(d.gdp));
              })
              .style("fill", function (d,i) {
                if (i<dataGdp.length-1) {
                  return colors[0];  // Previous data blue
                } else {
                  return colors[3]; // Current quarter red
                }
              });

    pt.plotGdpGrowth.textLabelsGdp = pt.plotGdpGrowth.chartGroup.selectAll("bar gdp")
              .data(dataGdp)
              .enter()
              .append("text")
              .attr("class", "value gdp")
              .attr("x", function(d) { return pt.plotGdpGrowth.x(d.date) + pt.plotGdpGrowth.x.bandwidth()/2; })
              .attr("y", function(d) { return pt.plotGdpGrowth.y(d.gdp) - valueLabelMargin; })
              .attr("text-anchor", "middle")
              .text(function(d){
                return (d3.format(".1f")(d.gdp));
              });

// Plot GDPNow only if there is one additional observation compared with GDP
    if (data[data.length-1].RGDP === "" && data[data.length-1].gdpnow ) {
        pt.plotGdpGrowth.chartGroup.selectAll("bar gdpnow")
                  .data(dataGdpNow)
                  .enter().append("rect")
                  .attr("class","bar gdpnow")
                  .attr("x", function(d) { return pt.plotGdpGrowth.x(d.date); })
                  .attr("y", function(d) { return pt.plotGdpGrowth.y(d.gdpnow); })
                  .attr("width", pt.plotGdpGrowth.x.bandwidth())
                  .attr("height", function(d) { return pt.innerHeight - pt.plotGdpGrowth.y(d.gdpnow);
                  });
                  // .style("fill",colors[3]);


        pt.plotGdpGrowth.textLabelsGdpNow = pt.plotGdpGrowth.chartGroup.selectAll("bar gdpnow")
                  .data(dataGdpNow)
                  .enter()
                  .append("text")
                  .attr("class", "value gdpnow")
                  .attr("x", function(d) { return pt.plotGdpGrowth.x(d.date) + pt.plotGdpGrowth.x.bandwidth()/2; })
                  .attr("y", function(d) { return pt.plotGdpGrowth.y(d.gdpnow) - valueLabelMargin; })
                  .attr("text-anchor", "middle")
                  .text(function(d){
                    return (d3.format(".1f")(d.gdpnow));
                  });
    }


    // Add labels to axes
    pt.plotGdpGrowth.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Percent");


};

