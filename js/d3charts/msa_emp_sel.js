// Reads LABOR market MSA data from CSV exported from FRED

var pt = pt || {};

pt.plotMsaEmpSel = pt.plotMsaEmpSel || {};
pt.plotMsaEmpSel.svg = null;

var msaNames = ["US", "Ohio","Cincinnati","Cleveland","Columbus","Lexington","Pittsburgh","Mansfield"];


// Sort Label positions
pt.plotMsaEmpSel.labelPositions = function(arrayLast,y) {
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
            items[i].pos = y(items[0].value) - i*22;
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
pt.plotMsaEmpSel.init = function () {
    'use strict';
    // Define svg
    pt.plotMsaEmpSel.svg = d3.select("#msa_emp_sel .placeholder")
        .append("svg")
        .attr("width", pt.outerWidth)
        .attr("height", pt.outerHeight);
};


// Prepare chart
pt.plotMsaEmpSel.chart = function(error,data) {
    'use strict';

    if (error) {
        return pt.displayError(error);
    }

    var numVars = msaNames.length-1;

    //parse data
    data = parseMsaData(data, "EG");
    // console.log(data);

    // Determine initial date
    pt.plotMsaEmpSel.minDate = d3.min(data,function(d){ return d.month; });
    // Define max date
    pt.plotMsaEmpSel.maxDate = d3.max(data,function(d){ return d.month; });

    // Find max and min yaxis values
    pt.plotMsaEmpSel.maxValue = d3.max(data,function(d){ return Math.max(
        d.CLEVEG,d.PITTEG,
        d.CINCEG,d.LEXIEG,
        d.COLUEG,
        d.OHEG,d.USEG, d.MANSEG
        ); });
    pt.plotMsaEmpSel.minValue = d3.min(data,function(d){ return Math.min(
        d.CLEVEG,d.PITTEG,
        d.CINCEG,d.LEXIEG,
        d.COLUEG,
        d.OHEG,d.USEG, d.MANSEG
        ); });

    console.log("Data range=["+pt.plotMsaEmpSel.minDate+","+pt.plotMsaEmpSel.maxDate+"]");
    console.log("Max value= "+pt.plotMsaEmpSel.maxValue);
    console.log("Min value= "+pt.plotMsaEmpSel.minValue);

    // Define scale and axes generators with custom x-axis ticks and format
    pt.plotMsaEmpSel.y = d3.scaleLinear()
                 .domain([pt.plotMsaEmpSel.minValue,pt.plotMsaEmpSel.maxValue])
                 .range([pt.innerHeight,0]).nice();
    pt.plotMsaEmpSel.x = d3.scaleTime()
                 .domain([pt.plotMsaEmpSel.minDate,pt.plotMsaEmpSel.maxDate])
                 .range([0,pt.innerWidth]);
    pt.plotMsaEmpSel.yAxis = d3.axisLeft(pt.plotMsaEmpSel.y);
    pt.plotMsaEmpSel.xAxis = d3.axisBottom(pt.plotMsaEmpSel.x)
                // .ticks(d3.timeMonth.every(1))
                .tickFormat(function (d) {
                    if (d.getMonth()==0) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });

    // Define Color scale
    pt.plotMsaEmpSel.color = d3.scaleOrdinal(colorsSel);
    pt.plotMsaEmpSel.color.domain(d3.keys(data[0]).filter(function (key) { // Set the domain of the color ordinal scale to be all the csv headers except "date", matching a color to an issue
        return (key == "US" || key == "Ohio" ||
                key == "Cincinnati" || key == "Cleveland" ||
                key == "Columbus" || key == "Lexington" ||  
                key == "Pittsburgh" );
      }));

    // Multiple lines, per http://bl.ocks.org/DStruths/9c042e3a6b66048b5bd4
    // Define line generators for each variable
    pt.plotMsaEmpSel.line = d3.line()
                    .x(function (d) { return pt.plotMsaEmpSel.x(d.date); })
                    .y(function (d) { return pt.plotMsaEmpSel.y(d.grate); });

    pt.plotMsaEmpSel.categories = pt.plotMsaEmpSel.color.domain().map( function (name) {
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
    console.log(pt.plotMsaEmpSel.categories);

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
    pt.plotMsaEmpSel.chartGroup = pt.plotMsaEmpSel.svg.append("g")
                              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    // Add zero line
    pt.plotMsaEmpSel.chartGroup.append("line")
                    .attr("class","vline")
                    .attr("x1", 0)
                    .attr("y1", pt.plotMsaEmpSel.y(0))
                    .attr("x2", pt.innerWidth)
                    .attr("y2", pt.plotMsaEmpSel.y(0));


    // Add recession bar
    // Recession bar as rectangle. Looks good.
    pt.plotMsaEmpSel.chartGroup.append("rect")
                    .attr("class","recessm")
                    .attr("x", pt.innerWidth*firstRecMonth/lengthData )
                    .attr("y", 0)
                    .attr("width", pt.innerWidth*numRecMonths/lengthData)
                    .attr("height",pt.innerHeight);

    //  Add axes
    pt.plotMsaEmpSel.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotMsaEmpSel.xAxis);
    pt.plotMsaEmpSel.chartGroup.append("g").attr("class","y axis").call(pt.plotMsaEmpSel.yAxis);

    //  Add time series
    pt.plotMsaEmpSel.series = pt.plotMsaEmpSel.chartGroup.selectAll(".places")
                           .data(pt.plotMsaEmpSel.categories)
                           .enter().append("g")
                           .attr("class","places");

    pt.plotMsaEmpSel.series.append("path")
                .attr("class","line")
                .attr("d", function (d) { return pt.plotMsaEmpSel.line(d.values);
                })
                .style("stroke", function (d) {return pt.plotMsaEmpSel.color(d.name);
                });


// Legends
    var lastValues = [];
    var num;
    for (var i=0;i<= pt.plotMsaEmpSel.categories.length-1;i++) {
        num = pt.plotMsaEmpSel.categories[i].values[data.length-1].grate;
        lastValues.push(num);
    }
    var items = pt.plotMsaEmpSel.labelPositions(lastValues,pt.plotMsaEmpSel.y);
    console.log(items);

    pt.plotMsaEmpSel.legends = pt.plotMsaEmpSel.chartGroup.append("g").attr("class","legend");

    for (var row=0; row<= numVars;row++) {
        pt.plotMsaEmpSel.legends
            .append("text")
            .attr("transform","translate("+(pt.innerWidth+4)+","+(items[row].pos)+")")
                .attr("dy",".35em")
                .attr("text-anchor","start")
                .style("fill",colorsSel[items[row].idx0])
                .text(msaNames[items[row].idx0]+" ("+d3.format(".1f")(data[data.length-1][msaNames[items[row].idx0]])+")");
        
    }

    pt.plotMsaEmpSel.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+d3.timeFormat("%b %Y")(data[data.length-1]["month"]));

    // Add labels to axes
    pt.plotMsaEmpSel.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","start")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Year-over-year percent change");

};

