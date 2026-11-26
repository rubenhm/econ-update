// Reads data from CSV and creates plot in d3.js

var pt = pt || {};

pt.plotGdpProd = pt.plotGdpProd || {};
pt.plotGdpProd.svg = null;

pt.plotGdpProd.init = function () {
	'use strict';

	//Define svg
	pt.plotGdpProd.svg = d3.select("#gdp_prod .placeholder")
			.append("svg")
			.attr("width", pt.outerWidth)
			.attr("height", pt.outerHeight);
};

pt.plotGdpProd.chart = function(error,data) {
	'use strict';

	if (error) {
		return pt.displayError(error);
	}

	// Parse data and make numeric
	data.forEach( function (d) {
		d.date = parseDate(d.DATE);
		d.gdp = +d.GDP;
		d.prod = +d.PRDGRNFB;
		d.prodma = +d.MVPRDGRNFB;
		d.meangr = +d.AVGEXP;
		d.recess = +d.USRECQM;
		d.avgidx = +d.AVGEXPIDX;
	});

    // Filter data with obs. for productivity
    data = data.filter( function (d,i) {
        return d.PRDGRNFB !== "";
    });
    // console.log(data)

	// Determine initial dates
	// pt.plotGdpProd.minDate = d3.min(data,function(d){ return d.date; });
    pt.plotGdpProd.minDate = parseDate("1988-01-01")
	pt.plotGdpProd.maxDate = d3.max(data,function(d){ return d.date; });

	// Filter the data 
	data = data.filter(function (d,i) {
		return d.date >= pt.plotGdpProd.minDate;
	})
	// console.log(data)
    // Find min,max gdp growth rate 
    pt.plotGdpProd.minValue = d3.min(data,function(d){ return Math.min(d.prod,d.prodma); });
    pt.plotGdpProd.maxValue = d3.max(data,function(d){ return Math.max(d.prod,d.prodma); });

    // console.log([pt.plotGdpProd.minValue ,pt.plotGdpProd.maxValue ])

	// Axes and scales
	pt.plotGdpProd.x = d3.scaleTime()
						.domain([pt.plotGdpProd.minDate, pt.plotGdpProd.maxDate])
						.range([0, pt.innerWidth])
	pt.plotGdpProd.y = d3.scaleLinear()
						.domain([pt.plotGdpProd.minValue, pt.plotGdpProd.maxValue])
						.range([pt.innerHeight,0]).nice()
	pt.plotGdpProd.yAxis = d3.axisLeft(pt.plotGdpProd.y)
	pt.plotGdpProd.xAxis = d3.axisBottom(pt.plotGdpProd.x)
						// .tickValues(pt.plotGdpProd.x.domain().filter( function (d,i) {
    		// 		return !(i%4);
    		// 	}))
						.tickFormat(function (d) {
							if (d.getMonth()==0 && (d.getFullYear()%2==0)) {
								return d3.timeFormat("%Y")(d);
							} else {
								return "";
							}
						})

	// Define line generators for each variable

	pt.plotGdpProd.line_pr = d3.line()
				.x(function (d) { return pt.plotGdpProd.x(d.date); })
				.y(function (d) { return pt.plotGdpProd.y(d.prod); })
	pt.plotGdpProd.line_prma = d3.line()
				.x(function (d) { return pt.plotGdpProd.x(d.date); })
				.y(function (d) { return pt.plotGdpProd.y(d.prodma); })

	// Recession bars

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

	// Append chart group to svg
	pt.plotGdpProd.chartGroup = pt.plotGdpProd.svg.append("g")
			.attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    // Add axes
    pt.plotGdpProd.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+pt.innerHeight+")").call(pt.plotGdpProd.xAxis);
    pt.plotGdpProd.chartGroup.append("g").attr("class","y axis").call(pt.plotGdpProd.yAxis);

    // Append recession bars
    pt.plotGdpProd.chartGroup.append("g").selectAll("recessm")
    		.data(recessions)
    		.enter().append("rect")
    		.attr("class","recessm")
    		.attr("x", function (d) {
    			return pt.plotGdpProd.x(d.iniDate);})
    		.attr("y", 0)
    		.attr("height", pt.innerHeight)
    		.attr("width", function (d) {
    			return pt.innerWidth*d.length/lenData;
    		});

    // Add time series
    pt.plotGdpProd.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotGdpProd.line_pr(data))
              .attr("stroke", colors[0]);
    pt.plotGdpProd.chartGroup.append("path")
              .attr("class","line")
              .attr("d",pt.plotGdpProd.line_prma(data))
              .attr("stroke", colors[1]);

//      Add axes
    pt.plotGdpProd.chartGroup.append("g").attr("class","x axis").attr("transform","translate(0,"+(pt.innerHeight)+")").call(pt.plotGdpProd.xAxis);
    pt.plotGdpProd.chartGroup.append("g").attr("class","y axis").call(pt.plotGdpProd.yAxis);

// Add zero line
	pt.plotGdpProd.chartGroup.append("line")
		.attr("class","vline")
		.attr("x1", 0)
		.attr("y1", pt.plotGdpProd.y(0))
		.attr("x2", pt.innerWidth)
		.attr("y2", pt.plotGdpProd.y(0))

// Legends

    pt.plotGdpProd.legends = pt.plotGdpProd.chartGroup.append("g").attr("class","legend")

    pt.plotGdpProd.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+pt.plotGdpProd.y(data[data.length-1]["prod"])+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[0])
            .text("Productivity ("+d3.format(".1f")(data[data.length-1]["prod"])+")")

    pt.plotGdpProd.legends
        .append("text")
        .attr("transform","translate("+(pt.innerWidth+4)+","+pt.plotGdpProd.y(data[data.length-1]["prodma"])+")")
            .attr("dy",".35em")
            .attr("text-anchor","start")
            .style("fill",colors[1])
            .text("Productiv. (MA) ("+d3.format(".1f")(data[data.length-1]["prodma"])+")")

    pt.plotGdpProd.chartGroup.append("text")
            .attr("class", "y label")
            .attr("x", pt.innerWidth)
            .attr("y", 0)
            .attr("text-anchor","end")
            .text("Last obs. "+quarterDate(data[data.length-1]["date"]))

    // Add labels to axes
    pt.plotGdpProd.chartGroup.append("text")
            .attr("class", "y label")
            .attr("text-anchor","left")
            .attr("x", 0)
            .attr("y", -topYAxisPadding)
            .text("Percent year-over-year change")
}