var dagre = require('dagre');
var cytoscape = require('cytoscape');
var cydagre = require('cytoscape-dagre');
var cyqtip = require('cytoscape-qtip');
var cycola = require('cytoscape-cola');
var cycose = require('cytoscape-cose-bilkent');
var cyarbor = require('cytoscape-arbor');
var cydagre = require('cytoscape-dagre');
var cyspringy = require('cytoscape-springy');
var cyspread = require('cytoscape-spread');
var springy = require('springy');


var _ = require('underscore');
var utils = require('./js/util.js');
var chroma = require('chroma-js');


var depth_limit = 20;
var nodes_cy = {};
var edges_cy = {};
var node_scores = {};
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

function process_parents( cy, graph, term, depth, score ) {
    var node = graph[ term ];
    if( !node ) {
        return;
    }
    if( !nodes_cy[term] ) {
        nodes_cy[term] = {
            data: {
                id: term,
                label: utils.explode(node.description, 22),
                score: -Math.log(node_scores[term]),
                pval: node_scores[term],
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
                            id: edge_name,
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
                'background-color': function(elt) {
                    var maxval = -Math.log(_.min(_.values(node_scores)));
                    return elt.data('score') ? 'hsl(' + elt.data('score') * 150 / maxval + ',50%,50%)' : '#fff';
                },
                'border-color': '#333',
                'border-width': 5,
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
                'target-arrow-fill': '#333',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'target-arrow-color': function(elt) { return scales(elt.data('label')); },
                'line-color': function(elt) { return scales(elt.data('label')); },
                width: 5,
            });

    if( setup ) {
        nodes_cy = {};
        edges_cy = {};
        cy.destroy();
    }

    if(_.isArray(term)) {
        _.each(term, function(m) {
            process_parents( cy, graph, m, 0 );
            process_parents_edges( cy, graph, m, 0 );
        });
    }
    else {
        process_parents( cy, graph, term, 0 );
        process_parents_edges( cy, graph, term, 0 );
    }





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
        content: function(arg) {
            return (
                    this.data('id').match(/^GO:/) ?
                        '<b><a href="http://amigo.geneontology.org/amigo/term/' + this.data('id') + '">' + this.data('id') + '</a></b>' :
                        '<b>' + this.data('id') + '</b>'
                ) +
                '<br />' +
                this.data('label') +
                (
                    this.data('pval') ?
                        '<br />P-val: ' + this.data('pval') :
                        ''
                );
        },
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
    var layout = $('#layout option:selected').text();
    var layout_cy = cy.makeLayout({
        name: layout.trim(),
        rankDir: 'BT',
        edgeJaccardLength: 100 * Math.pow(_.size(nodes_cy) / 90, 1.1),
        padding: 50,
        randomize: true,
        animate: true,
        repulsion: 1,
    });

    layout_cy.run();
}



function download_and_setup_graph( term, pval ) {
    var new_ontology;
    var checkterm = term;
    if( !term ) {
        alert('term null');
        return;
    }
    if(_.isArray(term)) {
        checkterm = term[0];
    }
    $('#loading').text('Loading...');


    $.ajax({url: 'relationships.json', dataType: 'json'}).done(function(response) {
        if( checkterm.match(/^ECO:/) ) { new_ontology = 'evidence_ontology.json'; relationships = response.generic_relationships; }
        else if( checkterm.match(/^GO:/) ) { new_ontology = 'gene_ontology.json'; relationships = response.go_relationships; }
        else if( checkterm.match(/^SO:/) ) { new_ontology = 'sequence_ontology.json'; relationships = response.so_relationships; }
        else if( checkterm.match(/^CHEBI:/) ) { new_ontology = 'chebi.json'; relationships = response.chebi_relationships; }
        else if( checkterm.match(/^HP:/) ) { new_ontology = 'hp.json'; relationships = response.generic_relationships;  }
        else if( checkterm.match(/^DOID:/) ) { new_ontology = 'disease_ontology.json'; relationships = response.generic_relationships;  }
        else if( checkterm.match(/^PO:/) ) { new_ontology = 'plant_ontology.json'; relationships = response.po_relationships;  }
        else if( checkterm.match(/^TO:/) ) { new_ontology = 'plant_trait.json'; relationships = response.to_relationships;  }
        else if( checkterm.match(/^PATO:/) ) { new_ontology = 'pato.json'; relationships = response.pato_relationships;  }
        else if( checkterm.match(/^CL:/) ) { new_ontology = 'cell_ontology.json'; relationships = response.generic_relationships;  }
        else if( checkterm.match(/^ENVO:/) ) { new_ontology = 'envo-basic.json'; relationships = response.envo_relationships;  }
        $('#legend').empty();
        relationships.forEach( function(elt) {
            $('#legend').append('<div style=\'height: 12px; width: 50px; background: ' + scales(elt) + '\'></div><div>' + elt + '</div>');
        });
        if( !new_ontology ) {
            $('#loading').text('Error: ontology not found for ' + checkterm);
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


                setup_graph( graph, term, pval );
                $('#loading').text('');
            });
        }  else {
            setup_graph( graph, term );
            $('#loading').text('');
        }
    });
}

