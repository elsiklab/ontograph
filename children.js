var d3=require('d3');
var dagreD3=require('dagre-d3');

var nodes = []
var depthLimit=6;

function filter(array, fn) {
  var results = [];
  var item;
  for (var i = 0, len = array.length; i < len; i++) {
    item = array[i];
    if (fn(item)) results.push(item);
  }
  return results;
}

function explode(text, max) {    
    text = text.replace(/  +/g, " ").replace(/^ /, "").replace(/ $/, "");    
    if (typeof text === "undefined") return "";
    
    // if max hasn't been defined, max = 30
    if (typeof max === "undefined") max = 30;    
    if (text.length <= max) return text;
    
    var exploded = text.substring(0, max);    
    text = text.substring(max);    
    if (text.charAt(0) !== " ") {        
        while (exploded.charAt(exploded.length - 1) !== " " && exploded.length > 0) {            
            text = exploded.charAt(exploded.length - 1) + text;            
            exploded = exploded.substring(0, exploded.length - 1);
        }        
        if (exploded.length == 0) {            
            exploded = text.substring(0, max);
            text = text.substring(max);        
        } else {            
            exploded = exploded.substring(0, exploded.length - 1);
        }    
    } else {        
        text = text.substring(1);
    }    
    return exploded + "\n" + explode(text,max);
}

function processNode(d3g, graph, arr, root, depth) {
    var node =  graph[root];
   
    if (!node) {
      console.log("term not found:" + root);
      return;
    }    
    if (!nodes[node.label]) {
      d3g.setNode(node.label, {label: explode(node.description, 20)});
      nodes[node.label]=true;
    }
    else {
        console.log("node already added: "+nodes[node.label]);
    }
    
    var childs = filter(arr,function(obj){
      return obj.hasOwnProperty('parents') && obj['parents'].indexOf(root) > -1;
      });
    
    if (childs.length > 0) {        
        for(var i=0; i<childs.length; i++) {
          if(depth<depthLimit) {
                processNode(d3g, graph, arr, childs[i].label,depth+1);
            }
        }
    }    
}

var edges=[];
function processNodeEdges(d3g, graph, arr, root, depth) {
    var node = graph[root];
    if(!node) {
        console.log("term not found: "+root);
        return;
    }
     
    var childs = filter(arr, function(obj){
      return obj.hasOwnProperty('parents') && obj['parents'].indexOf(root) > -1;
      });
    if (childs.length > 0 && depth<depthLimit) {
      for (var i=0; i<childs.length; i++) {
        if (!edges[node.label+","+childs[i].label]) {          
          d3g.setEdge(node.label, childs[i].label);
          edges[node.label+","+childs[i].label]=true;
        }
        else { console.log("edge already added: "+edges[node.label+","+childs[i].label]); }
        if(depth<depthLimit) {
                processNodeEdges(d3g, graph, arr, childs[i].label,depth+1);
            }
      }
    }    
}

$.ajax({
    url: 'gene_ontology.json',
    datatype: 'json'
    }).done(function(graph){
  // Create the input graph
    var g = new dagreD3.graphlib.Graph()
      .setGraph({})
      
      .setDefaultEdgeLabel(function() { return {}; });
    var term = "GO:0010458";
    var arr = $.map(graph, function(x, i){
      return x
      });   
    processNode(g, graph, arr, term, 0);
    processNodeEdges(g, graph, arr, term, 0);    
    g.nodes().forEach(function(v) {
        var node = g.node(v);
        // Round the corners of the nodes
        node.rx = node.ry = 10;
      });
    //Create the renderer
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
      .attr("title", function(v) {
        return styleTooltip(v, g.node(v).label)
        })
      .each(function(v) { $(this).tipsy({ gravity: "w", opacity: 1, html: true }); });

    // Center the graph
    var initialScale = 0.75;
    zoom
      .translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 20])
      .scale(initialScale)
      .event(svg);
    svg.attr('height', g.graph().height * initialScale + 40);    
});