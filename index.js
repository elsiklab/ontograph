var d3=require('d3');
var $=require('jquery');
var dagre=require('dagre');
var cytoscape=require('cytoscape');
var cydagre=require('cytoscape-dagre');
var domready=require('domready');
var _=require('underscore');
var utils=require('./js/util.js');


var depth_limit=20;
var nodes_cy=[];

function process_parents(cy, graph, term, depth) {
    var node = graph[term];
    if(!node) {
        return;
    }
    if(!nodes_cy[node.label]) {
        nodes_cy[node.label]={
            data: {
                id: node.label,
                label: utils.explode(node.description, 20)
            }
        };
    }
    if(node.parents) {
        for(var i=0; i<node.parents.length; i++) {
            if(depth<depth_limit) {
                process_parents(cy, graph, node.parents[i],depth+1);
            }
        }
    }
}


var edges_cy=[];
function process_parents_edges(cy, graph, term, depth) {
    var node = graph[term];
    if(!node) {
        return;
    }
    if(node.parents) {
        for(var i=0; i<node.parents.length; i++) {
            if(!edges_cy[node.label+","+node.parents[i]]) {
                edges_cy[node.label+","+node.parents[i]] = {
                    data: {
                        id: node.label+","+node.parents[i],
                        source: node.parents[i],
                        target: node.label
                    }
                };
                if(depth<depth_limit) {
                    process_parents_edges(cy, graph, node.parents[i],depth+1);
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



function setup_graph(graph, term) {
    // Create the input graph
    var stylesheet_cy=cytoscape.stylesheet()
        .selector('node')
            .style({
                'content': 'data(label)',
                'text-valign': 'center',
                'text-outline-width': 2,
                'text-outline-color': '#000',
                'color': '#fff'
            })
        .selector('edge')
            .css({
                'target-arrow-shape': 'triangle'
            });

    process_parents(cy,graph,term,0);
    process_parents_edges(cy,graph,term,0);
    var cy=cytoscape({
        container: document.getElementById('cy'),
        style: stylesheet_cy,
        elements: {
            nodes: _.values(nodes_cy),
            edges: _.values(edges_cy)
        }
    });

    //manually crate and stop layout after timeout
    var layout_cy=cy.makeLayout({
        name: 'dagre',
        padding: 10,
        randomize: true,
        animate: true,
        infinite: true,
        repulsion: 1
    });

    layout_cy.run();
    
}

domready(function(){
    cydagre(cytoscape, dagre); // register extension 
    var graph;
    $.ajax({url: 'gene_ontology.json', dataType: 'json'}).done(function(response) {
        graph = response;
        var term = $('#term').val();
        $("#loading").text("");
        setup_graph(graph, term);
    });


    $("form").submit(function() {
        var term = $('#term').val();
        console.log("term="+term);
        window.location.search = "term="+term;
        setup_graph(graph, term);
        return false;
    });

});
