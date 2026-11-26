// Reads data from a CSV file with unemployment and payroll changes
// Data are from FRED. The data structure is as follows:
// GOAL:
// Have bar charts for emp change and line for unemploy rate.
// See possible example with bar chart on time x-scale: http://bl.ocks.org/anupsavvy/9513382
// This simple bar chart example also uses time x-scale: http://bl.ocks.org/d3noob/8952219

var pt = pt || {};

pt.plotLaborMkt = pt.plotLaborMkt || {};
pt.plotLaborMkt.svg = null;

// Initialize SVG
pt.plotLaborMkt.init = function () {
    'use strict';
    // Define SVG
    pt.plotLaborMkt.svg = d3.select("#labor .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);

};


pt.plotLaborMkt.chart = function(error,data) {
    'use strict';

    if (error) {
        return pt.displayError(error);
    }

    // Parse data
    data = parseLaborData(data);


    // Limit sample data. 
    // Filter the data
    data = data.filter(function (d,i) {
        return d.date >= minLaborDate;
    });

    // Alternatively. Slice from given date.
    // function findFirstDate(d) {
    //     return d.date.getTime() >= minDate ;
    // }
    // data = data.slice(data.findIndex(findFirstDate,minDate),data.length);
    // console.log(data);

    // Determine initial date
    pt.plotLaborMkt.minDate = d3.min(data,function(d){ return d.date; });
    // Define max date
    pt.plotLaborMkt.maxDate = d3.max(data,function(d){ return d.date; });

    // console.log(data);
    console.log("Data range=["+pt.plotLaborMkt.minDate+","+pt.plotLaborMkt.maxDate+"]");

    // Find min,max unemployment rate 
    pt.plotLaborMkt.minUnrate = d3.min(data,function(d){ return d.unrate; });
    pt.plotLaborMkt.maxUnrate = d3.max(data,function(d){ return d.unrate; });
    // Find min/max empchg
    pt.plotLaborMkt.minEmpChg = d3.min(data,function(d){ return d.empchg; });
    pt.plotLaborMkt.maxEmpChg = d3.max(data,function(d){ return d.empchg; });

    console.log("Max unrate="+pt.plotLaborMkt.maxUnrate);
    // Complete scale generators
    // Set scales and axes, .domain will be set dynamically
    // http://stackoverflow.com/questions/38539508/how-does-the-d3-scaleband-work
    // http://stackoverflow.com/questions/36435384/d3-js-combining-bar-and-line-chart

    pt.plotLaborMkt.x = d3.scaleBand()
                        .rangeRound([0,pt.innerWidth])
                        .domain(data.map(function(d) {return d.date; }))
                        .padding(0.05)
                        .paddingOuter(0.02)
                        .align(0.5);

    // Scales with hardcoded bounds 
    pt.plotLaborMkt.y1 = d3.scaleLinear()
                        .domain([pt.plotLaborMkt.minEmpChg,pt.plotLaborMkt.maxEmpChg])
                        .range([pt.innerHeight, 0])
                        .nice();
    pt.plotLaborMkt.y2 = d3.scaleLinear()
                        .domain([3,9])
                        .range([pt.innerHeight, 0])
                        .nice();
    // Define Axes
    pt.plotLaborMkt.xAxis = d3.axisBottom(pt.plotLaborMkt.x)
                  .tickValues(pt.plotLaborMkt.x.domain().filter(function(d,i) {return (i % 12) === 0; }))
                  .tickFormat(d3.timeFormat("%Y"));

    pt.plotLaborMkt.y1Axis = d3.axisLeft(pt.plotLaborMkt.y1)
                   .ticks(6);
    pt.plotLaborMkt.y2Axis = d3.axisRight(pt.plotLaborMkt.y2)
                   .ticks(5)
                   .tickFormat(d3.format("0"));

    // Append chart group to svg
    pt.plotLaborMkt.chartGroup = pt.plotLaborMkt.svg.append("g")
                          .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    // Define line chart centered at middle of bars
    pt.plotLaborMkt.line = d3.line()
                    .x(function(d){ return pt.plotLaborMkt.x(d.date) + pt.plotLaborMkt.x.bandwidth()/2; })
                    .y(function(d){ return pt.plotLaborMkt.y2(d.unrate); });

    // Add axes
    pt.plotLaborMkt.chartGroup.append("g").attr("class","x axis")
                              .attr("transform","translate(0,"+pt.innerHeight+")")
                              .call(pt.plotLaborMkt.xAxis);
    pt.plotLaborMkt.chartGroup.append("g").attr("class","y axis payems")
                              .call(pt.plotLaborMkt.y1Axis);
    pt.plotLaborMkt.chartGroup.append("g").attr("class","y axis unrate")
                              .attr("transform","translate("+pt.innerWidth+",0)")
                              .call(pt.plotLaborMkt.y2Axis);

    // Define bar chart and add to chart
    // TODO: fix the negative height for recession years
    pt.plotLaborMkt.chartGroup.selectAll("bar empchg")
                    .data(data)
                    .enter().append("rect")
                    .attr("class","bar empchg")
                    .attr("x", function(d) { return pt.plotLaborMkt.x(d.date); })
                    .attr("y", function(d) { 
                            if (d.empchg>0) {
                                return pt.plotLaborMkt.y1(d.empchg); 
                            } else {
                                return pt.plotLaborMkt.y1(0);
                            }
                     })
                    .attr("width", pt.plotLaborMkt.x.bandwidth())
                    .attr("height", function(d) {
                        return Math.abs(pt.plotLaborMkt.y1(0) - pt.plotLaborMkt.y1(d.empchg));
                    })
                    .style("fill", function (d) {
                        if (d.empchg>0) {
                            return colors[0];
                        } else {
                            return colors[3];
                        }
                    });

    // Add line path to chart group
    pt.plotLaborMkt.chartGroup.append("path")
                              .attr("class","line")
                              .attr("d",pt.plotLaborMkt.line(data))
                              .attr("stroke",colors[1]);

    // Add labels to axes
    pt.plotLaborMkt.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Thousands")
            .style("fill", colors[0]);

    // Add labels to axes
    pt.plotLaborMkt.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","end")
            .attr("x", pt.innerWidth)
            .attr("y", -topYAxisPadding)
            .text("Percent")
            .style("fill", colors[1]);

    // Add legends
    pt.plotLaborMkt.chartGroup.legends = pt.plotLaborMkt.chartGroup.append("g")
                    .attr("class","legend");

    pt.plotLaborMkt.chartGroup.legends.append("text")
            .attr("text-anchor","end")
            .attr("x", pt.plotLaborMkt.x(pt.plotLaborMkt.maxDate))
            .attr("y", pt.plotLaborMkt.y2(8.5))
            .text("Change in total nonfarm payrolls ("+d3.format(".0f")(data[data.length-1]["empchg"])+"K)")
            .style("fill", colors[0]);

    pt.plotLaborMkt.chartGroup.legends.append("text")
            .attr("text-anchor","end")
            .attr("x", pt.plotLaborMkt.x(pt.plotLaborMkt.maxDate))
            .attr("y", pt.plotLaborMkt.y2(8.5) + 25)
            .text("Unemployment rate ("+d3.format(".1f")(data[data.length-1]["unrate"])+"%)")
            .style("fill", colors[1]);

    pt.plotLaborMkt.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", -35)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["date"]));


};

