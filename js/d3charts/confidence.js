// Reads data from Haver on Confidence/Sentiment/Optimism


var pt = pt || {};

pt.plotConfidence = pt.plotConfidence || {};
pt.plotConfidence.svg = null;

// Initialize SVG
pt.plotConfidence.init = function () {
    'use strict';
    // Define svg
    pt.plotConfidence.svg = d3.select("#confidence .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};


// Find label positions based on last sample values

pt.plotConfidence.labelPositions = function(data, y) {
    'use strict';
    var items = [
        { varname: 'cons_con', value: (isNaN(data[data.length-1]["cons_con"]) ?
                                             data[data.length-2]["cons_con"]   :
                                             data[data.length-1]["cons_con"] ), longname: "Cons Conf",pos: '', org: 0 },
        { varname: 'cons_sen', value: (isNaN(data[data.length-1]["cons_sen"]) ?
                                             data[data.length-2]["cons_sen"]   :
                                             data[data.length-1]["cons_sen"] ), longname: "Cons Sent",pos: '', org: 1 },
        { varname: 'sbus_opt', value: (isNaN(data[data.length-1]["sbus_opt"]) ?
                                             data[data.length-2]["sbus_opt"]   :
                                             data[data.length-1]["sbus_opt"] ), longname: "SmBs Optim " ,pos: '', org: 2 }
    ];
    console.log(items);
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
pt.plotConfidence.chart = function(error,data) {
    'use strict';


    if (error) {
        return pt.displayError(error);
    }


    // parse data
    data.forEach( function (d) {
        d.month= parseStataDate(d.time);
        d.cons_con= parseFloat(d.cons_con);
        d.cons_sen= parseFloat(d.cons_sen);
        d.sbus_opt= parseFloat(d.sbus_opt);
    });

    console.log(data);
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
    pt.plotConfidence.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotConfidence.maxDate = d3.max(data,function(d){ return d.month; });



    // Find max and min yaxis values if last obs for wgr_tkr is missing
    pt.plotConfidence.maxValue = d3.max(data,function(d){ return Math.max(d.cons_con,d.cons_sen,isNaN(d.sbus_opt) ? -Infinity : d.sbus_opt); });
    pt.plotConfidence.minValue = d3.min(data,function(d){ return Math.min(d.cons_con,d.cons_sen,isNaN(d.sbus_opt) ? +Infinity : d.sbus_opt); });

    console.log("Data range=["+pt.plotConfidence.minDate+","+pt.plotConfidence.maxDate+"]");
    console.log("Max value= " +pt.plotConfidence.maxValue);
    console.log("Min value= " +pt.plotConfidence.minValue);

    // Define scale and axes generators with custom x-axis ticks and format
    pt.plotConfidence.y = d3.scaleLinear()
                 .domain([pt.plotConfidence.minValue,pt.plotConfidence.maxValue])
                 .range([pt.innerHeight,0]).nice();
    pt.plotConfidence.x = d3.scaleTime()
                 .range([0,pt.innerWidth])
                 .domain([pt.plotConfidence.minDate,pt.plotConfidence.maxDate]);

    pt.plotConfidence.yAxis = d3.axisLeft(pt.plotConfidence.y);
    pt.plotConfidence.xAxis = d3.axisBottom(pt.plotConfidence.x)
                .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth()==0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });


    // Define line generators for each variable
    pt.plotConfidence.line_cons_con = d3.line()
                    .x(function(d){ return pt.plotConfidence.x(d.month); })
                    .y(function(d){ return pt.plotConfidence.y(d.cons_con); });
    pt.plotConfidence.line_cons_sen = d3.line()
                    .x(function(d){ return pt.plotConfidence.x(d.month); })
                    .y(function(d){ return pt.plotConfidence.y(d.cons_sen); });
    pt.plotConfidence.line_sbus_opt = d3.line()
                    .x(function(d){ return pt.plotConfidence.x(d.month); })
                    .y(function(d){ return pt.plotConfidence.y(d.sbus_opt); });


    // Define chart group
    pt.plotConfidence.chartGroup = pt.plotConfidence.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

        // Add zero line
    pt.plotConfidence.chartGroup.append("line")
                    .attr("class","vline")
                    .attr("x1", 0)
                    .attr("y1", pt.plotConfidence.y(0))
                    .attr("x2", pt.innerWidth)
                    .attr("y2", pt.plotConfidence.y(0));



//      Add time series
    pt.plotConfidence.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotConfidence.line_cons_con(data))
              .attr("stroke", colors[0]);
    pt.plotConfidence.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotConfidence.line_cons_sen(data))
              .attr("stroke", colors[1]);
    pt.plotConfidence.chartGroup
              .append("path")
              .attr("class","line")
              .attr("d",pt.plotConfidence.line_sbus_opt(data))
              .attr("stroke", colors[2]);

//      Add axes
    pt.plotConfidence.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotConfidence.xAxis);
    pt.plotConfidence.chartGroup.append("g").attr("class","y axis").call(pt.plotConfidence.yAxis);


// Legends
    var dys_items  = pt.plotConfidence.labelPositions(data,pt.plotConfidence.y)
    var dys = dys_items.slice(0,3);
    var items = dys_items[3];
    console.log(items);
    console.log(dys);

    pt.plotConfidence.legends = pt.plotConfidence.chartGroup.append("g").attr("class","legend");

    pt.plotConfidence.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[0].pos)+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[0].org])
            .text(items[0].longname+" ("+d3.format(".1f")(items[0].value)+")");

    pt.plotConfidence.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[1].pos)+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[1].org])
            .text(items[1].longname+" ("+d3.format(".1f")(items[1].value)+")");

    pt.plotConfidence.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[2].pos)+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[items[2].org])
            .text(items[2].longname+" ("+d3.format(".1f")(items[2].value)+")");

    pt.plotConfidence.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["month"]));

    // Add labels to axes
    pt.plotConfidence.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Index");

};

