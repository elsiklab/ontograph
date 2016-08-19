# Ontograph

[![Build Status](https://travis-ci.org/cmdcolin/ontograph.svg?branch=master)](https://travis-ci.org/cmdcolin/ontograph)


An ontology based DAG graph using cytoscape.js and the dagre layout, inspired by BioJS DAGViewer


## Installation

Build

    gulp

Build watch

    gulp watch

Build debug

    gulp devmode

Build watch debug

    gulp watchdev


Build ontologies

    bin/build.sh

Note: The debug mode is currently required for cose-bilkent

## Demo

A demo is deployed live at http://elsiklab.github.io/ontograph/

## Perltidy

Perl::Tidy is used experimentally for code style

    perltidy -pro=.perltidyrc scripts/read-obo.pl
