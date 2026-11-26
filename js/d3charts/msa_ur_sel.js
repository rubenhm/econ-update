// Reads LABOR market MSA data from CSV exported from FRED

var pt = pt || {};

pt.plotMsaUrSel = pt.plotMsaUrSel || {};
pt.plotMsaUrSel.svg = null;


var msaNames = ["US", "Ohio","Cincinnati","Cleveland","Columbus","Lexington","Pittsburgh", "Mansfield"];

// Sort label positions
pt.plotMsaUrSel.labelPositions = function(arrayLast,y) {
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
            items[i].pos = y(items[0].value) - i*22 - 20;
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
pt.plotMsaUrSel.init = function () {
    'use strict';
    // Define svg
    pt.plotMsaUrSel.svg = d3.select("#msa_ur_sel .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};


// Prepare chart
pt.plotMsaUrSel.chart = function(error,data) {
    'use strict';

    if (error) {
        return pt.displayError(error);
    }

    var numVars = msaNames.length-1;

    //parse data
    data = parseMsaData(data, "UR");
    // console.log(data);

    // Determine initial date
    pt.plotMsaUrSel.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotMsaUrSel.maxDate = d3.max(data,function(d){ return d.month; });

    // Find max and min yaxis values
    pt.plotMsaUrSel.maxValue = d3.max(data,function(d){ return Math.max(
        d.CLEVUR,d.PITTUR,
        d.CINCUR,d.LEXIUR,
        d.COLUUR,
        d.OHUR,d.USUR 
        ); });
    pt.plotMsaUrSel.minValue = d3.min(data,function(d){ return Math.min(
        d.CLEVUR,d.PITTUR,
        d.CINCUR,d.LEXIUR,
        d.COLUUR,
        d.OHUR,d.USUR
        ); });

    console.log("Data range=["+pt.plotMsaUrSel.minDate+","+pt.plotMsaUrSel.maxDate+"]");
    console.log("Max value= "+pt.plotMsaUrSel.maxValue);
    console.log("Min value= "+pt.plotMsaUrSel.minValue);

    // Define scale and axes generators with custom x-axis ticks and format
    pt.plotMsaUrSel.y = d3.scaleLinear()
                 .domain([pt.plotMsaUrSel.minValue,pt.plotMsaUrSel.maxValue])
                 .range([pt.innerHeight,0]).nice();
    pt.plotMsaUrSel.x = d3.scaleTime()
                 .domain([pt.plotMsaUrSel.minDate,pt.plotMsaUrSel.maxDate])
                 .range([0,pt.innerWidth]);
    pt.plotMsaUrSel.yAxis = d3.axisLeft(pt.plotMsaUrSel.y);
    pt.plotMsaUrSel.xAxis = d3.axisBottom(pt.plotMsaUrSel.x)
                // .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth()==0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });

    // Define color scale
    pt.plotMsaUrSel.color = d3.scaleOrdinal(colorsSel);
    pt.plotMsaUrSel.color.domain(d3.keys(data[0]).filter(function (key) { 
    // Set the domain of the color ordinal scale to be all the csv headers except "date", matching a color to an issue
        return (key == "US" || key == "Ohio" ||
                key == "Cincinnati" || key == "Cleveland" ||
                key == "Pittsburgh" || key == "Lexington" ||
                key == "Columbus" );
      }));

    // Multiple lines, per http://bl.ocks.org/DStruths/9c042e3a6b66048b5bd4
    // Define line generators for each variable
    pt.plotMsaUrSel.line = d3.line()
                    .x(function (d) { return pt.plotMsaUrSel.x(d.date); })
                    .y(function (d) { return pt.plotMsaUrSel.y(d.urate); });

    pt.plotMsaUrSel.categories = pt.plotMsaUrSel.color.domain().map( function (name) {
        'use strict'
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
    console.log(pt.plotMsaUrSel.categories);

    // Define recession bars as a rect shape in the svg
    // Define function to find index of start and end of recession dates
    var recData = data.filter( function (d,i) {
        d.recidx = i;
        return d.usrec == 1;
    });
    var firstRecMonth = recData[0].recidx;
    var numRecMonths = recData[recData.length-1].recidx - firstRecMonth + 1;
    var lengthData = data.length;

    // Define chart group
    pt.plotMsaUrSel.chartGroup = pt.plotMsaUrSel.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    // Add zero line
    // pt.plotMsaUrSel.chartGroup.append("line")
    //                 .attr("x1", 0)
    //                 .attr("y1", pt.plotMsaUrSel.y(0))
    //                 .attr("x2", pt.innerWidth)
    //                 .attr("y2", pt.plotMsaUrSel.y(0))
    //                 .attr("stroke", "black")
    //                 .attr("stroke-width", "1px");

    // Add recession bar
    // Recession bar as rectangle. Looks good.
    pt.plotMsaUrSel.chartGroup.append("rect")
                    .attr("class","recessm")
                    .attr("x", pt.innerWidth*firstRecMonth/lengthData )
                    .attr("y", 0)
                    .attr("width", pt.innerWidth*numRecMonths/lengthData)
                    .attr("height",pt.innerHeight);

    //  Add axes
    pt.plotMsaUrSel.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotMsaUrSel.xAxis);
    pt.plotMsaUrSel.chartGroup.append("g").attr("class","y axis").call(pt.plotMsaUrSel.yAxis);

    //  Add time series
    pt.plotMsaUrSel.series = pt.plotMsaUrSel.chartGroup.selectAll(".places")
                           .data(pt.plotMsaUrSel.categories)
                           .enter().append("g")
                           .attr("class","places");

    pt.plotMsaUrSel.series.append("path")
                .attr("class","line")
                .attr("d", function (d) { return pt.plotMsaUrSel.line(d.values);
                })
                .style("stroke", function (d) {return pt.plotMsaUrSel.color(d.name);
                });

// Legends
    var lastValues = [];
    var num;
    for (var i=0;i<= pt.plotMsaUrSel.categories.length-1;i++) {
        num = pt.plotMsaUrSel.categories[i].values[data.length-1].urate;
        lastValues.push(num);
    }
    var items = pt.plotMsaUrSel.labelPositions(lastValues,pt.plotMsaUrSel.y);
    console.log(items);

    pt.plotMsaUrSel.legends = pt.plotMsaUrSel.chartGroup.append("g").attr("class","legend");

    for (var row=0; row<= numVars;row++) {
        pt.plotMsaUrSel.legends
            .append("text")
            .attr("transform","translate("+(pt.innerWidth+4)+","+(items[row].pos)+")")
                .attr("dy",".35em")
                .attr("text-anchor","start")
                .style("fill",colorsSel[items[row].idx0])
                .text(msaNames[items[row].idx0]+" ("+d3.format(".1f")(data[data.length-1][msaNames[items[row].idx0]])+")");
        
    }

    pt.plotMsaUrSel.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["month"]));

    // Add labels to axes
    pt.plotMsaUrSel.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","start")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Percent");


};

