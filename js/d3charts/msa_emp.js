// Reads LABOR market MSA data from CSV exported from FRED

var pt = pt || {};

pt.plotMsaEmp = pt.plotMsaEmp || {};
pt.plotMsaEmp.svg = null;

// Sort Label positions
pt.plotMsaEmp.labelPositions = function(arrayLast,y) {
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
        for (i=0;i<=arrayLast.length-1;i++) {
            items[i].pos = y(items[0].value)  - i*22;
        }
    } else {
        var extra = 20*(arrayLast.length-1) - d1;
        console.log(extra);
        for (i=0;i<=arrayLast.length-1;i++) {
            items[i].pos = y(items[0].value) + extra/2 - i*20;
        }
    }
    return items;
};

// Initialize SVG
pt.plotMsaEmp.init = function () {
    'use strict';
    // Define svg
    pt.plotMsaEmp.svg = d3.select("#msa_emp .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};


// Prepare chart
pt.plotMsaEmp.chart = function(error,data) {
    'use strict';

    if (error) {
        return pt.displayError(error);
    }

// Don't count the extra MSA, set to .length -2
    var numVars = msaNames.length-2;
    console.log(msaNames)

    //parse data
    data = parseMsaData(data, "EG");
    // console.log(data);

    // Determine initial date
    pt.plotMsaEmp.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotMsaEmp.maxDate = d3.max(data,function(d){ return d.month; });

    // Find max and min yaxis values
    pt.plotMsaEmp.maxValue = d3.max(data,function(d){ return Math.max(
        d.CLEVEG,d.PITTEG,
        d.CINCEG,d.LEXIEG,
        d.COLUEG,
        d.OHEG,d.USEG // d.MANSEG
        ); });
    pt.plotMsaEmp.minValue = d3.min(data,function(d){ return Math.min(
        d.CLEVEG,d.PITTEG,
        d.CINCEG,d.LEXIEG,
        d.COLUEG,
        d.OHEG,d.USEG // d.MANSEG
        ); });

    console.log("Data range=["+pt.plotMsaEmp.minDate+","+pt.plotMsaEmp.maxDate+"]");
    console.log("Max value= "+pt.plotMsaEmp.maxValue);
    console.log("Min value= "+pt.plotMsaEmp.minValue);

    // Define scale and axes generators with custom x-axis ticks and format
    pt.plotMsaEmp.y = d3.scaleLinear()
                 .domain([pt.plotMsaEmp.minValue,pt.plotMsaEmp.maxValue])
                 .range([pt.innerHeight,0]).nice();
    pt.plotMsaEmp.x = d3.scaleTime()
                 .domain([pt.plotMsaEmp.minDate,pt.plotMsaEmp.maxDate])
                 .range([0,pt.innerWidth]);
    pt.plotMsaEmp.yAxis = d3.axisLeft(pt.plotMsaEmp.y);
    pt.plotMsaEmp.xAxis = d3.axisBottom(pt.plotMsaEmp.x)
                // .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth()==0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });

    // Define Color scale
    pt.plotMsaEmp.color = d3.scaleOrdinal(colors);
    pt.plotMsaEmp.color.domain(d3.keys(data[0]).filter(function (key) { // Set the domain of the color ordinal scale to be all the csv headers except "date", matching a color to an issue
        return (key == "US" || key == "Ohio" ||
                key == "Cincinnati" || key == "Cleveland" ||
                key == "Pittsburgh" || key == "Lexington" ||
                key == "Columbus" // || key == "Mansfield" 
                );
      }));

    // Multiple lines, per http://bl.ocks.org/DStruths/9c042e3a6b66048b5bd4
    // Define line generators for each variable
    pt.plotMsaEmp.line = d3.line()
                    .x(function (d) { return pt.plotMsaEmp.x(d.date); })
                    .y(function (d) { return pt.plotMsaEmp.y(d.grate); });

    pt.plotMsaEmp.categories = pt.plotMsaEmp.color.domain().map( function (name) {
        'use strict';
        return {
            name: name, // Variables names except date
            values: data.map(function(d) { // Values
                return {
                    date: d.month,
                    grate: +(d[name])
                };
            })
        };
    });
    console.log(pt.plotMsaEmp.categories);

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
    pt.plotMsaEmp.chartGroup = pt.plotMsaEmp.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    // Add zero line
    pt.plotMsaEmp.chartGroup.append("line")
                    .attr("class","vline")
                    .attr("x1", 0)
                    .attr("y1", pt.plotMsaEmp.y(0))
                    .attr("x2", pt.innerWidth)
                    .attr("y2", pt.plotMsaEmp.y(0));


    // Add recession bar
    // Recession bar as rectangle. Looks good.
    pt.plotMsaEmp.chartGroup.append("rect")
                    .attr("class","recessm")
                    .attr("x", pt.innerWidth*firstRecMonth/lengthData )
                    .attr("y", 0)
                    .attr("width", pt.innerWidth*numRecMonths/lengthData)
                    .attr("height",pt.innerHeight);

    //  Add axes
    pt.plotMsaEmp.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotMsaEmp.xAxis);
    pt.plotMsaEmp.chartGroup.append("g").attr("class","y axis").call(pt.plotMsaEmp.yAxis);

    //  Add time series
    pt.plotMsaEmp.series = pt.plotMsaEmp.chartGroup.selectAll(".places")
                           .data(pt.plotMsaEmp.categories)
                           .enter().append("g")
                           .attr("class","places");

    pt.plotMsaEmp.series.append("path")
                .attr("class","line")
                .attr("d", function (d) { return pt.plotMsaEmp.line(d.values);
                })
                .style("stroke", function (d) {return pt.plotMsaEmp.color(d.name);
                });


// Legends
    var lastValues = [];
    var num;
    for (var i=0;i<= pt.plotMsaEmp.categories.length-1;i++) {
        num = pt.plotMsaEmp.categories[i].values[data.length-1].grate;
        lastValues.push(num);
    }
    var items = pt.plotMsaEmp.labelPositions(lastValues,pt.plotMsaEmp.y);
    console.log(items);

    pt.plotMsaEmp.legends = pt.plotMsaEmp.chartGroup.append("g").attr("class","legend");

    for (var row=0; row<= numVars;row++) {
        pt.plotMsaEmp.legends
            .append("text")
            .attr("transform","translate("+(pt.innerWidth+4)+","+(items[row].pos)+")")
                .attr("dy",".35em")
                .attr("text-anchor","start")
                .style("fill",colors[items[row].idx0])
                .text(msaNames[items[row].idx0]+" ("+d3.format(".1f")(data[data.length-1][msaNames[items[row].idx0]])+")");

        
    }

    pt.plotMsaEmp.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+ d3.timeFormat("%b %Y")(data[data.length-1]["month"]));

    // Add labels to axes
    pt.plotMsaEmp.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","start")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Year-over-year percent change");

};