function setup_event_handlers() {

    // Event handlers
    $('#termform').submit(function() {
        var term = $('#term').val();
        window.history.replaceState( {}, '', '?term=' + term );
        download_and_setup_graph(term);
        return false;
    });

    $('#save_button').on('click', function(e) {
        $('#output').append($('<a/>').attr({href: cy.png({scale: 5})}).append('Download picture'));
    });


    $('#searchform').submit(function() {
        var search = $('#search').val();
        var term = terms[search];
        $('#term').val(term);
        window.history.replaceState( {}, '', '?term=' + term );
        download_and_setup_graph(term);
        return false;
    });

    $('#layout_form').submit(function(evt) {
        if($('#goterms').val() != '') {
            $('#multi').submit();
        } else {
            $('#termform').submit();
        }
        return false;
    });

    $('#multi').submit(function(evt) {
        var nodes = [];
        var pvals = [];
        $('#goterms').val().split('\n').forEach(function(line) {
            var matches = line.split('\t');
            if(matches.length == 2) {
                nodes.push(matches[0]);
                pvals.push(matches[1]);
                node_scores[matches[0]] = parseFloat(matches[1]);
            }
            else {
                var matches = line.split(' ');
                if(matches.length == 2) {
                    nodes.push(matches[0]);
                    pvals.push(matches[1]);
                    node_scores[matches[0]] = parseFloat(matches[1]);
                }
            }
        });
        window.history.replaceState( {}, '', '?terms=' + nodes.join(',') + '&pvals=' + pvals.join(',') );
        download_and_setup_graph(nodes, pvals);
        return false;
    });
}

$( function() {
    cydagre( cytoscape, dagre );
    cyqtip( cytoscape, $ );
    cycola( cytoscape, cola );
    cydagre( cytoscape, dagre );
    cyspringy( cytoscape, springy );
    cyarbor( cytoscape, arbor );
    cyspread( cytoscape );
    cycose( cytoscape );

    // Check query params
    var terms = utils.getParameterByName('terms');
    var pvals = utils.getParameterByName('pvals');
    var term = utils.getParameterByName('term');

    if( terms && pvals ) {
        var terms = terms.split(',');
        var pvals = pvals.split(',');
        var str = '';
        if( terms.length == pvals.length ) {
            for(var i = 0; i < terms.length; i++) {
                str += terms[i] + '\t' + pvals[i] + '\n';
                node_scores[terms[i]] = parseFloat(pvals[i]);
            }
            $('#goterms').val(str);
        }
        download_and_setup_graph( terms, pvals );
    } else if( term ) {
        $('#term').val(term);
        download_and_setup_graph( term );
    }

    setup_event_handlers();
});


