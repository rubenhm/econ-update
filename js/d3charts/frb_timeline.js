
var pt = pt || {};

pt.plotFrbTimeline = pt.plotFrbTimeline || {};
pt.plotFrbTimeline.svg = null;

// var parseFFdate = d3.timeParse("%e-%b-%Y"),
var parseFFdate = d3.timeParse("%Y-%m-%d"),
    parseBSdate = d3.timeParse("%Y-%m-%d");


pt.plotFrbTimeline.init = function () {
    'use strict';
    // Define svg
    pt.plotFrbTimeline.svg = d3.select("#frb_timeline .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};

pt.plotFrbTimeline.chart = function(error,ff_data,assets_data,timeLine_data) {
    'use strict';


    if (error) {
        // return console.log("Error loading data")
        return pt.displayError(error);
    }

    //parse data
    ff_data.forEach(function (d) {
        d.date = parseFFdate(d.DATE);
        d.ffr = ( Number(d.FFRLO) + Number(d.FFRHI) )/2;
    });

    assets_data.forEach( function (d) {
        d.date = parseBSdate(d.date);
        d.assets = Number(d.TotalAssets)/1e6;
    })

    console.log(ff_data)
    console.log(assets_data)

    // Limit starting sample date, same as Total Assets
    var minDate = parseBSdate("2007-08-01");

    // Limit sample data. Slice from given date.
    function findMinDate(d) {
        return d.date.getTime() >= minDate;
    }

    // data = data.slice(data.findIndex(findFirstDate, minDate), data.length);
    ff_data = ff_data.filter(findMinDate);
    console.log(ff_data[0]);

    // Determine initial date
    pt.plotFrbTimeline.minDate = d3.min(ff_data,function(d){ return d.date; });
    // Define max date
    pt.plotFrbTimeline.maxDate = d3.max(ff_data,function(d){ return d.date; });


    // Find max and min yaxis values
    pt.plotFrbTimeline.y0maxValue = d3.max(ff_data,function(d){ return Math.max(d.ffr); });
    pt.plotFrbTimeline.y0minValue = d3.min(ff_data,function(d){ return Math.min(d.ffr); });
    pt.plotFrbTimeline.y1maxValue = d3.max(assets_data,function(d){ return Math.max(d.assets); });
    pt.plotFrbTimeline.y1minValue = d3.min(assets_data,function(d){ return Math.min(d.assets); });

    pt.plotFrbTimeline.yRange = [Math.min(pt.plotFrbTimeline.y0minValue,pt.plotFrbTimeline.y1minValue),
                                 Math.max(pt.plotFrbTimeline.y0maxValue,pt.plotFrbTimeline.y1maxValue)];

    console.log("Data range=["+pt.plotFrbTimeline.minDate+","+pt.plotFrbTimeline.maxDate+"]");

    // Define scale and axes generators
    pt.plotFrbTimeline.y0 = d3.scaleLinear()
                 .domain(pt.plotFrbTimeline.yRange)
                 .range([pt.innerHeight,0]).nice();
    pt.plotFrbTimeline.y1 = d3.scaleLinear()
                 .domain(pt.plotFrbTimeline.yRange)
                 .range([pt.innerHeight,0]).nice();
    pt.plotFrbTimeline.x = d3.scaleTime()
                 .domain([pt.plotFrbTimeline.minDate,pt.plotFrbTimeline.maxDate])
                 .range([0,pt.innerWidth]);
    pt.plotFrbTimeline.yAxisLeft = d3.axisLeft(pt.plotFrbTimeline.y0);
    pt.plotFrbTimeline.yAxisRight = d3.axisRight(pt.plotFrbTimeline.y1);
    pt.plotFrbTimeline.xAxis = d3.axisBottom(pt.plotFrbTimeline.x)
                        .ticks(d3.timeMonth.every(1))
                        .tickFormat(function (d) {
                            if (d.getMonth() === 0) {
                                return d3.timeFormat("%Y")(d);
                            } else {
                                return "";
                            }
                        });


    // Define line generators for each variable
    pt.plotFrbTimeline.line_ff = d3.line()
                    .x(function(d){ return pt.plotFrbTimeline.x(d.date); })
                    .y(function(d){ return pt.plotFrbTimeline.y0(d.ffr); });
    pt.plotFrbTimeline.line_bs = d3.line()
                    .x(function(d){ return pt.plotFrbTimeline.x(d.date); })
                    .y(function(d){ return pt.plotFrbTimeline.y1(d.assets); });



    // Define chart group
    pt.plotFrbTimeline.chartGroup = pt.plotFrbTimeline.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    //  Add time series
    pt.plotFrbTimeline.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotFrbTimeline.line_ff(ff_data))
              .attr("stroke", colors[0]);
    pt.plotFrbTimeline.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotFrbTimeline.line_bs(assets_data))
              .attr("stroke", colors[1]);


    //  Add axes
    pt.plotFrbTimeline.chartGroup.append("g")
         .attr("class","x axis")
         .attr("transform","translate(0,"+(pt.innerHeight)+")")
         .call(pt.plotFrbTimeline.xAxis);
    pt.plotFrbTimeline.chartGroup.append("g")
         .attr("class","y axis")
         .call(pt.plotFrbTimeline.yAxisLeft);
    // pt.plotFrbTimeline.chartGroup.append("g")
    //      .attr("class","y axis")
    //      .attr("transform", "translate(" + pt.innerWidth + " ,0)")  
    //      .call(pt.plotFrbTimeline.yAxisRight);

// Legends
    var varNames = ["FFR","Balance Sheet"];


    pt.plotFrbTimeline.legends = pt.plotFrbTimeline.chartGroup.append("g").attr("class","legend");

        pt.plotFrbTimeline.legends
            .append("text")
            .attr("transform","translate("+(pt.innerWidth +4)+","+ pt.plotFrbTimeline.y0(ff_data[ff_data.length-1]["ffr"]) +")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[0])
            .text(varNames[0] + " (" + d3.format(".3f")(ff_data[ff_data.length-1]["ffr"]) + "%)");

        pt.plotFrbTimeline.legends
            .append("text")
            .attr("transform","translate("+(pt.innerWidth +4)+","+ pt.plotFrbTimeline.y0(assets_data[assets_data.length-1]["assets"]) +")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[1])
            .text(varNames[1] + " ($" + d3.format(".1f")(assets_data[assets_data.length-1]["assets"]) + "T)");



    // Add labels to axes
    pt.plotFrbTimeline.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Percent, Trillions of USD");

    pt.plotFrbTimeline.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", -topYAxisPadding)
            .attr("text-anchor","end")
            .text("Balance Sheet last obs. "+ d3.timeFormat("%e %b %Y")(assets_data[assets_data.length-1]["date"]));
    pt.plotFrbTimeline.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", -topYAxisPadding + 20)
            .attr("text-anchor","end")
            .text("Fed Funds Rate last obs. "+ d3.timeFormat("%e %b %Y")(ff_data[ff_data.length-1]["date"]));

   
    // Add annotations

    var annotations = [{
        note: { label: "First Event"},
        subject: {
            y1: pt.margin.top,
            y2: pt.innerHeight
        },
        y: pt.margin.top,
        data: { x: "1/1/2008"}
    }]

    // console.log(annotations)

    // pt.plotFrbTimeline.chartGroup.type = d3.annotationCustomType(
    //         d3.annotationXYThreshold, 
    //         {"note":{
    //             "lineType":"none",
    //             "orientation": "top",
    //             "align":"middle"}
    //         }
    //       )

    // pt.plotFrbTimeline.chartGroup.makeAnnotations = d3.annotation()
    //     .type(pt.plotFrbTimeline.chartGroup.type)
    //     .accessors({
    //         x: function (d) { return pt.plotFrbTimeline.x(new Date(d.x))},
    //         y: function (d) { return pt.plotFrbTimeline.y0(d.y)}
    //     })
    //     .annotations(annotations)
    //     .textWrap(30)

    // pt.plotFrbTimeline.chartGroup.append("g")
    //     .attr("class","annotation-group")
    //     .call(pt.plotFrbTimeline.chartGroup.makeAnnotations)



};

