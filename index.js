var cytoscape = require('cytoscape');
var cydagre = require('cytoscape-dagre');
var cyqtip = require('cytoscape-qtip');
var panzoom = require('cytoscape-panzoom');
var dagre = require('dagre');
var _ = require('underscore');
var utils = require('./js/util');
var chroma = require('chroma-js');


var depthLimit = 20;
var nodesCy = {};
var edgesCy = {};
var nodeScores = {};
var relationships = [];
var ontologyGraph;
var ontology;
var setup;
var cygraph;
var ontologyTerms;


var scales = (elt) => {
    var colorPalette = chroma.scale('Set1').colors(relationships.length);
    return elt === 'parents' ? '#333' : colorPalette[relationships.indexOf(elt) - 1];
};

function processGraph(graph) {
    ontologyTerms = {};
    _.keys(graph).forEach((key) => {
        var node = graph[key];
        ontologyTerms[node.description] = key;
    });
}

function processParents(cy, graph, term, depth) {
    var node = graph[term];
    if (!node) {
        return;
    }
    if (!nodesCy[term]) {
        nodesCy[term] = {
            data: {
                id: term,
                label: utils.explode(node.description, 22),
                score: -Math.log(nodeScores[term]) * 150,
                pval: nodeScores[term],
            },
        };
    }
    relationships.forEach((elt) => {
        var list = node[elt];
        if (list) {
            list.forEach((tangentialTerm) => {
                var tangentialNode = graph[tangentialTerm];
                if (!nodesCy[tangentialTerm]) {
                    nodesCy[tangentialTerm] = {
                        data: {
                            id: tangentialTerm,
                            label: utils.explode((tangentialNode || {}).description || tangentialTerm, 22),
                        },
                    };
                }
            });
        }
    });
    if (node.parents) {
        for (var i = 0; i < node.parents.length; i++) {
            if (depth < depthLimit) {
                processParents(cy, graph, node.parents[i], depth + 1);
            }
        }
    }
}


function processParentsEdges(cy, graph, term, depth) {
    var node = graph[term];
    if (!node) {
        return;
    }

    relationships.forEach((elt) => {
        if (node[elt]) {
            for (var i = 0; i < node[elt].length; i++) {
                var edgeName = `${term},${node[elt][i]}-${elt}`;
                if (!edgesCy[edgeName]) {
                    var target = node[elt][i];
                    var source = term;

                    edgesCy[edgeName] = {
                        data: {
                            label: elt,
                            id: edgeName,
                            target: target,
                            source: source,
                        },
                    };
                    if (depth < depthLimit && elt === 'parents') {
                        processParentsEdges(cy, graph, node[elt][i], depth + 1);
                    }
                }
            }
        }
    });
}

