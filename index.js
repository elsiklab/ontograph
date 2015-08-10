var d3=require('d3');
var dagreD3=require('dagre-d3');
var request=require('request');


request('http://localhost/~biocmd/ontograph/gene_ontology.json', function(err,res,body) {
    var graph=JSON.parse(body);
    // Create the input graph
    console.log(graph);
    var g = new dagreD3.graphlib.Graph()
      .setGraph({})
      .setDefaultEdgeLabel(function() { return {}; })
      .setDefaultNodeLabel(function() { return 'name'; });

    // Here we"re setting nodeclass, which is used by our custom drawNodes function
    // below.

    for(var i=0; i<graph.length; i++) {
        var node=graph[i];
        console.log(node.id);
        g.setNode(node.id, node.name);
        if(i>25) break;
    }
    

    for(var i=0; i<graph.length; i++) {
        var node=graph[i];
        console.log(node.id,node.parent);
        if(node.parent) {
            g.setEdge(node.id,node.parent);
        }
        if(i>25) break;
    }

    // Create the renderer
    var render = new dagreD3.render();

    // Set up an SVG group so that we can translate the final graph.
    var svg = d3.select("svg"),
        svgGroup = svg.append("g");

    // Run the renderer. This is what draws the final graph.
    render(d3.select("svg g"), g);

    // Center the graph
    var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
    svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
    svg.attr("height", g.graph().height + 40);
});


