/* JavaScript goes here. */
// Simple Statistics Library for Jenks:
// Source: http://simplestatistics.org/
// Example: http://bl.ocks.org/tmcw/4969184



var pt = pt || {};

pt.plotMapUrCurr = pt.plotMapUrCurr || {};
pt.plotMapUrCurr.svg = null;

pt.plotMapUrCurr.init = function () {
    'use strict';
    // Define SVG
    pt.plotMapUrCurr.svg = d3.select("#map_ur_curr .placeholder").append("svg")
            .attr("width", pt.innerWidth)
            .attr("height", pt.outerHeight);
    console.log("Done Map UR Curr init.");
};

pt.plotMapUrCurr.chart = function(error, latestdate, us, urdata) {
    'use strict';

    if (error) {
      return pt.displayError(error);
    }

    // format dates
    var endDate = d3.timeFormat("%B %Y")(d3.timeParse("%Y%m%d")(latestdate["1"]["date"]));
    console.log(endDate);

    var formatNumber = d3.format(" =+5.1f");

    // Define scales
    // Jenks 5 categories, 5 colors 
    var cutoffsArrays = ss.ckmeans(urdata.map( function (d) {
                            return +d.ratecurr;
                          }), 5);

    console.log(cutoffsArrays);
    var cutoffs =[];
    var secPos;
      for (var i=0; i< cutoffsArrays.length ; i++) {
        secPos = cutoffsArrays[i].length-1;
        cutoffs[i] = cutoffsArrays[i][secPos];
      }
    pt.plotMapUrCurr.color = d3.scaleThreshold()
                    .domain(cutoffs)
                    .range(colorsMapCat5);

    // Append the smallest value to cutoffs
    cutoffs.splice(0,0,cutoffsArrays[0][0]);
    console.log(cutoffs);


    pt.plotMapUrCurr.d4mapProjection = d3.geoAlbers()
        .center([3,39.43])
        .rotate([85, 0])
        .parallels([29.5, 45.5])
        .scale(5800)
        .translate([pt.innerWidth / 2, pt.innerHeight / 2]);

    pt.plotMapUrCurr.path = d3.geoPath()
        .projection(pt.plotMapUrCurr.d4mapProjection);


    var curRateById = {},
        difRateById = {},
        nameById = {};


    urdata.forEach( function (d) {
        curRateById[d.id] = +d.ratecurr;
        difRateById[d.id] = Number(d.ratecurr) - Number(d.rateprev);
        nameById[d.id] = d.county;
    });

    // D4 counties
    var selected = {"21011": 1,"21013": 1,"21015": 1,"21017": 1,"21019": 1,"21023": 1,"21025": 1,"21037": 1,"21043": 1,"21049": 1,"21051": 1,"21063": 1,"21065": 1,"21067": 1,"21069": 1,"21071": 1,"21079": 1,"21081": 1,"21089": 1,"21095": 1,"21097": 1,"21109": 1,"21113": 1,"21115": 1,"21117": 1,"21119": 1,"21121": 1,"21125": 1,"21127": 1,"21129": 1,"21131": 1,"21133": 1,"21135": 1,"21137": 1,"21147": 1,"21151": 1,"21153": 1,"21159": 1,"21161": 1,"21165": 1,"21173": 1,"21175": 1,"21181": 1,"21189": 1,"21191": 1,"21193": 1,"21195": 1,"21197": 1,"21199": 1,"21201": 1,"21203": 1,"21205": 1,"21209": 1,"21235": 1,"21237": 1,"21239": 1,"39001": 1,"39003": 1,"39005": 1,"39007": 1,"39009": 1,"39011": 1,"39013": 1,"39015": 1,"39017": 1,"39019": 1,"39021": 1,"39023": 1,"39025": 1,"39027": 1,"39029": 1,"39031": 1,"39033": 1,"39035": 1,"39037": 1,"39039": 1,"39041": 1,"39043": 1,"39045": 1,"39047": 1,"39049": 1,"39051": 1,"39053": 1,"39055": 1,"39057": 1,"39059": 1,"39061": 1,"39063": 1,"39065": 1,"39067": 1,"39069": 1,"39071": 1,"39073": 1,"39075": 1,"39077": 1,"39079": 1,"39081": 1,"39083": 1,"39085": 1,"39087": 1,"39089": 1,"39091": 1,"39093": 1,"39095": 1,"39097": 1,"39099": 1,"39101": 1,"39103": 1,"39105": 1,"39107": 1,"39109": 1,"39111": 1,"39113": 1,"39115": 1,"39117": 1,"39119": 1,"39121": 1,"39123": 1,"39125": 1,"39127": 1,"39129": 1,"39131": 1,"39133": 1,"39135": 1,"39137": 1,"39139": 1,"39141": 1,"39143": 1,"39145": 1,"39147": 1,"39149": 1,"39151": 1,"39153": 1,"39155": 1,"39157": 1,"39159": 1,"39161": 1,"39163": 1,"39165": 1,"39167": 1,"39169": 1,"39171": 1,"39173": 1,"39175": 1,"42003": 1,"42005": 1,"42007": 1,"42019": 1,"42031": 1,"42039": 1,"42049": 1,"42051": 1,"42053": 1,"42059": 1,"42063": 1,"42065": 1,"42073": 1,"42085": 1,"42111": 1,"42121": 1,"42123": 1,"42125": 1,"42129": 1,"54009": 1,"54029": 1,"54051": 1,"54069": 1,"54095": 1,"54103": 1};

    var counties = topojson.feature(us, us.objects.counties);
    var selection = {type: "FeatureCollection", features: counties.features.filter(function (d) { return d.id in selected;} )};
    var exselection = {type: "FeatureCollection", features: counties.features.filter(function (d) { return d.id && !(d.id in selected);} )};

    // County boundaries outside selection
    var d4countyExBoundsMesh = topojson.mesh(us, us.objects.counties, function (a, b) {
        return a !== b // a border between two counties
            && (a.id === 53000 || b.id === 5300 // where a and b are in puget sound
               || a.id % 1000 && b.id % 1000) // or a and b are not in a lake
            && !(a.id / 1000 ^ b.id / 1000) // and a and b are in the same state
            && (
               ( !(a.id in selected) && !(b.id in selected) )
            || (  (a.id in selected) && !(b.id in selected) )
            || ( !(a.id in selected) &&  (b.id in selected) )
            );
      });

    // County boundaries inside selection
    var d4countyBoundsMesh = topojson.mesh(us, us.objects.counties, function (a, b) {
        return a !== b // a border between two counties
            && (a.id === 53000 || b.id === 5300 // where a and b are in puget sound
              || a.id % 1000 && b.id % 1000) // or a and b are not in a lake
            && !(a.id / 1000 ^ b.id / 1000) // and a and b are in the same state
            && (
               (  (a.id in selected) &&  (b.id in selected) )
            || (  (a.id in selected) && !(b.id in selected) )
            || ( !(a.id in selected) &&  (b.id in selected) )
            );
      });

    var stateBoundsMesh = topojson.mesh(us, us.objects.states, function(a, b) {
         return a !== b ; // a and b not in selection//
        });

    

  // Define Map Chart group here
    pt.plotMapUrCurr.chartGroup = pt.plotMapUrCurr.svg.append("g")
          .attr("transform","translate("+pt.margin.left+","+pt.margin.top+")");

    pt.plotMapUrCurr.defs = pt.plotMapUrCurr.chartGroup.append("defs");

    pt.plotMapUrCurr.defs.append("filter")
        .attr("id", "blur")
        .append("feGaussianBlur")
        .attr("stdDeviation", 5);

    pt.plotMapUrCurr.defs.append("path")
      .datum(topojson.feature(us, us.objects.land))
      .attr("id", "land")
      .attr("d", pt.plotMapUrCurr.path);

    pt.plotMapUrCurr.chartGroup.append("use")
      .attr("class", "land-glow")
      .attr("xlink:href", "#land");

    pt.plotMapUrCurr.chartGroup.append("use")
      .attr("class", "land-fill")
      .attr("xlink:href", "#land");


  // Counties outside selection
    pt.plotMapUrCurr.chartGroup.append("path")
        .datum(exselection)
        .attr("class", "counties")
        .attr("d", pt.plotMapUrCurr.path);

    pt.plotMapUrCurr.chartGroup.append("path")
        .datum(d4countyExBoundsMesh)
        .attr("class", "county-boundary")
        .attr("d", pt.plotMapUrCurr.path);

  // Counties inside selection
    pt.plotMapUrCurr.chartGroup.append("g")
        .selectAll("path")
          .data(selection.features)
          .enter().append("path")
          .attr("class", "d4-county")
          .attr("id", function(d) {
             return "F" + d.id ;}
               )
           .attr("d", pt.plotMapUrCurr.path)
           .style("fill", function(d) { return pt.plotMapUrCurr.color(curRateById[d.id]); })
           .append("title")
           .text(function(d) { return nameById[d.id] + " (FIPS: " + d.id + ")"
              + "\nUnemployment rate: " + formatNumber(curRateById[d.id]) + "%"; });

    pt.plotMapUrCurr.chartGroup.append("path")
        .datum(d4countyBoundsMesh)
        .attr("class", "d4-county-boundary")
        .attr("d", pt.plotMapUrCurr.path);

  // State boundaries
    pt.plotMapUrCurr.chartGroup.append("path")
        .datum(stateBoundsMesh)
        .attr("class", "state-boundary")
        .attr("d", pt.plotMapUrCurr.path);


  // Add labels and color guide
    pt.plotMapUrCurr.chartGroup.append("g")
      .attr("class", "label")
      .selectAll("rect")
      .data([0,1,2,3,4])
      .enter()
      .append("rect")
          .attr("x", 675)
          .attr("y", function (d) {return 350 + d*27; })
          .attr("width", 23).attr("height",23)
          // .attr("class", function (d) {return "key colour" + (d) ;})
          .style("fill",  function (d) {
            return colorsMapCat5[d]; });

    pt.plotMapUrCurr.chartGroup.append("g")
      .attr("class", "label")
      .selectAll("text")
      .data([1,2,3,4,5])
      .enter()
      .append("text").attr("class","keytext")
          .attr("x", 700)
          .attr("y", function (d) {return 365 + (d-1)*29; })
          .text(function (d) {
              return formatNumber(cutoffs[d-1]) + " to " + formatNumber(cutoffs[d]) + "%";
            });
          // .style("fill",  function (d) { return colorsMapCat5[d-1]; })

    // Add legends
     pt.plotMapUrCurr.chartGroup.append("text")
          .attr("class", "y label")
          .attr("x", 0.82*pt.innerWidth)
          .attr("y", 1.02*pt.innerHeight)
          .attr("text-anchor","end")
          .text("Period: "+ endDate);


};

