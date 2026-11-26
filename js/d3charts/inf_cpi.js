// Reads CPI data from CSV exported from FRED


var pt = pt || {};

pt.plotCpi = pt.plotCpi || {};
pt.plotCpi.svg = null;

// Initialize SVG
pt.plotCpi.init = function () {
    'use strict';
    // Define svg
    pt.plotCpi.svg = d3.select("#inf_cpi .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};


// Find label positions based on last sample values

pt.plotCpi.labelPositions = function(data, y) {
    'use strict';
    var items = [
        { varname: 'cpi', value: data[data.length-1]["cpi"], longname: "Headline CPI",pos: '', org: 0 },
        { varname: 'cpi_core', value: data[data.length-1]["cpi_core"], longname: "Core CPI" , pos: '', org: 1 },
        { varname: 'cpi_med', value: data[data.length-1]["cpi_med"], longname: "Median CPI" , pos: '', org: 2 }
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


    if (d0 > 20 && d1 > 20) {
        console.log("case 1: no adjustments");
        items[0].pos = y(items[0].value);
        items[1].pos = y(items[1].value);
        items[2].pos = y(items[2].value);
    }
    if (d0 < 20  && d1 > 20) {
        console.log("case 2: adjust 1 and 2");
        items[0].pos = y(items[0].value) + 5;
        items[1].pos = y(items[1].value) - 5;
        items[2].pos = y(items[2].value);
    }
    if (d0 > 20 && d1 < 20){
        console.log("case 3: adjust 2 and 3");
        items[0].pos = y(items[0].value);
        items[1].pos = y(items[1].value) + 5;
        items[2].pos = y(items[2].value) - 5;
    }
    var dys = [d0,d1,d2, items];
    console.log(dys);
    return dys;
};


// Prepare chart
pt.plotCpi.chart = function(error,data) {
    'use strict';


    if (error) {
        return pt.displayError(error);
    }


    // parse data
    data.forEach( function (d) {
        d.month= parseDate(d.DATE);
        d.cpi= Number(d.CPI_Inf);
        d.cpi_core= Number(d.CPI_Core_Inf);
        d.cpi_med= Number(d.CPI_Median_Inf);
    });

    // Limit starting sample date, same as labor
    var minDate =  minLaborDate;

    // Limit sample data. Slice from given date.
    function findMinDate(d) {
        return d.month.getTime() >= minDate;
    }

    // data = data.slice(data.findIndex(findFirstDate, minDate), data.length);
    data = data.filter(findMinDate);
    console.log(data);


    // Determine initial date
    pt.plotCpi.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotCpi.maxDate = d3.max(data,function(d){ return d.month; });



    // Find max and min yaxis values
    pt.plotCpi.maxValue = d3.max(data,function(d){ return Math.max(d.cpi,d.cpi_core,d.cpi_med); });
    pt.plotCpi.minValue = d3.min(data,function(d){ return Math.min(d.cpi,d.cpi_core,d.cpi_med); });

    console.log("Data range=["+pt.plotCpi.minDate+","+pt.plotCpi.maxDate+"]");
    console.log("Max value= "+pt.plotCpi.maxValue);
    console.log("Min value= "+pt.plotCpi.minValue);

    // Define scale and axes generators with custom x-axis ticks and format
    pt.plotCpi.y = d3.scaleLinear()
                 .domain([pt.plotCpi.minValue,pt.plotCpi.maxValue])
                 .range([pt.innerHeight,0]).nice();
    pt.plotCpi.x = d3.scaleTime()
                 .range([0,pt.innerWidth])
                 .domain([pt.plotCpi.minDate,pt.plotCpi.maxDate]);

    pt.plotCpi.yAxis = d3.axisLeft(pt.plotCpi.y);
    pt.plotCpi.xAxis = d3.axisBottom(pt.plotCpi.x)
                .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth()==0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });


    // Define line generators for each variable
    pt.plotCpi.line_cpi = d3.line()
                    .x(function(d){ return pt.plotCpi.x(d.month); })
                    .y(function(d){ return pt.plotCpi.y(d.cpi); });
    pt.plotCpi.line_cpi_core = d3.line()
                    .x(function(d){ return pt.plotCpi.x(d.month); })
                    .y(function(d){ return pt.plotCpi.y(d.cpi_core); });
    pt.plotCpi.line_cpi_med = d3.line()
                    .x(function(d){ return pt.plotCpi.x(d.month); })
                    .y(function(d){ return pt.plotCpi.y(d.cpi_med); });


    // Define chart group
    pt.plotCpi.chartGroup = pt.plotCpi.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

        // Add zero line
    pt.plotCpi.chartGroup.append("line")
                    .attr("class","vline")
                    .attr("x1", 0)
                    .attr("y1", pt.plotCpi.y(0))
                    .attr("x2", pt.innerWidth)
                    .attr("y2", pt.plotCpi.y(0));



//      Add time series
    pt.plotCpi.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotCpi.line_cpi(data))
              .attr("stroke", colors[0]);
    pt.plotCpi.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotCpi.line_cpi_core(data))
              .attr("stroke", colors[1]);
    pt.plotCpi.chartGroup
              .append("path")
              .attr("class","line").attr("d",pt.plotCpi.line_cpi_med(data))
              .attr("stroke", colors[2]);

//      Add axes
    pt.plotCpi.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotCpi.xAxis);
    pt.plotCpi.chartGroup.append("g").attr("class","y axis").call(pt.plotCpi.yAxis);


// Legends
    var dys_items  = pt.plotCpi.labelPositions(data,pt.plotCpi.y)
    var dys = dys_items.slice(0,3);
    var items = dys_items[3];
    console.log(items);
    console.log(dys);

    pt.plotCpi.legends = pt.plotCpi.chartGroup.append("g").attr("class","legend");

    pt.plotCpi.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[0].pos)+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[0].org])
            .text(items[0].longname+" ("+d3.format(".1f")(items[0].value)+")");

    pt.plotCpi.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[1].pos)+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[1].org])
            .text(items[1].longname+" ("+d3.format(".1f")(items[1].value)+")");

    pt.plotCpi.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[2].pos)+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[2].org])
            .text(items[2].longname+" ("+d3.format(".1f")(items[2].value)+")");

    pt.plotCpi.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["month"]));

    // Add labels to axes
    pt.plotCpi.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Year-over-year percent change");

};

