var dagre = require('dagre');
var cytoscape = require('cytoscape');
var cydagre = require('cytoscape-dagre');
var cyqtip = require('cytoscape-qtip');
var _ = require('underscore');
var utils = require('./js/util.js');
var chroma = require('chroma-js');


var depth_limit = 20;
var nodes_cy = [];
var edges_cy = [];
var relationships = [];
var graph;
var ontology;
var setup;
var cy;



var scales = function(elt) {
    var color_palette = chroma.scale('Set1').colors(relationships.length);
    return elt == 'parents' ? '#333' : color_palette[relationships.indexOf(elt) - 1];
};

function process_graph(graph) {
    terms = {};
    Object.keys(graph).forEach(function(key) {
        var node = graph[key];
        terms[node.description] = key;
    });
}

function process_parents( cy, graph, term, depth ) {
    var node = graph[ term ];
    if( !node ) {
        return;
    }
    if( !nodes_cy[term] ) {
        nodes_cy[term] = {
            data: {
                id: term,
                label: utils.explode(node.description, 22),
            },
        };
    }
    relationships.forEach(function(elt) {
        var list = node[elt];
        if(list) {
            list.forEach(function(tangential_term) {
                var tangential_node = graph[tangential_term];
                if(!nodes_cy[tangential_term]) {
                    nodes_cy[tangential_term] = {
                        data: {
                            id: tangential_term,
                            label: utils.explode((tangential_node || {}).description || tangential_term, 22),
                        },
                    };
                }
            });
        }
    });
    if(node.parents) {
        for(var i = 0; i < node.parents.length; i++) {
            if(depth < depth_limit) {
                process_parents(cy, graph, node.parents[i], depth + 1);
            }
        }
    }
}


function process_parents_edges(cy, graph, term, depth) {
    var node = graph[term];
    if(!node) {
        return;
    }

    relationships.forEach(function(elt) {
        if(node[elt]) {
            for(var i = 0; i < node[elt].length; i++) {
                var edge_name = term + ',' + node[elt][i] + '-' + elt;
                if(!edges_cy[edge_name]) {
                    var target = node[elt][i];
                    var source = term;

                    edges_cy[edge_name] = {
                        data: {
                            label: elt,
                            target: target,
                            source: source,
                        },
                    };
                    if(depth < depth_limit && elt == 'parents') {
                        process_parents_edges(cy, graph, node[elt][i], depth + 1);
                    }
                }
            }
        }
    });
}



function setup_graph( graph, term ) {
    // Create the input graph
    var stylesheet_cy = cytoscape.stylesheet()
        .selector('node')
            .style({
                content: 'data(label)',
                'text-valign': 'center',
                'font-size': '20px',
                'font-family': 'sans-serif',
                'font-weight': 100,
                color: '#000',
                'background-color': '#fff',
                'border-color': '#333',
                'border-width': 1.2,
                shape: 'rectangle',
                'text-max-width': '1000px',
                'text-wrap': 'wrap',
                width: 'label',
                'padding-left': '9px',
                'padding-bottom': '9px',
                'padding-right': '9px',
                'padding-top': '9px',
                height: 'label',
            })
        .selector('edge')
            .css({
              'curve-style': 'bezier',
              'target-arrow-shape': 'triangle',
              'target-arrow-color': function(elt) { return scales(elt.data('label')); },
              'line-color': function(elt) { return scales(elt.data('label')); },
              'width':2
            })
//            .css({
//                'target-arrow-fill': '#333',
//                'target-arrow-shape': 'triangle',
//                'target-arrow-color': '#333',
//                'line-color': '#333',// function(elt) { return scales(elt.data('label')); },
//                width: 5,
//            });

    if( setup ) {
        nodes_cy = [];
        edges_cy = [];
        cy.destroy();
    }
    process_parents( cy, graph, term, 0 );
    process_parents_edges( cy, graph, term, 0 );


    cy = cytoscape({
        container: $('#cy'),
        style: stylesheet_cy,
        elements: {
            nodes: _.values(nodes_cy),
            edges: _.values(edges_cy),
        },
    });

    setup = true;



    cy.elements().qtip({
        content: function(arg) { return '<b>' + this.data('id') + '</b><br />' + this.data('label'); },
        position: {
            my: 'top center',
            at: 'bottom center',
        },
        style: {
            classes: 'qtip-bootstrap',
            'font-family': 'sans-serif',
            tip: {
                width: 16,
                height: 8,
            },
        },
    });

    // Manually crate and stop layout after timeout
    var layout_cy = cy.makeLayout({
        name: 'dagre',
        //rankDir: 'BT',
        padding: 50,
        randomize: true,
        animate: true,
        infinite: true,
        repulsion: 1,
    });

    layout_cy.run();
}

