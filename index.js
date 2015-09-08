var d3=require('d3');
var dagreD3=require('dagre-d3');
var utils=require('./js/util.js');


var depth_limit=20;
var nodes=[];

function process_parents(d3g, graph, term, depth) {
    var node = graph[term];
    if(!node) {
        return;
    }
    if(!nodes[node.label]) {
        d3g.setNode(node.label, {label: utils.explode(node.description, 20)});
        nodes[node.label]=true;
    }
    if(node.parents) {
        for(var i=0; i<node.parents.length; i++) {
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
        return;
    }
    if(node.parents) {
        for(var i=0; i<node.parents.length; i++) {
            if(!edges[node.label+","+node.parents[i]]) {
                d3g.setEdge(node.parents[i], node.label);
                edges[node.label+","+node.parents[i]]=true;

                if(depth<depth_limit) {
                    process_parents_edges(d3g, graph, node.parents[i],depth+1);
                }
            }
        }
    }
}



// check query params
var param=utils.getParameterByName('term');
if(param) {
    $('#term').val(param);
}


var graph;
$.ajax({url: 'gene_ontology.json', dataType: 'json'}).done(function(response) {
    graph = response;
    var term = $('#term').val();
    $("#loading").text("");
    setup_graph(term);
});


$("form").submit(function() {
    var term = $('#term').val();
    console.log("term="+term);
    window.location.search="term="+term;
    setup_graph(term);
    return false;
});



function setup_graph(term) {
    // Create the input graph
    $("#svg-canvas").empty();
    var g = new dagreD3.graphlib.Graph()
      .setGraph({})
      .setDefaultEdgeLabel(function() { return {}; })
      .setDefaultNodeLabel(function() { return {}; });

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
      .attr("title", function(v) { return styleTooltip(v, g.node(v).label) })
      .each(function(v) { $(this).tipsy({ gravity: "w", opacity: 1, html: true }); });


    // Center the graph
    var initialScale = 0.75;
    zoom
      .translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 20])
      .scale(initialScale)
      .event(svg);
    svg.attr('height', g.graph().height * initialScale + 40);
}
