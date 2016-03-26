var dagre = require('dagre');
var cytoscape = require('cytoscape');
var cydagre = require('cytoscape-dagre');
var cyqtip = require('cytoscape-qtip');
var domready = require('domready');
var _ = require('underscore');
var utils = require('./js/util.js');
var chroma = require('chroma-js');


var depth_limit = 20;
var nodes_cy = [];
var edges_cy = [];

var go_colors = [
    "parents",
    "has_part",
    "part_of",
    "negatively_regulates",
    "regulates",
    "positively_regulates",
    "occurs_in",
    "happens_during",
    "ends_during",
];
var chebi_colors = [
    "is_conjugate_base_of",
    "has_functional_parent",
    "has_role",
    "has_part",
    "has_parent_hydride",
    "is_conjugate_acid_of",
    "is_conjugate_base_of",
    "is_substituent_group_from",
    "is_enantiomer_of",
    "is_tautomer_of",
    "has_parent_hydride",
    "is_substituent_group_from"
];


var so_colors = [
    "parents",
    "has_part",
    "part_of",
    "has_quality",
    "derives_from",
    "transcribed_to",
    "transcribed_from",
    "has_origin",
    "adjacent_to",
    "non_functional_homolog_of",
    "variant_of",
    "member_of",
    "contains",
    "guided_by",
    "overlaps"
];

var arr = go_colors.concat(so_colors).concat(chebi_colors);
var color_palette = _.shuffle(chroma.scale('Set1').colors(40));
var scales = function(elt) { return elt=="parents"?"#333":color_palette[arr.indexOf(elt)-1]; };


function process_parents(cy, graph, term, depth) {
    var node = graph[term];
    if(!node) {
        return;
    }
    if(!nodes_cy[term]) {
        nodes_cy[term]={
            data: {
                id: term,
                label: utils.explode(node.description, 20)
            }
        };
    }
    arr.forEach(function(elt) {
        var list = node[elt];
        if(list) {
            list.forEach(function(tangential_term) {
                var tangential_node = graph[tangential_term];
                if(!nodes_cy[tangential_term]) {
                    nodes_cy[tangential_term]={
                        data: {
                            id: tangential_term,
                            label: utils.explode(tangential_node.description, 20)
                        }
                    };
                }
            });
        }
    });
    if(node.parents) {
        for(var i=0; i<node.parents.length; i++) {
            if(depth<depth_limit) {
                process_parents(cy, graph, node.parents[i], depth+1);
            }
        }
    }
}


function process_parents_edges(cy, graph, term, depth) {
    var node = graph[term];
    if(!node) {
        return;
    }
    
    arr.forEach(function(elt) {
        if(node[elt]) {
            for(var i=0; i<node[elt].length; i++) {
                if(!edges_cy[term+","+node[elt][i]+"-"+elt]) {
                    edges_cy[term+","+node[elt][i]+"-"+elt] = {
                        data: {
                            id: term+","+node[elt][i]+"-"+elt,
                            label: elt,
                            source: node[elt][i],
                            target: term,
                            type: scales(elt)
                        }
                    };
                    if(depth < depth_limit && elt == "parents") {
                        process_parents_edges(cy, graph, node[elt][i], depth+1);
                    }
                }
            }
        }
    });
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
                'color': '#000',
                'background-color': '#fff',
                'border-color': '#333',
                'border-width': '5px',
                'shape': 'rectangle',
                'text-max-width': '1000px',
                'text-wrap': 'wrap',
                'width': 'label',
                'padding-left': '9px',
                'padding-bottom': '9px',
                'padding-right': '9px',
                'padding-top': '9px',
                'height': 'label'
            })
        .selector('edge')
            .css({
                'target-arrow-shape': 'triangle',
                'target-arrow-fill': '#333',
                'target-arrow-color': '#333',
                'line-color': 'data(type)',
                'width': '5px'
            });

    process_parents(cy, graph, term, 0);
    process_parents_edges(cy, graph, term, 0);

    var cy=cytoscape({
        container: $('#cy'),
        style: stylesheet_cy,
        elements: {
            nodes: _.values(nodes_cy),
            edges: _.values(edges_cy)
        }
    });

    
    cy.elements().qtip({
        content: function(arg){ return '<b>'+this.data('id')+'</b><br />'+this.data('label'); },
        position: {
            my: 'top center',
            at: 'bottom center'
        },
        style: {
            classes: 'qtip-bootstrap',
            'font-family': 'sans-serif',
            tip: {
                width: 16,
                height: 8
            }
        }
    });

    //manually crate and stop layout after timeout
    var layout_cy=cy.makeLayout({
        name: 'dagre',
        padding: 50,
        randomize: true,
        animate: true,
        infinite: true,
        repulsion: 1
    });

    layout_cy.run();

    $("#save_button").on('click', function(e) {
        $("#output").append($("<a/>").attr({href: cy.png({scale: 3})}).append("Download picture"));
    });
}

domready(function(){
    cydagre(cytoscape, dagre); // register extension 
    cyqtip( cytoscape, $ ); // register extension
    var graph;
    var ontology;
    var term = $('#term').val();
    var legend_colors = [];
    if(term.match(/^ECO:/)) { ontology="evidence_ontology.json"; }
    else if(term.match(/^GO:/)) { ontology="gene_ontology.json"; legend_colors = go_colors; }
    else if(term.match(/^SO:/)) { ontology="sequence_ontology.json"; legend_colors = so_colors; }
    else if(term.match(/^CHEBI:/)) { ontology="chebi.json"; legend_colors = chebi_colors; }
    else if(term.match(/^HP:/)) { ontology="hp.json"; }
    Object.keys(legend_colors).forEach(function(elt) {
        $("#legend").append("<div style='height: 12px; width: 50px; background: "+scales(legend_colors[elt])+"'></div><div>"+legend_colors[elt]+"</div>");
    });
    if(!ontology) {
        $("#loading").text("Error: ontology not found for "+term);
    }
    else {
        $.ajax({url: ontology, dataType: 'json'}).done(function(response) {
            graph = response;
            $("#loading").text("");
            setup_graph(graph, term);
        });
    }


    $("form").submit(function() {
        var term = $('#term').val();
        window.location.search = "term="+term;
        setup_graph(graph, term);
        return false;
    });

});
