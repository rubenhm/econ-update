// Reads LABOR market slack data from CSV exported from FRED


var pt = pt || {};

pt.plotSlack = pt.plotSlack || {};
pt.plotSlack.svg = null;

// Initialize SVG
pt.plotSlack.init = function () {
    'use strict';
    // Define svg
    pt.plotSlack.svg = d3.select("#laborslack .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};


// Prepare chart
pt.plotSlack.chart = function(error,data) {
    'use strict';


    if (error) {
        return pt.displayError(error);
    }


    // parse data
    data.forEach( function (d) {
        d.month= parseDate(d.DATE);
        d.u3 = Number(d.UNRATE);
        d.u4 = Number(d.U4);
        d.u5 = Number(d.U5);
        d.u6 = Number(d.U6);
        d.u6s= 100*( (Number(d.UNEMPLOY) + 0.5*Number(d.EMPTER))/Number(d.CLF16O) );
        d.uwj= 100*( (Number(d.UNEMPLOY) + Number(d.NILFWJN))/(Number(d.CLF16O) + Number(d.NILFWJN)) );
        d.usrec = Number(d.USRECM);
    }
    );


    // Determine initial date
    pt.plotSlack.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotSlack.maxDate = d3.max(data,function(d){ return d.month; });



    // Find max and min yaxis values
    pt.plotSlack.maxValue = d3.max(data,function(d){ return Math.max(d.u3,d.u6s,d.uwj); });
    pt.plotSlack.minValue = d3.min(data,function(d){ return Math.min(d.u3,d.u6s,d.uwj); });

    console.log("Data range=["+pt.plotSlack.minDate+","+pt.plotSlack.maxDate+"]");
    console.log("Max value= "+pt.plotSlack.maxValue);
    console.log("Min value= "+pt.plotSlack.minValue);

    // Define scale and axes generators with custom x-axis ticks and format
    pt.plotSlack.y = d3.scaleLinear()
                 .domain([pt.plotSlack.minValue,pt.plotSlack.maxValue])
                 .range([pt.innerHeight,0]).nice();
    pt.plotSlack.x = d3.scaleTime()
                 .domain([pt.plotSlack.minDate,pt.plotSlack.maxDate])
                 .range([0,pt.innerWidth]);
    pt.plotSlack.yAxis = d3.axisLeft(pt.plotSlack.y);
    pt.plotSlack.xAxis = d3.axisBottom(pt.plotSlack.x)
                // .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth() === 0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });


    // Define line generators for each variable
    pt.plotSlack.line_u3 = d3.line()
                    .x(function(d){ return pt.plotSlack.x(d.month); })
                    .y(function(d){ return pt.plotSlack.y(d.u3); });
    pt.plotSlack.line_u6s = d3.line()
                    .x(function(d){ return pt.plotSlack.x(d.month); })
                    .y(function(d){ return pt.plotSlack.y(d.u6s); });
    pt.plotSlack.line_uwj = d3.line()
                    .x(function(d){ return pt.plotSlack.x(d.month); })
                    .y(function(d){ return pt.plotSlack.y(d.uwj); });

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
    pt.plotSlack.chartGroup = pt.plotSlack.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    //     // Add zero line
    // pt.plotSlack.chartGroup.append("line")
    //                 .attr("x1", 0)
    //                 .attr("y1", pt.plotSlack.y(0))
    //                 .attr("x2", pt.innerWidth)
    //                 .attr("y2", pt.plotSlack.y(0))
    //                 .attr("stroke", "black")
    //                 .attr("stroke-width", "1px");

    // Add recession bar
    // Recession bar as rectangle. Looks good.
    pt.plotSlack.chartGroup.append("rect")
                    .attr("class","recessm")
                    .attr("x", pt.innerWidth*firstRecMonth/lengthData )
                    .attr("y", 0)
                    .attr("width", pt.innerWidth*numRecMonths/lengthData)
                    .attr("height",pt.innerHeight);

//      Add time series
    pt.plotSlack.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotSlack.line_u3(data))
              .attr("stroke", colors[0]);
    pt.plotSlack.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotSlack.line_u6s(data))
              .attr("stroke", colors[1]);
    pt.plotSlack.chartGroup
              .append("path")
              .attr("class","line").attr("d",pt.plotSlack.line_uwj(data))
              .attr("stroke", colors[2]);

//      Add axes
    pt.plotSlack.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotSlack.xAxis);
    pt.plotSlack.chartGroup.append("g").attr("class","y axis").call(pt.plotSlack.yAxis);


// Legends
    pt.plotSlack.legends = pt.plotSlack.chartGroup.append("g").attr("class","legend");

    pt.plotSlack.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+pt.plotSlack.y(data[data.length-1]["u3"])+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[0])
            .text("Unemployed (U) ("+d3.format(".1f")(data[data.length-1]["u3"])+")" );

    pt.plotSlack.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+pt.plotSlack.y(data[data.length-1]["u6s"])+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[1])
            .text("U + Part Time ("+d3.format(".1f")(data[data.length-1]["u6s"])+")");

    pt.plotSlack.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+pt.plotSlack.y(data[data.length-1]["uwj"])+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[2])
            .text("U + Want Job ("+d3.format(".1f")(data[data.length-1]["uwj"])+")");

    pt.plotSlack.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["month"]));


    // Add labels to axes
    pt.plotSlack.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Percent");

};

