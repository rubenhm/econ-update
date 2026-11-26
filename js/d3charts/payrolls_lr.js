// Reads data from a CSV file with unemployment and payroll changes
// Data are from FRED. The data structure is as follows:
// GOAL:
// Have bar charts for emp change and line for unemploy rate.
// See possible example with bar chart on time x-scale: http://bl.ocks.org/anupsavvy/9513382
// This simple bar chart example also uses time x-scale: http://bl.ocks.org/d3noob/8952219

var pt = pt || {};

pt.plotPayrollsLRun = pt.plotPayrollsLRun || {};
pt.plotPayrollsLRun.svg = null;

function nArray (N) {
    var dotArray = [];
    for (var i = 1; i <= N; i++) {
      dotArray.push(i);
    }
    return dotArray;
}


pt.plotPayrollsLRun.init = function () {
    'use strict';
    // Define SVG
    pt.plotPayrollsLRun.svg = d3.select("#payrolls_lr .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);

}


pt.plotPayrollsLRun.chart = function(error,data) {
    'use strict';

    if (error) {
        return pt.displayError(error);
    };

    // Parse data
    data = parseLaborData(data);

    // Limit sample data. 
    // Filter the data
    data = data.filter(function (d,i) {
        return d.date >= parseDate("1988-01-01");
    })

    // Determine initial date
    pt.plotPayrollsLRun.minDate = d3.min(data,function(d){ return d.date; });
    // Define max date
    pt.plotPayrollsLRun.maxDate = d3.max(data,function(d){ return d.date; });

    // Find min/max empchg
    pt.plotPayrollsLRun.minEmpChg = d3.min(data,function(d){ return d.empchg; });
    pt.plotPayrollsLRun.maxEmpChg = d3.max(data,function(d){ return d.empchg; });

    // Complete scale generators
    // Set scales and axes, .domain will be set dynamically
    // http://stackoverflow.com/questions/38539508/how-does-the-d3-scaleband-work
    // http://stackoverflow.com/questions/36435384/d3-js-combining-bar-and-line-chart

    pt.plotPayrollsLRun.x = d3.scaleBand()
                        .range([0,pt.innerWidth])
                        .domain(data.map(function(d) {return d.date; }))
                        .align(0.5);

    // Scales  
    pt.plotPayrollsLRun.y = d3.scaleLinear()
                        .domain([pt.plotPayrollsLRun.minEmpChg, pt.plotPayrollsLRun.maxEmpChg])
                        .range([pt.innerHeight, 0]).nice()

    // Color scales for averages
    pt.plotPayrollsLRun.color = d3.scaleOrdinal(colors.slice(1));

    // calculate expansion periods
    var recPre=-1, csEmp=0, csExp=0;
    var avgEmp = [];
    var expIdx = [];
    var expDate = [];
    var outDate = [];
    var totEmp = [];

    data.forEach( function (d,i) {
        // // console.log("i="+i+", date="+d3.timeFormat("%Y-%B")(d.date))
        // // console.log("empchg="+d.empchg)
        // // console.log("recess="+d.recess)
        if (d.recess == 0 & recPre==1) {
            csEmp = d.empchg;
            csExp = 1;
            expIdx.push(i);
            expDate.push(d.date);
        } 
        if (d.recess ==0 & recPre==0) {
            csEmp += d.empchg;
            csExp += 1;
        }
        if (d.recess == 1 & recPre==0) {
            avgEmp.push(csEmp/csExp);
            outDate.push(data[i-1].date);
            totEmp.push(csEmp);
        }
        recPre = d.recess;
    })
    avgEmp.push(csEmp/csExp);
    totEmp.push(csEmp);
    outDate.push(data[data.length-1].date);
    avgEmp = avgEmp.slice(1);
    totEmp = totEmp.slice(1);
    outDate = outDate.slice(1);
    // console.log("avgEmp="+avgEmp)
    // console.log("expDate="+expDate)
    // console.log("outDate="+outDate)
    // Define recession bars as a rect shape in the svg
    // Define function to find index of start and end of recession dates
    // Use array.reduce https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce

    pt.plotPayrollsLRun.color.domain(nArray(avgEmp.length))

    // Multiple lines
    pt.plotPayrollsLRun.line = d3.line()
        .x(function (d) { return pt.plotPayrollsLRun.x(d.date); })
        .y(function (d) { return pt.plotPayrollsLRun.y(d.avgchg)})

    pt.plotPayrollsLRun.categories = pt.plotPayrollsLRun.color.domain()
        .map( function (expPeriod) {
            'use strict';
            // console.log(expPeriod)
            return {
                expPeriod : expPeriod,
                values: data.map( function (d) {
                var dateIn = expDate[expPeriod-1];
                var dateOut = outDate[expPeriod-1];
                // console.log([dateIn,dateOut])
                // console.log(d.date)
                if (d.date>=dateIn & d.date<=dateOut) { 
                    return {
                    date: d.date,
                    avgchg: avgEmp[expPeriod-1]
                    };
                } else {
                    return {
                        date: d.date,
                        avgchg: "NA"
                    }
                }
            })
        };});

    // Drop elements with Nans
    // pt.plotPayrollsLRun.categories.forEach(
    //     function (d) {
    //         d.values = d.values.filter( p => ["NA"].indexOf(p.avgchg) === -1)
    //         // console.log(d.values.length)
    //     });
    // translation
    pt.plotPayrollsLRun.categories.forEach(function (d) {
        d.values = d.values.filter(function (p) {
            return ["NA"].indexOf(p.avgchg) === -1;
        });
        // console.log(d.values.length)
    });
    // console.log(pt.plotPayrollsLRun.categories)
    var recessions = [];
    var index;
    var lengthRec = 0;
    var lengthExp = 0;
    var lenData = data.length;
    for (var i=0; i< lenData ; i++) {
        var obj = {};
        // // console.log(data[i])
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
    pt.plotPayrollsLRun.xAxis = d3.axisBottom(pt.plotPayrollsLRun.x)
                  .tickValues(pt.plotPayrollsLRun.x.domain().filter(function (d,i) {
                      return !(i %24); }))
                  .tickFormat(d3.timeFormat("%Y"));

    pt.plotPayrollsLRun.yAxis = d3.axisLeft(pt.plotPayrollsLRun.y)
                   .ticks(6);

    // Append chart group to svg
    pt.plotPayrollsLRun.chartGroup = pt.plotPayrollsLRun.svg.append("g")
                          .attr("transform","translate("+(pt.margin.left+15)+","+pt.margin.top+")");

    // Add axes
    pt.plotPayrollsLRun.chartGroup.append("g").attr("class","x axis")
                              .attr("transform","translate(0,"+pt.innerHeight+")")
                              .call(pt.plotPayrollsLRun.xAxis);
    pt.plotPayrollsLRun.chartGroup.append("g").attr("class","y axis payems")
                              .call(pt.plotPayrollsLRun.yAxis);

    // Append recession bars
    pt.plotPayrollsLRun.chartGroup.append("g").selectAll("recessm")
            .data(recessions)
            .enter().append("rect")
            .attr("class","recessm")
            .attr("x", function (d) {
                return pt.plotPayrollsLRun.x(d.iniDate);})
            .attr("y", 0)
            .attr("height", pt.innerHeight)
            .attr("width", function (d) {
                return pt.innerWidth*d.length/lenData;
            });


    // Define bar chart and add to chart
    // TODO: fix the negative height for recession years
    pt.plotPayrollsLRun.chartGroup.selectAll("bar empchg")
                    .data(data)
                    .enter().append("rect")
                    .attr("class","bar empchg")
                    .attr("x", function(d) { return pt.plotPayrollsLRun.x(d.date); })
                    .attr("y", function(d) { 
                            if (d.empchg>0) {
                                return pt.plotPayrollsLRun.y(d.empchg); 
                            } else {
                                return pt.plotPayrollsLRun.y(0);
                            }
                     })
                    .attr("width", pt.plotPayrollsLRun.x.bandwidth())
                    .attr("height", function (d) {
                        return Math.abs(pt.plotPayrollsLRun.y(0) - pt.plotPayrollsLRun.y(d.empchg));
                    })
                    .style("fill", function (d) {
                        if (d.empchg>0) {
                            return colors[0];
                        } else {
                            return colors[3];
                        }
                    })


    // Add expansion averages
    pt.plotPayrollsLRun.series = pt.plotPayrollsLRun.chartGroup.selectAll(".averages")
        .data(pt.plotPayrollsLRun.categories)
        .enter().append("g")
        .attr("class","averages")

    pt.plotPayrollsLRun.series.append("path")
        .attr("class","line")
        .attr("d", function (d) {
            return pt.plotPayrollsLRun.line(d.values);
        })
        .style("stroke", function (d) {
            return pt.plotPayrollsLRun.color(d.expPeriod);
        })

    pt.plotPayrollsLRun.chartGroup.selectAll(".avglabel")
      .data(pt.plotPayrollsLRun.categories)
      .enter().append("g")
      .attr("class","avglabel")
      .append("text")
      .attr("class","value gdp")
      .attr("x", function (d) { return pt.plotPayrollsLRun.x(d.values["0"].date)})
      .attr("y", function (d) { return 0})
      .text(function (d) {
        return (d3.format(".0f")(d.values["0"].avgchg)+"K");
      })
      .style("stroke", function (d) {
        return pt.plotPayrollsLRun.color(d.expPeriod);
      })

    // Add labels to axes
    pt.plotPayrollsLRun.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Thousands")



}