function setupGraph(graph, term) {
    var stylesheetCy = cytoscape.stylesheet()
        .selector('node')
            .style({
                content: 'data(label)',
                'text-valign': 'center',
                'background-color': (elt) => (elt.data('score') ? `hsl(${elt.data('score') / -Math.log(_.min(_.values(nodeScores)))}, 50%, 50%)` : '#fff'),
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
                'target-arrow-color': (elt) => scales(elt.data('label')),
                'line-color': (elt) => scales(elt.data('label')),
                width: 5,
            });

    if (setup) {
        nodesCy = {};
        edgesCy = {};
        cygraph.destroy();
    }

    if (_.isArray(term)) {
        _.each(term, (m) => {
            processParents(cygraph, graph, m, 0);
            processParentsEdges(cygraph, graph, m, 0);
        });
    } else {
        processParents(cygraph, graph, term, 0);
        processParentsEdges(cygraph, graph, term, 0);
    }
    cygraph = cytoscape({
        container: $('#cy'),
        style: stylesheetCy,
        elements: {
            nodes: _.values(nodesCy),
            edges: _.values(edgesCy),
        },
    });
    var defaults = {
        zoomFactor: 0.05,
        zoomDelay: 45,
        minZoom: 0.1,
        maxZoom: 10,
        fitPadding: 50,
        panSpeed: 10,
        panDistance: 10,
        panDragAreaSize: 75,
        panMinPercentSpeed: 0.25,
        panInactiveArea: 8,
        panIndicatorMinOpacity: 0.5,
        zoomOnly: false,
        fitSelector: undefined,
        animateOnFit: () => false,
        fitAnimationDuration: 1000,
        sliderHandleIcon: 'fa fa-minus',
        zoomInIcon: 'fa fa-plus',
        zoomOutIcon: 'fa fa-minus',
        resetIcon: 'fa fa-expand',
    };

    cygraph.panzoom(defaults);

    setup = true;

    cygraph.elements().qtip({
        content: function () { return `<b>${this.data('id')}</b><br />${this.data('label')}<br />${this.data('pval') ? `pval: ${this.data('pval')}` : ''}`; },
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
    var layoutCy = cygraph.makeLayout({
        name: 'dagre',
        rankDir: 'BT',
        padding: 50,
        randomize: true,
        animate: true,
        nodeSep: $('#nodesep').val(),
        edgeSep: $('#edgesep').val(),
        repulsion: 1,
    });

    layoutCy.run();
}

function downloadAndSetupGraph(term, pval) {
    var newOntology;
    var checkterm = term;
    if (!term) {
        return;
    }
    if (_.isArray(term)) {
        checkterm = term[0];
    }
    $('#loading').text('Loading...');


    $.ajax({ url: 'relationships.json', dataType: 'json' }).done((response) => {
        if (checkterm.match(/^ECO:/)) {
            newOntology = 'evidence_ontology.json'; relationships = response.generic_relationships;
        } else if (checkterm.match(/^GO:/)) {
            newOntology = 'gene_ontology.json'; relationships = response.go_relationships;
        } else if (checkterm.match(/^SO:/)) {
            newOntology = 'sequence_ontology.json'; relationships = response.so_relationships;
        } else if (checkterm.match(/^CHEBI:/)) {
            newOntology = 'chebi.json'; relationships = response.chebi_relationships;
        } else if (checkterm.match(/^HP:/)) {
            newOntology = 'hp.json'; relationships = response.generic_relationships;
        } else if (checkterm.match(/^DOID:/)) {
            newOntology = 'disease_ontology.json'; relationships = response.generic_relationships;
        } else if (checkterm.match(/^PO:/)) {
            newOntology = 'plant_ontology.json'; relationships = response.po_relationships;
        } else if (checkterm.match(/^TO:/)) {
            newOntology = 'plant_trait.json'; relationships = response.to_relationships;
        } else if (checkterm.match(/^PATO:/)) {
            newOntology = 'pato.json'; relationships = response.pato_relationships;
        } else if (checkterm.match(/^CL:/)) {
            newOntology = 'cell_ontology.json'; relationships = response.generic_relationships;
        } else if (checkterm.match(/^ENVO:/)) {
            newOntology = 'envo-basic.json'; relationships = response.envo_relationships;
        }
        $('#legend').empty();
        relationships.forEach((elt) => {
            $('#legend').append(`<div style='height: 12px; width: 50px; background: ${scales(elt)}'></div><div>${elt}</div>`);
        });
        if (!newOntology) {
            $('#loading').text(`Error: ontology not found for ${checkterm}`);
        } else if (newOntology !== ontology) {
            ontology = newOntology;
            $.ajax({ url: ontology, dataType: 'json' }).done((responseOntology) => {
                ontologyGraph = responseOntology;
                processGraph(ontologyGraph);
                if (setup) {
                    $('#search').autocomplete({ source: [] });
                }
                $('#search').autocomplete({
                    source: _.keys(ontologyTerms),
                });


                setupGraph(ontologyGraph, term, pval);
                $('#loading').text('');
            });
        } else {
            setupGraph(ontologyGraph, term);
            $('#loading').text('');
        }
    });
}

function setupEventHandlers() {
    // Event handlers
    $('#termform').submit(() => {
        var term = $('#term').val();
        window.history.replaceState({}, '', `?term=${term}`);
        downloadAndSetupGraph(term);
        return false;
    });

    $('#save_button').on('click', () => {
        $('#output').empty().append($('<a/>').attr({ href: cygraph.png({ scale: 5 }) }).append('Download picture'));
    });


    $('#searchform').submit(() => {
        var search = $('#search').val();
        var term = ontologyTerms[search];
        $('#term').val(term);
        window.history.replaceState({}, '', `?term=${term}`);
        downloadAndSetupGraph(term);
        return false;
    });

    $('#multi').submit(() => {
        var nodes = [];
        var pvals = [];
        $('#goterms')
            .val()
            .split('\n')
            .forEach((line) => {
                var matches = line.split(/\s+/);
                if (matches.length === 2) {
                    nodes.push(matches[0]);
                    pvals.push(matches[1]);
                    nodeScores[matches[0]] = parseFloat(matches[1]);
                }
            });
        window.history.replaceState({}, '', `?terms=${nodes.join(',')}&pvals=${pvals.join(',')}`);
        downloadAndSetupGraph(nodes, pvals);
        return false;
    });

    $('#edgesep,#nodesep').change(() => {
        cygraph.layout({
            name: 'dagre',
            rankDir: 'BT',
            padding: 50,
            randomize: true,
            animate: true,
            nodeSep: $('#nodesep').val(),
            edgeSep: $('#edgesep').val(),
        });
        return false;
    });
}

$(() => {
    cydagre(cytoscape, dagre);
    cyqtip(cytoscape, $);
    cydagre(cytoscape, dagre);
    panzoom(cytoscape, $);

    // Check query params
    var terms = utils.getParameterByName('terms');
    var pvals = utils.getParameterByName('pvals');
    var term = utils.getParameterByName('term');

    if (terms && pvals) {
        terms = terms.split(',');
        pvals = pvals.split(',');
        var str = '';
        if (terms.length === pvals.length) {
            for (var i = 0; i < terms.length; i++) {
                str += `${terms[i]}\t${pvals[i]}\n`;
                nodeScores[terms[i]] = parseFloat(pvals[i]);
            }
            $('#goterms').val(str);
        }
        downloadAndSetupGraph(terms, pvals);
    } else if (term) {
        $('#term').val(term);
        downloadAndSetupGraph(term);
    } else if ($('#term').val()) {
        downloadAndSetupGraph($('#term').val());
    }

    setupEventHandlers();
});
