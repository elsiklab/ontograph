#!/bin/bash

set -e
set -u
set -v
[ -f obo_files/go.obo ] || wget -P obo_files http://purl.obolibrary.org/obo/go.obo
[ -f obo_files/evidence_ontology.obo ] || wget -P obo_files https://raw.githubusercontent.com/evidenceontology/evidenceontology/master/evidence_ontology.obo
[ -f obo_files/so-xp-simple.obo ] || wget -P obo_files https://raw.githubusercontent.com/The-Sequence-Ontology/SO-Ontologies/master/so-xp-simple.obo
[ -f obo_files/chebi.obo ] || wget -P obo_files http://purl.obolibrary.org/obo/chebi.obo
[ -f obo_files/hp.obo ] || wget -P obo_files http://purl.obolibrary.org/obo/hp.obo
[ -f obo_files/doid.obo ] || wget -P obo_files http://www.berkeleybop.org/ontologies/doid.obo
[ -f obo_files/po.obo ] || wget -P obo_files http://purl.obolibrary.org/obo/po.obo
[ -f obo_files/pato.obo ] || wget -P obo_files http://purl.obolibrary.org/obo/pato.obo
[ -f obo_files/to.obo ] || wget -P obo_files http://purl.obolibrary.org/obo/to.obo
[ -f obo_files/cl-basic.obo ] || wget -P obo_files https://raw.githubusercontent.com/obophenotype/cell-ontology/master/cl-basic.obo
[ -f obo_files/envo-basic.obo ] || wget -P obo_files https://raw.githubusercontent.com/EnvironmentOntology/envo/master/subsets/envo-basic.obo


[ -f dist/gene_ontology.json ] || scripts/read-obo.pl obo_files/go.obo > dist/gene_ontology.json
[ -f dist/evidence_ontology.json ] || scripts/read-obo.pl obo_files/evidence_ontology.obo > dist/evidence_ontology.json
[ -f dist/sequence_ontology.json ] || scripts/read-obo.pl obo_files/so-xp-simple.obo > dist/sequence_ontology.json
[ -f dist/chebi.json ] || scripts/read-obo.pl obo_files/chebi.obo > dist/chebi.json
[ -f dist/hp.json ] || scripts/read-obo.pl obo_files/hp.obo > dist/hp.json
[ -f dist/disease_ontology.json ] || scripts/read-obo.pl obo_files/doid.obo > dist/disease_ontology.json
[ -f dist/plant_ontology.json ] || scripts/read-obo.pl obo_files/po.obo > dist/plant_ontology.json
[ -f dist/pato.json ] || scripts/read-obo.pl obo_files/pato.obo > dist/pato.json
[ -f dist/plant_trait.json ] || scripts/read-obo.pl obo_files/to.obo > dist/plant_trait.json
[ -f dist/cell_ontology.json ] || scripts/read-obo.pl obo_files/cl-basic.obo > dist/cell_ontology.json
[ -f dist/envo-basic.json ] || scripts/read-obo.pl obo_files/envo-basic.obo > dist/envo-basic.json
