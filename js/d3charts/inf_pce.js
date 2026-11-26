// Reads CPI data from CSV exported from FRED


var pt = pt || {};

pt.plotPce = pt.plotPce || {};
pt.plotPce.svg = null;

// Initialize SVG
pt.plotPce.init = function () {
    'use strict';
    // Define svg
    pt.plotPce.svg = d3.select("#inf_pce .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};



// Find label positions based on last sample values

pt.plotPce.labelPositions = function(data, y) {
    'use strict';
    var items = [
        { varname: 'pce', value: data[data.length-1]["pce"], longname: "Headline PCE",pos: '', org: 0 },
        { varname: 'pce_core', value: data[data.length-1]["pce_core"], longname: "Core PCE" , pos: '', org: 1 },
        { varname: 'pce_mean', value: data[data.length-1]["pce_mean"], longname: "Trimmed Mean" , pos: '', org: 2 }
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
pt.plotPce.chart = function(error,data) {
    'use strict';


    if (error) {
        return pt.displayError(error);
    }


    // parse data
    data.forEach( function (d) {
        d.month= parseDate(d.DATE);
        d.pce= Number(d.PCE_Inf);
        d.pce_core= Number(d.PCE_Core_Inf);
        d.pce_mean= Number(d.PCE_Mean);
    });

    // Limit starting sample date, same as labor
    var minDate =  minLaborDate;

    // Limit sample data. Slice from given date.
    function findMinDate(d) {
        return d.month.getTime() >= minDate;
    }

    // data = data.slice(data.findIndex(findFirstDate, minDate), data.length);
    data = data.filter(findMinDate);

    // TODO: Slice at end of sample if there is no data.
    data = data.filter(function (d) {
        if (d.PCE_Inf !== "") {
            return d;
        }
    });

    console.log(data);

    // Determine initial date
    pt.plotPce.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotPce.maxDate = d3.max(data,function(d){ return d.month; });



    // Find max and min yaxis values
    pt.plotPce.maxValue = d3.max(data,function(d){ return Math.max(d.pce,d.pce_core,d.pce_mean); });
    pt.plotPce.minValue = d3.min(data,function(d){ return Math.min(d.pce,d.pce_core,d.pce_mean); });

    console.log("Data range=["+pt.plotPce.minDate+","+pt.plotPce.maxDate+"]");
    console.log("Max value= "+pt.plotPce.maxValue);
    console.log("Min value= "+pt.plotPce.minValue);

    // Define scale and axes generators with custom x-axis ticks and format
    pt.plotPce.y = d3.scaleLinear()
                 .domain([pt.plotPce.minValue,pt.plotPce.maxValue])
                 .range([pt.innerHeight,0]).nice();
    pt.plotPce.x = d3.scaleTime()
                 .range([0,pt.innerWidth])
                 .domain([pt.plotPce.minDate,pt.plotPce.maxDate]);

    pt.plotPce.yAxis = d3.axisLeft(pt.plotPce.y);
    pt.plotPce.xAxis = d3.axisBottom(pt.plotPce.x)
                .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth()==0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });


    // Define line generators for each variable
    pt.plotPce.line_pce = d3.line()
                    .x(function(d){ return pt.plotPce.x(d.month); })
                    .y(function(d){ return pt.plotPce.y(d.pce); });
    pt.plotPce.line_pce_core = d3.line()
                    .x(function(d){ return pt.plotPce.x(d.month); })
                    .y(function(d){ return pt.plotPce.y(d.pce_core); });
    pt.plotPce.line_pce_mean = d3.line()
                    .x(function(d){ return pt.plotPce.x(d.month); })
                    .y(function(d){ return pt.plotPce.y(d.pce_mean); });


    // Define chart group
    pt.plotPce.chartGroup = pt.plotPce.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

        // Add 2-percent target line
    pt.plotPce.chartGroup.append("line")
                    .attr("class","vline")
                    .attr("x1", 0)
                    .attr("y1", pt.plotPce.y(2))
                    .attr("x2", pt.innerWidth)
                    .attr("y2", pt.plotPce.y(2));



//      Add time series
    pt.plotPce.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotPce.line_pce(data))
              .attr("stroke", colors[0]);
    pt.plotPce.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotPce.line_pce_core(data))
              .attr("stroke", colors[1]);
    pt.plotPce.chartGroup
              .append("path")
              .attr("class","line").attr("d",pt.plotPce.line_pce_mean(data))
              .attr("stroke", colors[2]);

//      Add axes
    pt.plotPce.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotPce.xAxis);
    pt.plotPce.chartGroup.append("g").attr("class","y axis").call(pt.plotPce.yAxis);

// Legends
 
    var dys_items  = pt.plotPce.labelPositions(data,pt.plotPce.y)
    var dys = dys_items.slice(0,3);
    var items = dys_items[3];
    console.log(items);
    console.log(dys);


    pt.plotPce.legends = pt.plotPce.chartGroup.append("g").attr("class","legend");

    pt.plotPce.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+items[0].pos+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[0].org])
            .text(items[0].longname+" ("+d3.format(".1f")(items[0].value)+")");

    pt.plotPce.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+items[1].pos+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[1].org])
            .text(items[1].longname+" ("+d3.format(".1f")(items[1].value)+")");

    pt.plotPce.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+items[2].pos+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[2].org])
            .text(items[2].longname+" ("+d3.format(".1f")(items[2].value)+")");

    pt.plotPce.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["month"]));

    // Add labels to axes
    pt.plotPce.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Year-over-year percent change");

};

