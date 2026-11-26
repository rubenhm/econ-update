// Reads data from CSV and creates plot in d3.js

var pt = pt || {};

pt.plotGdpLRun = pt.plotGdpLRun || {};
pt.plotGdpLRun.svg = null;

pt.plotGdpLRun.init = function () {
  'use strict';

  //Define svg
  pt.plotGdpLRun.svg = d3.select("#gdp_lr .placeholder")
      .append("svg")
      .attr("width", pt.outerWidth)
      .attr("height", pt.outerHeight);
};

pt.plotGdpLRun.chart = function(error,data) {
  'use strict';

  if (error) {
    return pt.displayError(error);
  }

  // Parse data and make numeric
  data.forEach( function (d) {
    d.date = parseDate(d.DATE);
    d.gdp = +d.GDP;
    d.prod = +d.PRDGRNFB;
    d.prodma = +d.MVPRGRDNFB;
    d.meangr = +d.AVGEXP;
    d.recess = +d.USRECQM;
    d.avgidx = +d.AVGEXPIDX;
  });

  // Examine data
  // console.log(data);

  // Determine initial dates
  pt.plotGdpLRun.minDate = d3.min(data,function(d){ return d.date; });
  pt.plotGdpLRun.minDate = parseDate("1988-01-01");
  pt.plotGdpLRun.maxDate = d3.max(data,function(d){ return d.date; });

  // Filter the data 
  data = data.filter(function (d,i) {
    return d.date >= pt.plotGdpLRun.minDate;
  });

  // console.log([pt.plotGdpLRun.minDate,pt.plotGdpLRun.maxDate])

    // Find min,max gdp growth rate 
    pt.plotGdpLRun.minValue = d3.min(data,function(d){ return d.gdp; });
    pt.plotGdpLRun.maxValue = d3.max(data,function(d){ return d.gdp; });

    // console.log([pt.plotGdpLRun.minValue ,pt.plotGdpLRun.maxValue ])

    // Scales
    pt.plotGdpLRun.x = d3.scaleBand()
          .rangeRound([0,pt.innerWidth])
          // .domain(data.map(function (d) {return d.date;}));
          .domain(data.map(function (d) {return d.date;}));


    pt.plotGdpLRun.y = d3.scaleLinear()
          .range([pt.innerHeight, 0])
          .domain([pt.plotGdpLRun.minValue,pt.plotGdpLRun.maxValue])
          .nice();

    // Define Axes
    pt.plotGdpLRun.xAxis = d3.axisBottom(pt.plotGdpLRun.x)
          .tickValues(pt.plotGdpLRun.x.domain().filter( function (d,i) {
            return !(i%4);
          }))
                .tickFormat(function (d) {
                    if (d.getMonth()==0 && (d.getFullYear()%2==0)) {
                        return d3.timeFormat("%Y")(d);
                    } else {
                        return "";
                    }
                });
    pt.plotGdpLRun.yAxis = d3.axisLeft(pt.plotGdpLRun.y);

    // Define color scales for the expansion averages
    pt.plotGdpLRun.color = d3.scaleOrdinal(colors.slice(1));
    // Expansion periods in sample, unique values of data.AVGEXPIDX
    var avgIdx = data.map(function (d) {
          if (d.AVGEXPIDX == "") {
            return NaN;
          } else {
            return d.avgidx;
          }
          });
    // console.log(avgIdx)
    // var uniqueExp = avgIdx.filter((v, i, a) => a.indexOf(v) === i);
    // translation
    var uniqueExp = avgIdx.filter(function (v, i, a) {
        return a.indexOf(v) === i;
    });

    // console.log(uniqueExp)
    pt.plotGdpLRun.color.domain(uniqueExp);
    // console.log(pt.plotGdpLRun.color.domain())
    // per http://stackoverflow.com/questions/1960473/unique-values-in-an-array
    // var unique = myArray.filter((v, i, a) => a.indexOf(v) === i); 

    // Multiple lines
    pt.plotGdpLRun.line = d3.line()
      .x(function (d) { return pt.plotGdpLRun.x(d.date); })
      .y(function (d) { return pt.plotGdpLRun.y(d.growth)});

    pt.plotGdpLRun.categories = pt.plotGdpLRun.color.domain()
          .map( function (expPeriod) {
              return {
                expPeriod : expPeriod,
                values: data.map( function (d) {
                  if (d.avgidx == expPeriod) {
                    return {
                      date: d.date,
                      growth: d.meangr,
                      recess: d.recess
                    };
                  } else {
                    return {
                      date: d.date,
                      growth: "NA",
                      recess: d.recess
                    };
                  }
                })
              };
          });
    // Drop elements with NaNs
    // pt.plotGdpLRun.categories.forEach( function (d) {
    //   d.values = d.values.filter( p => ["NA"].indexOf(p.growth) === -1)
    //   // console.log(d.values.length)
    // });
    // Translate
    pt.plotGdpLRun.categories.forEach(function (d) {
        d.values = d.values.filter(function (p) {
            return ["NA"].indexOf(p.growth) === -1;
        });
        // console.log(d.values.length)
    });
    // console.log(pt.plotGdpLRun.categories)
    // Define recession bars as a rect shape in the svg
    // Define function to find index of start and end of recession dates
    // Use array.reduce https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce

    var recessions = [];
    var index;
    var lengthRec = 0;
    var lengthExp = 0;
    var lenData = data.length;
    for (var i=0; i< lenData ; i++) {
      var obj = {};
      if (data[i].recess > 0 && lengthRec==0) {
        index = i;
        lengthRec = 1;
        lengthExp = 0;
      }
      if (data[i].recess > 0 && lengthRec>0) {
        lengthRec++;
      }
      if (data[i].recess==0 && lengthExp==0) {
        lengthExp++;
      }
      if (data[i].recess==0 && lengthExp==1 && index>=0) {
        obj = {'index' : index, 'length': lengthRec-1, 'iniDate': data[index].date, 'finDate': data[index+lengthRec].date};
        recessions.push(obj);
        lengthExp = 0;
        lengthRec = 0;
        index = -1;
      }
     }

    // console.log(recessions);

    // Append chart group to svg
    pt.plotGdpLRun.chartGroup = pt.plotGdpLRun.svg.append("g")
              .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    // Add axes
    pt.plotGdpLRun.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+pt.innerHeight+")").call(pt.plotGdpLRun.xAxis);
    pt.plotGdpLRun.chartGroup.append("g").attr("class","y axis").call(pt.plotGdpLRun.yAxis);

    // Append recession bars
    pt.plotGdpLRun.chartGroup.append("g").selectAll("recessm")
        .data(recessions)
        .enter().append("rect")
        .attr("class","recessm")
        .attr("x", function (d) {
          return pt.plotGdpLRun.x(d.iniDate);})
        .attr("y", 0)
        .attr("height", pt.innerHeight)
        .attr("width", function (d) {
          return pt.innerWidth*d.length/lenData;
        });

    // Define bar chart and add to chart
    // TODO: fix the negative height for recession years
    pt.plotGdpLRun.chartGroup.append("g").selectAll("bar gdp")
              .data(data)
              .enter().append("rect")
              .attr("class","bar gdp")
              .attr("x", function (d) { return pt.plotGdpLRun.x(d.date); })
              .attr("y", function (d) { 
                if  (d.gdp>0) {
                  return pt.plotGdpLRun.y(d.gdp);
                } else {
                  return pt.plotGdpLRun.y(0);
                }
              })
              .attr("width", pt.plotGdpLRun.x.bandwidth())
              .attr("height", function (d) { return Math.abs(pt.plotGdpLRun.y(0) - pt.plotGdpLRun.y(d.gdp)); 
              })
              .style("fill", colors[0]);

    // Add expansion averages
    pt.plotGdpLRun.series = pt.plotGdpLRun.chartGroup.selectAll(".averages")
        .data(pt.plotGdpLRun.categories)
        .enter().append("g")
        .attr("class","averages");

    pt.plotGdpLRun.series.append("path")
      .attr("class","line")
      .attr("d", function (d) {
        return pt.plotGdpLRun.line(d.values);
      })
      .style("stroke", function (d) {
        return pt.plotGdpLRun.color(d.expPeriod);
      });

    // Append value labels
    pt.plotGdpLRun.chartGroup.selectAll(".avglabel")
      .data(pt.plotGdpLRun.categories)
      .enter().append("g")
      .attr("class","avglabel")
      .append("text")
      .attr("class", "value gdp")
      .attr("x", function (d) { return pt.plotGdpLRun.x(d.values["0"].date)} )
      .attr("y", function (d) { return 0})
      .text(function (d) {
        return (d3.format(".2f")(d.values["0"].growth))
      })
      .style("stroke", function (d) { 
        return pt.plotGdpLRun.color(d.expPeriod);
      });

    // Add labels to axes
    pt.plotGdpLRun.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Percent");

}