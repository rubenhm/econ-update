// Reads data from a CSV file with unemployment and payroll changes
// Data are from FRED. The data structure is as follows:
// GOAL:
// Have bar charts for emp change and line for unemploy rate.
// See possible example with bar chart on time x-scale: http://bl.ocks.org/anupsavvy/9513382
// This simple bar chart example also uses time x-scale: http://bl.ocks.org/d3noob/8952219

var pt = pt || {};

pt.plotPayrolls = pt.plotPayrolls || {};
pt.plotPayrolls.svg = null;


pt.plotPayrolls.init = function () {
    'use strict';
    // Define SVG
    pt.plotPayrolls.svg = d3.select("#payrolls .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);

}


pt.plotPayrolls.chart = function(error,data) {
    'use strict';

    if (error) {
        return pt.displayError(error);
    };

    // Parse data
    data = parseLaborData(data);

    // Limit sample data. 
    // Filter the data
    data = data.filter(function (d,i) {
        return d.date >= parseDate("2012-01-01");
    })

    // Determine initial date
    pt.plotPayrolls.minDate = d3.min(data,function(d){ return d.date; });
    // Define max date
    pt.plotPayrolls.maxDate = d3.max(data,function(d){ return d.date; });

    // Find min/max empchg
    pt.plotPayrolls.minEmpChg = d3.min(data,function(d){ return d.empchg; });
    pt.plotPayrolls.maxEmpChg = d3.max(data,function(d){ return d.empchg; });

    // Complete scale generators
    // Set scales and axes, .domain will be set dynamically
    // http://stackoverflow.com/questions/38539508/how-does-the-d3-scaleband-work
    // http://stackoverflow.com/questions/36435384/d3-js-combining-bar-and-line-chart

    pt.plotPayrolls.x = d3.scaleBand()
                        .range([0,pt.innerWidth])
                        .domain(data.map(function(d) {return d.date; }))
                        .align(0.5)
                        .padding(0.1);

    // Scales with hardcoded bounds 
    pt.plotPayrolls.y = d3.scaleLinear()
                        .domain([pt.plotPayrolls.minEmpChg, pt.plotPayrolls.maxEmpChg])
                        .range([pt.innerHeight, 0]).nice()


    // Define recession bars as a rect shape in the svg
    // Define function to find index of start and end of recession dates
    // Use array.reduce https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce

    var recessions = [];
    var index;
    var lengthRec = 0;
    var lengthExp = 0;
    var lenData = data.length;
    for (var i=0; i< lenData ; i++) {
        var obj = {};
        // console.log(data[i])
        if (data[i].recess > 0 && lengthRec==0) {
            index = i;
            lengthRec = 1;
            lengthExp = 0;
        }
        if (data[i].recess > 0 && lengthRec>0) {
            lengthRec++;
        } 
        if (data[i].recess==0 && lengthExp==0) {
            lengthExp++;
        }
        if (data[i].recess==0 && lengthExp==1 && index>=0) {
            obj = {'index' : index, 'length': lengthRec-1, 'iniDate': data[index].date, 'finDate': data[index+lengthRec].date};
            recessions.push(obj);
            lengthExp = 0;
            lengthRec = 0;
            index = -1;
        }
    }
    // console.log(recessions)

    // Define Axes
    pt.plotPayrolls.xAxis = d3.axisBottom(pt.plotPayrolls.x)
                  .tickValues(pt.plotPayrolls.x.domain().filter(function (d,i) {
                      return !(i %12); }))
                  .tickFormat(d3.timeFormat("%Y"));

    pt.plotPayrolls.yAxis = d3.axisLeft(pt.plotPayrolls.y)
                   .ticks(6);

    // Append chart group to svg
    pt.plotPayrolls.chartGroup = pt.plotPayrolls.svg.append("g")
                          .attr("transform","translate("+(pt.margin.left+15)+","+pt.margin.top+")");

    // Add axes
    pt.plotPayrolls.chartGroup.append("g").attr("class","x axis")
                              .attr("transform","translate(0,"+pt.innerHeight+")")
                              .call(pt.plotPayrolls.xAxis);
    pt.plotPayrolls.chartGroup.append("g").attr("class","y axis payems")
                              .call(pt.plotPayrolls.yAxis);

    // Append recession bars
    pt.plotPayrolls.chartGroup.append("g").selectAll("recessm")
            .data(recessions)
            .enter().append("rect")
            .attr("class","recessm")
            .attr("x", function (d) {
                return pt.plotPayrolls.x(d.iniDate);})
            .attr("y", 0)
            .attr("height", pt.innerHeight)
            .attr("width", function (d) {
                return pt.innerWidth*d.length/lenData;
            });


    // Define bar chart and add to chart
    // TODO: fix the negative height for recession years
    pt.plotPayrolls.chartGroup.selectAll("bar empchg")
                    .data(data)
                    .enter().append("rect")
                    .attr("class","bar empchg")
                    .attr("x", function(d) { return pt.plotPayrolls.x(d.date); })
                    .attr("y", function(d) { 
                            if (d.empchg>0) {
                                return pt.plotPayrolls.y(d.empchg); 
                            } else {
                                return pt.plotPayrolls.y(0);
                            }
                     })
                    .attr("width", pt.plotPayrolls.x.bandwidth())
                    .attr("height", function (d) {
                        return Math.abs(pt.plotPayrolls.y(0) - pt.plotPayrolls.y(d.empchg));
                    })
                    .style("fill", function (d) {
                        if (d.empchg>0) {
                            return colors[0];
                        } else {
                            return colors[3];
                        }
                    })

// Legends

    pt.plotPayrolls.legends = pt.plotPayrolls.chartGroup.append("g").attr("class","legend")

    pt.plotPayrolls.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+pt.plotPayrolls.y(data[data.length-1]["empchg"])+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[0])
            .text("New Jobs: "+d3.format(".0f")(data[data.length-1]["empchg"])+"K")

    pt.plotPayrolls.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["date"]))

    // Add labels to axes
    pt.plotPayrolls.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Thousands")



}

