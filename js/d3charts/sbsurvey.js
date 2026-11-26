// Reads data from CSV exported from Haver
// Generic file that plots an array of time series with line charts
// Assumes there is a variable with recession indicators 

// Example file: SBS_USECON.CSV
// date,recessm,nfib18,nfib19,nfib2
// 2007m1,-1,17,26,26
// 2007m2,-1,19,30,25
// 2007m3,-1,19,28,26
// 2007m4,-1,18,26,26

var pt = pt || {};

pt.plotSbs = pt.plotSbs || {};
pt.plotSbs.svg = null;


pt.plotSbs.init = function () {
    'use strict';
    // Define svg
    pt.plotSbs.svg = d3.select("#sbsurvey .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};

pt.plotSbs.labelPositions = function(data, y) {
    'use strict';
    var items = [
        { varname: 'vnext', value: data[data.length-1]["vnext"], longname: "Will raise wages",pos: '' },
        { varname: 'vpast', value: data[data.length-1]["vpast"], longname: "Has raised wages" , pos: '' },
        { varname: 'vposit', value: data[data.length-1]["vposit"], longname: "Has positions" , pos: '' }
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
        items[0].pos = y(items[0].value) + 10;
        items[1].pos = y(items[1].value) - 10;
        items[2].pos = y(items[2].value);
    }
    if (d0 > 20 && d1 < 20){
        console.log("case 3: adjust 2 and 3");
        items[0].pos = y(items[0].value);
        items[1].pos = y(items[1].value)+5;
        items[2].pos = y(items[2].value)-5;
    }
    var dys = [d0,d1,d2, items];
    console.log(dys);
    return dys;
};



pt.plotSbs.chart = function(error,data) {

    if (error) {
        return pt.displayError(error);
    }


    // parse data
    data.forEach( function (d) {
        d.month= parseStataDate(d.time);
        d.recind= Number(d.recessm);
        d.vnext= Number(d.sbs_next);
        d.vpast= Number(d.sbs_past);
        d.vposit= Number(d.sbs_dif);
    });



    // Determine initial date
    pt.plotSbs.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotSbs.maxDate = d3.max(data,function(d){ return d.month; });



    // Find max and min yaxis values
    pt.plotSbs.maxValue = d3.max(data,function(d){ return Math.max(d.vnext,d.vpast,d.vposit); });
    pt.plotSbs.minValue = d3.min(data,function(d){ return Math.min(d.vnext,d.vpast,d.vposit); });

    console.log("Data range=["+pt.plotSbs.minDate+","+pt.plotSbs.maxDate+"]");
    console.log("Max value= "+pt.plotSbs.maxValue);
    console.log("Min value= "+pt.plotSbs.minValue);

    // Define scale and axes generators
    pt.plotSbs.y = d3.scaleLinear()
                 .domain([pt.plotSbs.minValue,pt.plotSbs.maxValue])
                 .range([pt.innerHeight,0]).nice();
    pt.plotSbs.x = d3.scaleTime()
                 .domain([pt.plotSbs.minDate,pt.plotSbs.maxDate])
                 .range([0,pt.innerWidth]);
    pt.plotSbs.yAxis = d3.axisLeft(pt.plotSbs.y);
    pt.plotSbs.xAxis = d3.axisBottom(pt.plotSbs.x)
                        // .ticks(d3.timeMonth.every(1))
                        .tickFormat(function (d) {
                            if (d.getMonth()==0) {
                                return d3.timeFormat("%Y")(d);
                            } else {
                                return "";
                            }
                        });


    // Define line generators for each variable
    pt.plotSbs.line_vnext = d3.line()
                    .x(function(d){ return pt.plotSbs.x(d.month); })
                    .y(function(d){ return pt.plotSbs.y(d.vnext); });
    pt.plotSbs.line_vpast = d3.line()
                    .x(function(d){ return pt.plotSbs.x(d.month); })
                    .y(function(d){ return pt.plotSbs.y(d.vpast); });
    pt.plotSbs.line_vposit = d3.line()
                    .x(function(d){ return pt.plotSbs.x(d.month); })
                    .y(function(d){ return pt.plotSbs.y(d.vposit); });


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
    pt.plotSbs.chartGroup = pt.plotSbs.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    // Add zero line
    pt.plotSbs.chartGroup.append("line")
                    .attr("class","vline")
                    .attr("x1", 0)
                    .attr("y1", pt.plotSbs.y(0))
                    .attr("x2", pt.innerWidth)
                    .attr("y2", pt.plotSbs.y(0));



    // Add recession bar

    // Recession bar as rectangle. Looks good.
    pt.plotSbs.chartGroup.append("rect")
                    .attr("class","recessm")
                    .attr("x", pt.innerWidth*firstRecMonth/lengthData )
                    .attr("y", 0)
                    .attr("width", pt.innerWidth*numRecMonths/lengthData)
                    .attr("height",pt.innerHeight);

//      Add time series
    pt.plotSbs.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotSbs.line_vnext(data))
              .attr("stroke", colors[0]);
    pt.plotSbs.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotSbs.line_vpast(data))
              .attr("stroke", colors[1]);
    pt.plotSbs.chartGroup
              .append("path")
              .attr("class","line").attr("d",pt.plotSbs.line_vposit(data))
              .attr("stroke", colors[2]);

//      Add axes
    pt.plotSbs.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotSbs.xAxis);
    pt.plotSbs.chartGroup.append("g").attr("class","y axis").call(pt.plotSbs.yAxis);

// Legends
    var dys_items  = pt.plotSbs.labelPositions(data,pt.plotSbs.y)
    var dys = dys_items.slice(0,3);
    var items = dys_items[3];
    console.log(items);
    console.log(dys);

    pt.plotSbs.legends = pt.plotSbs.chartGroup.append("g").attr("class","legend");

    pt.plotSbs.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[0].pos)+")")
        .attr("dy",".35em")
        .attr("text-anchor","start")
        .style("fill",colors[0])
        .text(items[0].longname+" ("+d3.format(".0f")(items[0].value)+")");

    pt.plotSbs.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[1].pos)+")")
        .attr("dy",".35em")
        .attr("text-anchor","start")
        .style("fill",colors[1])
        .text(items[1].longname+" ("+d3.format(".0f")(items[1].value)+")");

    pt.plotSbs.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+(items[2].pos)+")")
        .attr("dy",".35em")
        .attr("text-anchor","start")
        .style("fill",colors[2])
        .text(items[2].longname+" ("+d3.format(".0f")(items[2].value)+")");


// Last Observation
    pt.plotSbs.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["month"]));


    // Add labels to axes
    pt.plotSbs.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Percent of firms");

};

