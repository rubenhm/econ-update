// Reads CPI data from CSV exported from FRED


var pt = pt || {};

pt.plotWageGrowth = pt.plotWageGrowth || {};
pt.plotWageGrowth.svg = null;

// Initialize SVG
pt.plotWageGrowth.init = function () {
    'use strict';
    // Define svg
    pt.plotWageGrowth.svg = d3.select("#wage_growth .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};


// Find label positions based on last sample values

pt.plotWageGrowth.labelPositions = function(data, y) {
    'use strict';

    var items = [
        { varname: 'cons_con', value: (isNaN(data[data.length-1]["wgr_all"]) ?
                                             data[data.length-2]["wgr_all"]  :
                                             data[data.length-1]["wgr_all"] ), longname: "AHE AE",pos: '', org: 0 },
        { varname: 'cons_sen', value: (isNaN(data[data.length-1]["wgr_pns"]) ?
                                             data[data.length-2]["wgr_pns"]  :
                                             data[data.length-1]["wgr_pns"] ), longname: "AHE PNS",pos: '', org: 1 },
        { varname: 'sbus_opt', value: (isNaN(data[data.length-1]["wgr_tkr"]) ?
                                             data[data.length-2]["wgr_tkr"]  :
                                             data[data.length-1]["wgr_tkr"] ), longname: "AWT (3MMA)",pos: '', org: 2 }
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
pt.plotWageGrowth.chart = function(error,data) {
    'use strict';


    if (error) {
        return pt.displayError(error);
    }


    // parse data
    data.forEach( function (d) {
        d.month= parseDate(d.DATE);
        d.wgr_all= parseFloat(d.wg_allemp);
        d.wgr_pns= parseFloat(d.wg_prnsup);
        d.wgr_tkr= parseFloat(d.WGT);
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
    pt.plotWageGrowth.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotWageGrowth.maxDate = d3.max(data,function(d){ return d.month; });



    // Find max and min yaxis values if last obs for wgr_tkr is missing
    pt.plotWageGrowth.maxValue = d3.max(data,function(d){ return Math.max(d.wgr_all,d.wgr_pns,isNaN(d.wgr_tkr) ? -Infinity : d.wgr_tkr); });
    pt.plotWageGrowth.minValue = d3.min(data,function(d){ return Math.min(d.wgr_all,d.wgr_pns,isNaN(d.wgr_tkr) ? +Infinity : d.wgr_tkr); });

    console.log("Data range=["+pt.plotWageGrowth.minDate+","+pt.plotWageGrowth.maxDate+"]");
    console.log("Max value= "+pt.plotWageGrowth.maxValue);
    console.log("Min value= "+pt.plotWageGrowth.minValue);

    // Define scale and axes generators with custom x-axis ticks and format
    pt.plotWageGrowth.y = d3.scaleLinear()
                 .domain([pt.plotWageGrowth.minValue,pt.plotWageGrowth.maxValue])
                 .range([pt.innerHeight,0]).nice();
    pt.plotWageGrowth.x = d3.scaleTime()
                 .range([0,pt.innerWidth])
                 .domain([pt.plotWageGrowth.minDate,pt.plotWageGrowth.maxDate]);

    pt.plotWageGrowth.yAxis = d3.axisLeft(pt.plotWageGrowth.y);
    pt.plotWageGrowth.xAxis = d3.axisBottom(pt.plotWageGrowth.x)
                .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth()==0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });


    // Define line generators for each variable
    pt.plotWageGrowth.line_wgr_all = d3.line()
                    .x(function(d){ return pt.plotWageGrowth.x(d.month); })
                    .y(function(d){ return pt.plotWageGrowth.y(d.wgr_all); });
    pt.plotWageGrowth.line_wgr_pns = d3.line()
                    .x(function(d){ return pt.plotWageGrowth.x(d.month); })
                    .y(function(d){ return pt.plotWageGrowth.y(d.wgr_pns); });
    pt.plotWageGrowth.line_wgr_tkr = d3.line()
                    .x(function(d){ return pt.plotWageGrowth.x(d.month); })
                    .y(function(d){ return pt.plotWageGrowth.y(d.wgr_tkr); });


    // Define chart group
    pt.plotWageGrowth.chartGroup = pt.plotWageGrowth.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

        // Add zero line
    pt.plotWageGrowth.chartGroup.append("line")
                    .attr("class","vline")
                    .attr("x1", 0)
                    .attr("y1", pt.plotWageGrowth.y(0))
                    .attr("x2", pt.innerWidth)
                    .attr("y2", pt.plotWageGrowth.y(0));



//      Add time series
    pt.plotWageGrowth.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotWageGrowth.line_wgr_all(data))
              .attr("stroke", colors[0]);
    pt.plotWageGrowth.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotWageGrowth.line_wgr_pns(data))
              .attr("stroke", colors[1]);
    pt.plotWageGrowth.chartGroup
              .append("path")
              .attr("class","line")
              .attr("d",pt.plotWageGrowth.line_wgr_tkr(data))
              .attr("stroke", colors[2]);

//      Add axes
    pt.plotWageGrowth.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotWageGrowth.xAxis);
    pt.plotWageGrowth.chartGroup.append("g").attr("class","y axis").call(pt.plotWageGrowth.yAxis);


// Legends
    var dys_items  = pt.plotWageGrowth.labelPositions(data,pt.plotWageGrowth.y)
    var dys = dys_items.slice(0,3);
    var items = dys_items[3];
    console.log(items);
    console.log(dys);

    pt.plotWageGrowth.legends = pt.plotWageGrowth.chartGroup.append("g").attr("class","legend");

    pt.plotWageGrowth.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[0].pos)+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[0].org])
            .text(items[0].longname+" ("+d3.format(".1f")(items[0].value)+")");

    pt.plotWageGrowth.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[1].pos)+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[1].org])
            .text(items[1].longname+" ("+d3.format(".1f")(items[1].value)+")");

    pt.plotWageGrowth.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[2].pos)+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[2].org])
            .text(items[2].longname+" ("+d3.format(".1f")(items[2].value)+")");

    pt.plotWageGrowth.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["month"]));

    // Add labels to axes
    pt.plotWageGrowth.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Year-over-year percent change");

};