function download_and_setup_graph( term ) {
    var new_ontology;
    if( !term ) {
        alert('term null');
        return;
    }
    console.log('here');


    $.ajax({url: 'relationships.json', dataType: 'json'}).done(function(response) {
        console.log(response);
        console.log('hello');
        if( term.match(/^ECO:/) ) { new_ontology = 'evidence_ontology.json'; relationships = response.generic_relationships; }
        else if( term.match(/^GO:/) ) { new_ontology = 'gene_ontology.json'; relationships = response.go_relationships; }
        else if( term.match(/^SO:/) ) { new_ontology = 'sequence_ontology.json'; relationships = response.so_relationships; }
        else if( term.match(/^CHEBI:/) ) { new_ontology = 'chebi.json'; relationships = response.chebi_relationships; }
        else if( term.match(/^HP:/) ) { new_ontology = 'hp.json'; relationships = response.generic_relationships;  }
        else if( term.match(/^DOID:/) ) { new_ontology = 'disease_ontology.json'; relationships = response.generic_relationships;  }
        else if( term.match(/^PO:/) ) { new_ontology = 'plant_ontology.json'; relationships = response.po_relationships;  }
        else if( term.match(/^TO:/) ) { new_ontology = 'plant_trait.json'; relationships = response.to_relationships;  }
        else if( term.match(/^PATO:/) ) { new_ontology = 'pato.json'; relationships = response.pato_relationships;  }
        else if( term.match(/^CL:/) ) { new_ontology = 'cell_ontology.json'; relationships = response.generic_relationships;  }
        else if( term.match(/^ENVO:/) ) { new_ontology = 'envo-basic.json'; relationships = response.envo_relationships;  }
        $('#legend').empty();
        relationships.forEach( function(elt) {
            $('#legend').append('<div style=\'height: 12px; width: 50px; background: ' + scales(elt) + '\'></div><div>' + elt + '</div>');
        });
        if( !new_ontology ) {
            $('#loading').text('Error: ontology not found for ' + term);
        }  else if( new_ontology != ontology ) {
            ontology = new_ontology;
            $.ajax({url: ontology, dataType: 'json'}).done(function(response) {
                graph = response;
                process_graph( graph );
                if( setup ) {
                    $('#search').autocomplete({source: []});
                }
                $('#search').autocomplete({
                    source: Object.keys(terms),
                });


                setup_graph( graph, term );
                $('#loading').text('');
            });
        }  else {
            setup_graph( graph, term );
        }
    });
}
$( function() {
    cydagre( cytoscape, dagre ); // Register extension
    cyqtip( cytoscape, $ ); // Register extension

    // Check query params
    var param = utils.getParameterByName('term');
    if( param ) {
        $('#term').val( param );
    }
    var term = $('#term').val();
    download_and_setup_graph( term );

    $('#termform').submit(function() {
        var term = $('#term').val();
        window.history.replaceState( {}, '', '?term=' + term );
        download_and_setup_graph(term);
        return false;
    });

    $('#save_button').on('click', function(e) {
        $('#output').append($('<a/>').attr({href: cy.png({scale: 3})}).append('Download picture'));
    });


    $('#searchform').submit(function() {
        var search = $('#search').val();
        var term = terms[search];
        $('#term').val( term );
        window.history.replaceState( {}, '', '?term=' + term );
        download_and_setup_graph(term);
        return false;
    });
});
