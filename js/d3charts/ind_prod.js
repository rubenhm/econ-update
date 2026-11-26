// Reads CPI data from CSV exported from FRED


var pt = pt || {};

pt.plotIp = pt.plotIp || {};
pt.plotIp.svg = null;

// Initialize SVG
pt.plotIp.init = function () {
    'use strict';
    // Define svg
    pt.plotIp.svg = d3.select("#indprod .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};

// Find label positions based on last sample values
// Not clear that labels are sorted by magnitude when drawn.

pt.plotIp.labelPositions = function(data, y) {
    'use strict';
    var items = [
        { varname: 'ip', value: data[data.length-1]["ip"], longname: "Total IP", pos: '', org: 0  },
        { varname: 'ip_mf', value: data[data.length-1]["ip_mf"], longname: "Manufacturing", pos: '', org: 1  },
        { varname: 'ip_mi', value: data[data.length-1]["ip_mi"], longname: "Mining",pos: '', org: 2  }
    ];
    // sort by value
    items.sort(function (a, b) {
      if (a.value > b.value) {
        return 1;
      }
      if (a.value < b.value) {
        return -1;
      }
      // a must be equal to b
      return 0;
    });
    // Calculate diff
    var d0 = y(items[0].value) - y(items[1].value);
    var d1 = y(items[1].value) - y(items[2].value);
    var d2 = y(items[0].value) - y(items[2].value);

    console.log([d0,d1,d2])
    if (d0 > 20 && d1 > 20) {
        console.log("case 1: no adjustments");
        items[0].pos = y(items[0].value);
        items[1].pos = y(items[1].value);
        items[2].pos = y(items[2].value);
    }
    if (d0 < 20  && d1 > 20) {
        console.log("case 2: adjust 1 and 2");
        var dw = d0 / (d0+d1);
        console.log(dw);
        items[0].pos = y(items[0].value) + 5;
        items[1].pos = y(items[1].value) - 5;
        items[2].pos = y(items[2].value);
    }
    if (d0 > 20 && d1 < 20){
        console.log("case 3: adjust 2 and 3");
        var dw = d1/(d0+d1);
        console.log(dw);
        items[0].pos = y(items[0].value);
        items[1].pos = y(items[1].value) + 5;
        items[2].pos = y(items[2].value) - 7;
    }
    var dys = [d0,d1,d2, items];
    console.log(dys);
    return dys;
};



// Prepare chart
pt.plotIp.chart = function(error,data) {
    'use strict';


    if (error) {
        return pt.displayError(error);
    }


    // parse data
    data.forEach( function (d) {
        d.month= parseDate(d.DATE);
        d.ip= Number(d.IP);
        d.ip_mf= Number(d.IPMF);
        d.ip_mi= Number(d.IPMI);
        d.usrec = Number(d.USRECM);
    });

    // Limit starting sample date, same as labor
    var minDate =  parseDate("2007-01-01");

    // Limit sample data. Slice from given date.
    function findMinDate(d) {
        return d.month.getTime() >= minDate;
    }

    // data = data.slice(data.findIndex(findFirstDate, minDate), data.length);
    data = data.filter(findMinDate);
    console.log(data);


    // Determine initial date
    pt.plotIp.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotIp.maxDate = d3.max(data,function(d){ return d.month; });


    // Find max and min yaxis values
    pt.plotIp.maxValue = d3.max(data,function(d){ return Math.max(d.ip,d.ip_mf,d.ip_mi); });
    pt.plotIp.minValue = d3.min(data,function(d){ return Math.min(d.ip,d.ip_mf,d.ip_mi); });

    console.log("Data range=["+pt.plotIp.minDate+","+pt.plotIp.maxDate+"]");
    console.log("Max value= "+pt.plotIp.maxValue);
    console.log("Min value= "+pt.plotIp.minValue);

    // Define scale and axes generators with custom x-axis ticks and format
    pt.plotIp.y = d3.scaleLinear()
                 .domain([pt.plotIp.minValue-5,pt.plotIp.maxValue])
                 .range([pt.innerHeight,0])
                 .nice();
    pt.plotIp.x = d3.scaleTime()
                 .domain([pt.plotIp.minDate,pt.plotIp.maxDate])
                 .range([0,pt.innerWidth]);
    pt.plotIp.yAxis = d3.axisLeft(pt.plotIp.y).ticks(12);
    pt.plotIp.xAxis = d3.axisBottom(pt.plotIp.x)
                // .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth() === 0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });


    // Define line generators for each variable
    pt.plotIp.line_ip = d3.line()
                    .x(function(d){ return pt.plotIp.x(d.month); })
                    .y(function(d){ return pt.plotIp.y(d.ip); });
    pt.plotIp.line_ip_mf = d3.line()
                    .x(function(d){ return pt.plotIp.x(d.month); })
                    .y(function(d){ return pt.plotIp.y(d.ip_mf); });
    pt.plotIp.line_ip_mi = d3.line()
                    .x(function(d){ return pt.plotIp.x(d.month); })
                    .y(function(d){ return pt.plotIp.y(d.ip_mi); });


    // Define recession bars as a rect shape in the svg
    // Define function to find index of start and end of recession dates
    var recData = data.filter( function (d,i) {
        d.recidx = i;
        return d.usrec == 1;
    });
    var firstRecMonth = recData[0].recidx;
    var numRecMonths = recData[recData.length-1].recidx - firstRecMonth + 1;
    var lengthData = data.length;

    console.log(firstRecMonth);
    console.log(numRecMonths);


    // Define chart group
    pt.plotIp.chartGroup = pt.plotIp.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");


        // Add zero line
    pt.plotIp.chartGroup.append("line")
                    .attr("x1", 0)
                    .attr("y1", pt.plotIp.y(0))
                    .attr("x2", pt.innerWidth)
                    .attr("y2", pt.plotIp.y(0))
                    .attr("stroke", "black")
                    .attr("stroke-width", "1px");


    // Add recession bar
    // Recession bar as rectangle. Looks good.
    pt.plotIp.chartGroup.append("rect")
                    .attr("class","recessm")
                    .attr("x", pt.innerWidth*firstRecMonth/lengthData )
                    .attr("y", 0)
                    .attr("width", pt.innerWidth*numRecMonths/lengthData)
                    .attr("height",pt.innerHeight);


//      Add time series
    pt.plotIp.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotIp.line_ip(data))
              .attr("stroke", colors[0]);
    pt.plotIp.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotIp.line_ip_mf(data))
              .attr("stroke", colors[1]);
    pt.plotIp.chartGroup
              .append("path")
              .attr("class","line").attr("d",pt.plotIp.line_ip_mi(data))
              .attr("stroke", colors[2]);

//      Add axes
    pt.plotIp.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotIp.xAxis);
    pt.plotIp.chartGroup.append("g").attr("class","y axis").call(pt.plotIp.yAxis);

// Legends

    var dys_items = pt.plotIp.labelPositions(data,pt.plotIp.y);
    console.log(dys_items);
    var dys = dys_items.slice(0,3);
    var items = dys_items[3];
    console.log(items);
    console.log(dys);


    pt.plotIp.legends = pt.plotIp.chartGroup.append("g").attr("class","legend");

    pt.plotIp.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+items[0].pos+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[0].org])
            .text(items[0].longname+" ("+d3.format(".0f")(items[0].value)+")");

    pt.plotIp.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+items[1].pos+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[1].org])
            .text(items[1].longname+" ("+d3.format(".0f")(items[1].value)+")");

    pt.plotIp.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+items[2].pos+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[2].org])
            .text(items[2].longname+" ("+d3.format(".0f")(items[2].value)+")");

    // Add labels to axes
    pt.plotIp.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Index (2012=100)");

    // Last observation date
    pt.plotIp.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["month"]));


};

