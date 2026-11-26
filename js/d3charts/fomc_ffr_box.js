// Reads data from a CSV file with the annual SEPs projections
// Data are from scrapped from the Board's website

var pt = pt || {};

pt.plotFomcFfr = pt.plotFomcFfr || {};
pt.plotFomcFfr.svg = null;

pt.plotFomcFfr.init = function () {
    'use strict';
    // Define SVG
    pt.plotFomcFfr.svg = d3.select("#fomc_ffr_box .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
    console.log("Done FomcFfr init");
};


pt.plotFomcFfr.chart = function (error, latestdate, data) {
    'user strict';

    if (error) {
        pt.displayError(error);
        throw error;
    }


    var sepDate = d3.timeFormat("%b %d, %Y")(d3.timeParse("%Y%m%d")(latestdate["0"]["date"]));

    data = parseFomcDataBox(data);
    console.log(data);

    // Fix long run date
    var lastYear = +data[data.length-2]["index"]+1;
    data[data.length-1].date = parseDate(lastYear+"-06-30");
    console.log(lastYear);
    console.log(data[data.length-1].date);
    // Chart
    // Determine min/max dates
    var minDate = d3.min(data,function (d){ return d["date"]; } );
    var maxDate = d3.max(data,function (d){ return d["date"]; } );
    console.log("Date range=["+minDate+","+maxDate+"]");

    // Generate different datasets
    var actual = [];
    data.forEach( function (d,i) {
        if (d.Actual !== "") {
            // console.log(d.date)
            obj = {'index': d.index ,'date': d.date, 'actual': d.actual };
            // console.log(obj)
            actual.push(obj);
        }
    });
    console.log(actual);

    var sep = [];
    data.forEach( function (d,i) {
        var obj;
        if (!isNaN(d.Med))  {
            obj = {'index': d.index, 'date': d.date, "Med": d.Med, "RgLo": d.RgLo, "CtLo": d.CtLo, "CtHi": d.CtHi, "RgHi": d.RgHi};
            sep.push(obj);
        }
    });
    console.log(sep);


    // Fix Long Run "date"
    // data[data.length-1]["date"] = data[data.length-2]["date"] + 1;
    var minActual = d3.min(actual, function (d) {return d.actual; });
    var maxActual = d3.max(actual, function (d) {return d.actual; });
    var maxSep = d3.max(sep, function (d) { return d.RgHi; });
    var minSep = d3.min(sep, function (d) { return d.RgLo; });
    var minValues = Math.min(minActual,minSep);
    var maxValues = Math.max(maxActual,maxSep);
    console.log("Values Range=["+minValues+","+maxValues+"]");
    console.log("Dates Range=["+minDate+","+maxDate+"]");

    // Define scale generators
    pt.plotFomcFfr.x = d3.scaleBand()
              .rangeRound([0,pt.innerWidth])
              .padding(1)
              .align(0.5);
    pt.plotFomcFfr.y = d3.scaleLinear()
              .rangeRound([pt.innerHeight,0])
              .domain([minValues,maxValues])
              .nice(4);

    // Define Axes
    pt.plotFomcFfr.xAxis = d3.axisBottom(pt.plotFomcFfr.x);
    pt.plotFomcFfr.yAxis = d3.axisRight(pt.plotFomcFfr.y).ticks(8);

      // Gridlines: https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
      // gridlines in y axis function
    function make_y_gridlines() {
          return d3.axisLeft(pt.plotFomcFfr.y)
            .ticks(10);
    }
    function make_x_gridlines() {
        return d3.axisBottom(pt.plotFomcFfr.x)
            .ticks(10);
    }


    // Define line generator for Actual
    pt.plotFomcFfr.lineActual = d3.line()
            .x(function (d){
                return pt.plotFomcFfr.x(d.index);})
            .y(function (d){
                return pt.plotFomcFfr.y(d.actual);});

    // Define chart group
    pt.plotFomcFfr.chartGroup = pt.plotFomcFfr.svg
                      .append("g")
                      .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    // complete scale generators
    pt.plotFomcFfr.x.domain(data.map(function (d) {return d.index;}));

    // Add Axes
    pt.plotFomcFfr.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+pt.innerHeight+")").call(pt.plotFomcFfr.xAxis).call(adjustTextLabels);

    // Gridlines
    pt.plotFomcFfr.chartGroup.append("g")
               .attr("class","grid")
               .call(make_y_gridlines()
                  .tickSize(-pt.innerWidth)
                  .tickFormat("")
                );
    pt.plotFomcFfr.chartGroup.append("g")
                .attr("class","grid")
                .attr("transform", "translate(0," + pt.innerHeight + ")")
                .call(make_x_gridlines()
                  .tickSize(-pt.innerHeight)
                  .tickFormat("")
                );

    // Adjust Text labels on Axes
    function adjustTextLabels(selection) {
        selection.selectAll('.tick text')
            .attr('transform', 'translate(' + 0 +','+ 10 +')');
    }

    // Plot Y axes
    pt.plotFomcFfr.chartGroup.append("g").attr("class","y axis").attr("transform","translate("+pt.innerWidth+",0)").call(pt.plotFomcFfr.yAxis);

    // Plot Actual Data
    pt.plotFomcFfr.chartGroup.append("path").attr("class","line actual").attr("d", pt.plotFomcFfr.lineActual(actual));

    pt.plotFomcFfr.actualDots = pt.plotFomcFfr.chartGroup.selectAll(".actualDots")
                                  .data(actual)
                                  .enter()
                                  .append("g")
                                  .attr("class","actualDots");

    pt.plotFomcFfr.actualDots.append("circle")
                        .attr("class", "dots")
                        .attr("cx", function (d) { return pt.plotFomcFfr.x(d.index); })
                        .attr("cy", function (d) { return pt.plotFomcFfr.y(d.actual); })
                        .attr("r", 6);

    // Plot SEP data
    pt.plotFomcFfr.boxes = pt.plotFomcFfr.chartGroup.selectAll(".box")
                             .data(sep)
                             .enter()
                             .append("g")
                             .attr("class","box")
                             .attr("transform", function (d) {
                                return "translate("+ pt.plotFomcFfr.x(d.index)+", 0)";
                             });

    // Range whiskers
    pt.plotFomcFfr.boxes.append("line")
                        .attr("class", "RgLo")
                        .attr("x1",  -25 )
                        .attr("x2",  +25 )
                        .attr("y1",  function (d) { return pt.plotFomcFfr.y(d.RgLo); })
                        .attr("y2",  function (d) { return pt.plotFomcFfr.y(d.RgLo); });


    pt.plotFomcFfr.boxes.append("line")
                        .attr("class", "RgHi")
                        .attr("x1", -25 )
                        .attr("x2", +25 )
                        .attr("y1",  function (d) { return pt.plotFomcFfr.y(d.RgHi); })
                        .attr("y2",  function (d) { return pt.plotFomcFfr.y(d.RgHi); });

    // Vertical Line
    pt.plotFomcFfr.boxes.append("line")
                        .attr("class","VtLi")
                        .attr("x1", 0 )
                        .attr("x2", 0 )
                        .attr("y1", function (d) { return pt.plotFomcFfr.y(d.RgHi); } )
                        .attr("y2", function (d) { return pt.plotFomcFfr.y(d.RgLo); } );

    // Central tendencia rectangle
    pt.plotFomcFfr.boxes.append("rect")
                        .attr("class", "CtRect")
                        .attr("x", -25)
                        .attr("y", function (d) { return pt.plotFomcFfr.y(d.CtHi); })
                        .attr("width", +50 )
                        .attr("height", function (d) { return Math.abs(pt.plotFomcFfr.y(d.CtLo) - pt.plotFomcFfr.y(d.CtHi)); } );



    // Median Line
    pt.plotFomcFfr.boxes.append("line")
                        .attr("class", "median")
                        .attr("x1", -25 )
                        .attr("x2", +25 )
                        .attr("y1", function (d) { return pt.plotFomcFfr.y(d.Med); } )
                        .attr("y2", function (d) { return pt.plotFomcFfr.y(d.Med); } );

    // Add labels to axes
    pt.plotFomcFfr.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","end")
            .attr("x", pt.innerWidth)
            .attr("y", -topYAxisPadding)
            .text("Percent, end of year");

   pt.plotFomcFfr.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", -3.2*topYAxisPadding)
            .attr("text-anchor","end")
            .text("Release date: "+ sepDate);


    // Add legends
    pt.plotFomcFfr.legends = pt.plotFomcFfr.chartGroup.selectAll(".legends")
                .data([1])
                .enter()
                .append("g")
                .attr("class","legends")
                .attr("transform", function (d) {
                    return "translate("+ (-45)+","+ (pt.innerHeight *0.7)+")";
                 });

    pt.plotFomcFfr.legends.append("line")
                .attr("class","actual")
                .attr("x1", 0)
                .attr("x2", 25)
                .attr("y1", 10)
                .attr("y2", 10);

    pt.plotFomcFfr.legends.append("circle")
                .attr("class","dots")
                .attr("cx", 0)
                .attr("cy", 10)
                .attr("r", 5);

    pt.plotFomcFfr.legends.append("text")
                .attr("class","y label")
                .attr("x", 32)
                .attr("y", 0)
               .attr("dy", "+0.8em")
               .style("text-anchor", "start")
                .text("Actual data");

    pt.plotFomcFfr.legends.append("rect")
                .attr("class", "CtRect")
                .attr("x", 0)
                .attr("y", 25)
                .attr("width", 25)
                .attr("height", 25);

    pt.plotFomcFfr.legends.append("text")
                .attr("class"," y label")
                .attr("x", 32)
                .attr("y", 30)
               .attr("dy", "+0.8em")
               .style("text-anchor", "start")
                .text("Central tendency");

    pt.plotFomcFfr.legends.append("polyline")
                .attr("class", "VtLi")
                .attr("points", "0,60 25,60 12.5,60 12.5,85 0,85 25,85")
                .style("fill","none");

    pt.plotFomcFfr.legends.append("text")
                .attr("class","y label")
                .attr("x", 32)
                .attr("y", 65)
               .attr("dy", "+0.8em")
               .style("text-anchor", "start")
                .text("Range");

    pt.plotFomcFfr.legends.append("polyline")
                .attr("class", "median")
                .attr("points", "0,105 25,105")
                .style("fill","none");

    pt.plotFomcFfr.legends.append("text")
                .attr("class","y label")
                .attr("x", 32)
                .attr("y", 95)
               .attr("dy", "+0.8em")
               .style("text-anchor", "start")
                .text("Median");




};