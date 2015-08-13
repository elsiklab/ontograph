var d3=require('d3');
var dagreD3=require('dagre-d3');
var request=require('request');


request('http://localhost/~biocmd/ontograph/gene_ontology.json', function(err,res,body) {
    var graph=JSON.parse(body);
    // Create the input graph
    var g = new dagreD3.graphlib.Graph()
      .setGraph({})
      .setDefaultEdgeLabel(function() { return {}; });

    // Here we"re setting nodeclass, which is used by our custom drawNodes function
    // below.

    for(var i=0; i<graph.length; i++) {
        var node=graph[i];
        g.setNode(node.label, node);
        if(i>25) break;
    }
    

    for(var i=0; i<graph.length; i++) {
        var node=graph[i];
        if(node.parent) {
            g.setEdge(node.label,node.parent);
        }
        if(i>25) break;
    }

    // Create the renderer
    var render = new dagreD3.render();

    // Set up an SVG group so that we can translate the final graph.
    var svg = d3.select("svg"),
        inner = svg.append("g");

    // Set up zoom support
    var zoom = d3.behavior.zoom().on("zoom", function() {
      inner.attr("transform", "translate(" + d3.event.translate + ")" +
                                  "scale(" + d3.event.scale + ")");
    });
    svg.call(zoom);


    // Simple function to style the tooltip for the given node.
    var styleTooltip = function(name, description) {
          return "<p class='name'>" + name + "</p><p class='description'>" + description + "</p>";
    };
    inner.selectAll("g.node")
      .attr("title", function(v) { return styleTooltip(v, g.node(v).description) })
      .each(function(v) { $(this).tipsy({ gravity: "w", opacity: 1, html: true }); });



    // Create the renderer
    var render = new dagreD3.render();

    // Run the renderer. This is what draws the final graph.
    render(inner, g);

    // Center the graph
    var initialScale = 0.75;
    zoom
      .translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 20])
      .scale(initialScale)
      .event(svg);
    svg.attr('height', g.graph().height * initialScale + 40);
   

});


