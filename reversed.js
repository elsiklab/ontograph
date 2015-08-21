var d3=require('d3');
var dagreD3=require('dagre-d3');

var depth_limit=6;
var nodes=[];
function process_parents(d3g, graph, term, depth) {
    var node = graph[term];
    if(!node) {
        console.log("term not found: "+ term);
        return;
    }
    if(!nodes[node.label]) {
        d3g.setNode(node.label, node);
        nodes[node.label]=true;
    }
    else {
        console.log("node already added: "+nodes[node.label]);
    }
    if(node.parents) {
        for(var i=0; i<node.parents.length; i++) {
            console.log("parent: "+node.parents[i]+" depth: "+depth);
            if(depth<depth_limit) {
                process_parents(d3g, graph, node.parents[i],depth+1);
            }
        }
    }
}


var edges=[];
function process_parents_edges(d3g, graph, term, depth) {
    var node = graph[term];
    if(!node) {
        console.log("term not found: "+term);
        return;
    }
    if(node.parents && depth<depth_limit) {
        for(var i=0; i<node.parents.length; i++) {
            console.log(node.label, node.parents[i]);
            if(!edges[node.label+","+node.parents[i]]) {
                d3g.setEdge(node.parents[i], node.label);
                edges[node.label+","+node.parents[i]]=true;
            }
            else { console.log("edge already added: "+edges[node.label+","+node.parents[i]]); }
            process_parents_edges(d3g, graph, node.parents[i],depth+1);
        }
    }
}


$.ajax({url: 'gene_ontology.json', dataType: 'json'}).done(function(graph) {
    // Create the input graph
    var g = new dagreD3.graphlib.Graph()
      .setGraph({})
      .setDefaultEdgeLabel(function() { return {}; });

    var term="GO:0010458";
    process_parents(g,graph,term,0);
    process_parents_edges(g,graph,term,0);

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

    // Create the renderer
    var render = new dagreD3.render();

    // Run the renderer. This is what draws the final graph.
    render(inner, g);
    inner.selectAll("g.node")
      .attr("title", function(v) { return styleTooltip(v, g.node(v).description) })
      .each(function(v) { $(this).tipsy({ gravity: "w", opacity: 1, html: true }); });

    // Center the graph
    var initialScale = 0.75;
    zoom
      .translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 20])
      .scale(initialScale)
      .event(svg);
    svg.attr('height', g.graph().height * initialScale + 40);  
});