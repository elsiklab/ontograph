set -e
set -u
set -v
gulp
[ -f go.obo ] || wget http://www.geneontology.org/ontology/go.obo
[ -f gene_ontology.json ] || perl scripts/read-obo.pl go.obo > gene_ontology.json
cp gene_ontology.json dist/
