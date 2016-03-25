set -e
set -u
set -v
[ -f go.obo ] || wget http://www.geneontology.org/ontology/go.obo
[ -f evidence_ontology.obo ] || wget http://evidenceontology.googlecode.com/svn/trunk/evidence_ontology.obo
[ -f so-xp-simple.obo ] || wget https://raw.githubusercontent.com/The-Sequence-Ontology/SO-Ontologies/master/so-xp-simple.obo
[ -f chebi.obo ] || wget ftp://ftp.ebi.ac.uk/pub/databases/chebi/ontology/chebi.obo
[ -f hp.obo ] || wget http://purl.obolibrary.org/obo/hp.obo

[ -f dist/gene_ontology.json ] || scripts/read-obo.pl go.obo > dist/gene_ontology.json
[ -f dist/evidence_ontology.json ] || scripts/read-obo.pl evidence_ontology.obo > dist/evidence_ontology.json
[ -f dist/sequence_ontology.json ] || scripts/read-obo.pl so-xp-simple.obo > dist/sequence_ontology.json
[ -f dist/chebi.json ] || scripts/read-obo.pl chebi.obo > dist/chebi.json
[ -f dist/hp.json ] || scripts/read-obo.pl hp.obo > dist/hp.json
