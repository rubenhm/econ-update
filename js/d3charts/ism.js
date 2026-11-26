// Reads data from CSV exported from Haver
// Generic file that plots an array of time series with line charts
// Assumes there is a variable with recession indicators 

// time,ism_mf,ism_nmf,recessm
// 2005m1,56.8,58,-1
// 2005m2,55.5,59.4,-1
// 2005m3,55.2,58,-1

var pt = pt || {};

pt.plotIsm = pt.plotIsm || {};
pt.plotIsm.svg = null;


pt.plotIsm.init = function () {
    'use strict';
    // Define svg
    pt.plotIsm.svg = d3.select("#ism .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};


// Find label positions based on last sample values

pt.plotIsm.labelPositions = function(data, y) {
    'use strict';
    var items = [
        { varname: 'ism_mf', value: isNaN(data[data.length-1]["ism_mf"]) ? data[data.length-2]["ism_mf"] : data[data.length-1]["ism_mf"], longname: "Manufacturing",pos: '', org: 0 },
        { varname: 'ism_nm', value: isNaN(data[data.length-1]["ism_nm"]) ? data[data.length-2]["ism_nm"] : data[data.length-1]["ism_nm"], longname: "Non-manufact." , pos: '', org: 1 },

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


    if (d0 > 20 ) {
        console.log("case 1: no adjustments");
        items[0].pos = y(items[0].value);
        items[1].pos = y(items[1].value);
    }
    if (d0 < 20 ) {
        console.log("case 2: adjust 1 and 2");
        items[0].pos = y(items[0].value) + 5;
        items[1].pos = y(items[1].value) - 5;
    }
    var dys = [d0, items];
    console.log(dys);
    return dys;
};



pt.plotIsm.chart = function(error,data) {
    'use strict';


    if (error) {
        return pt.displayError(error);
    }

    //parse data
    data.forEach(function (d) {
        d.month = parseStataDate(d.time);
        d.recind = parseFloat(d.recessm);
        d.ism_mf = parseFloat(d.ism_mf);
        d.ism_nm = parseFloat(d.ism_nmf);

    });

    // Limit starting sample date, same as labor
    var minDate = parseDate("2007-01-01");

    // Limit sample data. Slice from given date.
    function findMinDate(d) {
        return d.month.getTime() >= minDate;
    }

    // data = data.slice(data.findIndex(findFirstDate, minDate), data.length);
    data = data.filter(findMinDate);
    console.log(data);

    // Determine initial date
    pt.plotIsm.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotIsm.maxDate = d3.max(data,function(d){ return d.month; });



    // Find max and min yaxis values
    pt.plotIsm.maxValue = d3.max(data,function(d){ return Math.max(d.ism_mf,isNaN(d.ism_nm) ? - Infinity : d.ism_nm ); });
    pt.plotIsm.minValue = d3.min(data,function(d){ return Math.min(d.ism_mf,isNaN(d.ism_nm) ? + Infinity : d.ism_nm ); });

    console.log("Data range=["+pt.plotIsm.minDate+","+pt.plotIsm.maxDate+"]");
    console.log("Max value= "+pt.plotIsm.maxValue);
    console.log("Min value= "+pt.plotIsm.minValue);

    // Define scale and axes generators
    pt.plotIsm.y = d3.scaleLinear()
                 .domain([pt.plotIsm.minValue,pt.plotIsm.maxValue])
                 .range([pt.innerHeight,0]).nice();
    pt.plotIsm.x = d3.scaleTime()
                 .domain([pt.plotIsm.minDate,pt.plotIsm.maxDate])
                 .range([0,pt.innerWidth]);
    pt.plotIsm.yAxis = d3.axisLeft(pt.plotIsm.y);
    pt.plotIsm.xAxis = d3.axisBottom(pt.plotIsm.x)
                        // .ticks(d3.timeMonth.every(1))
                        .tickFormat(function (d) {
                            if (d.getMonth() === 0) {
                                return d3.timeFormat("%Y")(d);
                            } else {
                                return "";
                            }
                        });


    // Define line generators for each variable
    pt.plotIsm.line_mf = d3.line()
                    .x(function(d){ return pt.plotIsm.x(d.month); })
                    .y(function(d){ return pt.plotIsm.y(d.ism_mf); });
    pt.plotIsm.line_nm = d3.line()
                    .x(function(d){ return pt.plotIsm.x(d.month); })
                    .y(function(d){ return pt.plotIsm.y(d.ism_nm); });



    // Define recession bars as a rect shape in the svg
    // Define function to find index of start and end of recession dates
    var recData = data.filter( function (d,i) {
        d.recidx = i;
        return d.recind == 1;
    });
    var firstRecMonth = recData[0].recidx;
    var numRecMonths = recData[recData.length-1].recidx - firstRecMonth + 1;
    var lengthData = data.length;

    console.log(firstRecMonth);
    console.log(numRecMonths);

    // Define chart group
    pt.plotIsm.chartGroup = pt.plotIsm.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    // Add +50 line
    pt.plotIsm.chartGroup.append("line")
                    .attr("class","vline")
                    .attr("x1", 0)
                    .attr("y1", pt.plotIsm.y(50))
                    .attr("x2", pt.innerWidth)
                    .attr("y2", pt.plotIsm.y(50));

    // Add recession bar
    // Recession bar as rectangle. Looks good.
    pt.plotIsm.chartGroup.append("rect")
                    .attr("class","recessm")
                    .attr("x", pt.innerWidth*firstRecMonth/lengthData )
                    .attr("y", 0)
                    .attr("width", pt.innerWidth*numRecMonths/lengthData)
                    .attr("height",pt.innerHeight);

    //  Add time series
    pt.plotIsm.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotIsm.line_mf(data))
              .attr("stroke", colors[0]);
    pt.plotIsm.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotIsm.line_nm(data))
              .attr("stroke", colors[1]);


    //  Add axes
    pt.plotIsm.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotIsm.xAxis);
    pt.plotIsm.chartGroup.append("g").attr("class","y axis").call(pt.plotIsm.yAxis);

// Legends
    var dys_items  = pt.plotIsm.labelPositions(data,pt.plotIsm.y)
    var dys = dys_items.slice(0,1);
    var items = dys_items[1];
    console.log(items);
    console.log(dys);



    pt.plotIsm.legends = pt.plotIsm.chartGroup.append("g").attr("class","legend");

    pt.plotIsm.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[0].pos)+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[0].org])
            .text(items[0].longname+" ("+d3.format(".1f")(items[0].value)+")");

    pt.plotIsm.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[1].pos)+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[1].org])
            .text(items[1].longname+" ("+d3.format(".1f")(items[1].value)+")");


    // Add labels to axes
    pt.plotIsm.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Diffusion index");

    pt.plotIsm.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["month"]));


};

