set -e
set -u
set -v
[ -f go.obo ] || wget http://purl.obolibrary.org/obo/go.obo
[ -f evidence_ontology.obo ] || wget http://evidenceontology.googlecode.com/svn/trunk/evidence_ontology.obo
[ -f so-xp-simple.obo ] || wget https://raw.githubusercontent.com/The-Sequence-Ontology/SO-Ontologies/master/so-xp-simple.obo
[ -f chebi.obo ] || wget http://purl.obolibrary.org/obo/chebi.obo
[ -f hp.obo ] || wget http://purl.obolibrary.org/obo/hp.obo
[ -f doid.obo ] || wget http://www.berkeleybop.org/ontologies/doid.obo
[ -f po.obo ] || wget http://purl.obolibrary.org/obo/po.obo
[ -f pato.obo ] || wget http://purl.obolibrary.org/obo/pato.obo
[ -f to.obo ] || wget http://purl.obolibrary.org/obo/to.obo
[ -f cl-basic.obo ] || wget https://raw.githubusercontent.com/obophenotype/cell-ontology/master/cl-basic.obo


[ -f dist/gene_ontology.json ] || scripts/read-obo.pl go.obo > dist/gene_ontology.json
[ -f dist/evidence_ontology.json ] || scripts/read-obo.pl evidence_ontology.obo > dist/evidence_ontology.json
[ -f dist/sequence_ontology.json ] || scripts/read-obo.pl so-xp-simple.obo > dist/sequence_ontology.json
[ -f dist/chebi.json ] || scripts/read-obo.pl chebi.obo > dist/chebi.json
[ -f dist/hp.json ] || scripts/read-obo.pl hp.obo > dist/hp.json
[ -f dist/disease_ontology.json ] || scripts/read-obo.pl doid.obo > dist/disease_ontology.json
[ -f dist/plant_ontology.json ] || scripts/read-obo.pl po.obo > dist/plant_ontology.json
[ -f dist/pato.json ] || scripts/read-obo.pl pato.obo > dist/pato.json
[ -f dist/plant_trait.json ] || scripts/read-obo.pl to.obo > dist/plant_trait.json
[ -f dist/cell_ontology.json ] || scripts/read-obo.pl cl-basic.obo > dist/cell_ontology.json
