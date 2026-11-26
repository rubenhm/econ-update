// Reads LABOR market MSA data from CSV exported from FRED

var pt = pt || {};

pt.plotMsaUr = pt.plotMsaUr || {};
pt.plotMsaUr.svg = null;

// Sort label positions
pt.plotMsaUr.labelPositions = function(arrayLast,y) {
    // 'use strict';
    var items =[];
    var obj;
    for (var i=0;i<=arrayLast.length-1;i++) {
         obj = { idx0: +i, value: arrayLast[i], pos: ''};
         // console.log(obj)
         items.push(obj);
    }
    function compare(a,b) {
      if (a.value > b.value) {
        return 1;
      }
      if (a.value < b.value) {
        return -1;
      }
      // a must be equal to b
      return 0;
    }
    // sort by value
    items.sort(compare);
    // Calculate diff
    var d1 = y(items[0].value) - y(items[arrayLast.length-1].value) ;
    console.log(d1);
    if (d1 >= 20*(arrayLast.length-1) ) {
        for (var i=0;i<=arrayLast.length-1;i++) {
            items[i].pos = y(items[0].value)  - i*22 - 20;
        }
    } else {
        var extra = 20*(arrayLast.length-1) - d1;
        console.log(extra);
        for (var i=0;i<=arrayLast.length-1;i++) {
            items[i].pos = y(items[0].value) + extra/2 - i*20;
        }
    }
    return items;
};

// Initialize SVG
pt.plotMsaUr.init = function () {
    'use strict';
    // Define svg
    pt.plotMsaUr.svg = d3.select("#msa_ur .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};


// Prepare chart
pt.plotMsaUr.chart = function(error,data) {
    'use strict';

    if (error) {
        return pt.displayError(error);
    }

// Don't count the extra MSA: msaNames.length -2;
    var numVars = msaNames.length -2; 
    console.log(msaNames)

    //parse data
    data = parseMsaData(data, "UR");
    // console.log(data);

    // Determine initial date
    pt.plotMsaUr.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotMsaUr.maxDate = d3.max(data,function(d){ return d.month; });

    // Find max and min yaxis values
    // Supress extra msas if not needed
    pt.plotMsaUr.maxValue = d3.max(data,function(d){ return Math.max(
        d.CLEVUR,d.PITTUR,
        d.CINCUR,d.LEXIUR,
        d.COLUUR,
        d.OHUR,d.USUR //d.MANSUR
        ); });
    pt.plotMsaUr.minValue = d3.min(data,function(d){ return Math.min(
        d.CLEVUR,d.PITTUR,
        d.CINCUR,d.LEXIUR,
        d.COLUUR,
        d.OHUR,d.USUR //d.MANSUR
        ); });

    console.log("Data range=["+pt.plotMsaUr.minDate+","+pt.plotMsaUr.maxDate+"]");
    console.log("Max value= "+pt.plotMsaUr.maxValue);
    console.log("Min value= "+pt.plotMsaUr.minValue);

    // Define scale and axes generators with custom x-axis ticks and format
    pt.plotMsaUr.y = d3.scaleLinear()
                 .domain([pt.plotMsaUr.minValue,pt.plotMsaUr.maxValue])
                 .range([pt.innerHeight,0]).nice();
    pt.plotMsaUr.x = d3.scaleTime()
                 .domain([pt.plotMsaUr.minDate,pt.plotMsaUr.maxDate])
                 .range([0,pt.innerWidth]);
    pt.plotMsaUr.yAxis = d3.axisLeft(pt.plotMsaUr.y);
    pt.plotMsaUr.xAxis = d3.axisBottom(pt.plotMsaUr.x)
                // .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth()==0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });

    // Define color scale
    pt.plotMsaUr.color = d3.scaleOrdinal(colors);
    pt.plotMsaUr.color.domain(d3.keys(data[0]).filter(function (key) {
    // Set the domain of the color ordinal scale to be all the csv headers except "date", matching a color to an issue
        return (key == "US" || key == "Ohio" ||
                key == "Cincinnati" || key == "Cleveland" ||
                key == "Pittsburgh" || key == "Lexington" ||
                key == "Columbus" // || key == "Mansfield"  
                );
      }));

    // Multiple lines, per http://bl.ocks.org/DStruths/9c042e3a6b66048b5bd4
    // Define line generators for each variable
    pt.plotMsaUr.line = d3.line()
                    .x(function (d) { return pt.plotMsaUr.x(d.date); })
                    .y(function (d) { return pt.plotMsaUr.y(d.urate); });

    pt.plotMsaUr.categories = pt.plotMsaUr.color.domain().map( function (name) {
        return {
            name: name, // Variables names except date
            values: data.map(function(d) { // Values
                return {
                    date: d.month,
                    urate: +(d[name])
                };
            })
        };
    });
    console.log(pt.plotMsaUr.categories);

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
    pt.plotMsaUr.chartGroup = pt.plotMsaUr.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    // Add zero line
    // pt.plotMsaUr.chartGroup.append("line")
    //                 .attr("x1", 0)
    //                 .attr("y1", pt.plotMsaUr.y(0))
    //                 .attr("x2", pt.innerWidth)
    //                 .attr("y2", pt.plotMsaUr.y(0))
    //                 .attr("stroke", "black")
    //                 .attr("stroke-width", "1px");

    // Add recession bar
    // Recession bar as rectangle. Looks good.
    pt.plotMsaUr.chartGroup.append("rect")
                    .attr("class","recessm")
                    .attr("x", pt.innerWidth*firstRecMonth/lengthData )
                    .attr("y", 0)
                    .attr("width", pt.innerWidth*numRecMonths/lengthData)
                    .attr("height",pt.innerHeight);

    //  Add axes
    pt.plotMsaUr.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotMsaUr.xAxis);
    pt.plotMsaUr.chartGroup.append("g").attr("class","y axis").call(pt.plotMsaUr.yAxis);

    //  Add time series
    pt.plotMsaUr.series = pt.plotMsaUr.chartGroup.selectAll(".places")
                           .data(pt.plotMsaUr.categories)
                           .enter().append("g")
                           .attr("class","places");

    pt.plotMsaUr.series.append("path")
                .attr("class","line")
                .attr("d", function (d) { return pt.plotMsaUr.line(d.values);
                })
                .style("stroke", function (d) {return pt.plotMsaUr.color(d.name);
                });

// Legends
    var lastValues = [];
    var num;
    for (var i=0;i<= pt.plotMsaUr.categories.length-1;i++) {
        num = pt.plotMsaUr.categories[i].values[data.length-1].urate;
        lastValues.push(num);
    }
    var items = pt.plotMsaUr.labelPositions(lastValues,pt.plotMsaUr.y);
    console.log(items);

    pt.plotMsaUr.legends = pt.plotMsaUr.chartGroup.append("g").attr("class","legend");
    for (var row=0; row<= numVars;row++) {
        pt.plotMsaUr.legends
            .append("text")
            .attr("transform","translate("+(pt.innerWidth+4)+","+(items[row].pos)+")")
                .attr("dy",".35em")
                .attr("text-anchor","start")
                .style("fill",colors[items[row].idx0])
                .text(msaNames[items[row].idx0]+" ("+d3.format(".1f")(data[data.length-1][msaNames[items[row].idx0]])+")");

        
    }

    pt.plotMsaUr.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["month"]));

    // Add labels to axes
    pt.plotMsaUr.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","start")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Percent");


};

