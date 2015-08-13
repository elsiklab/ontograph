set -e
set -u
set -v
rm -rf dist
mkdir -p dist/js
mkdir -p dist/css
cp index.html dist/
cp tipsy.css dist/css/
cp tipsy.js dist/js/
[ -f go.obo ] || wget http://www.geneontology.org/ontology/go.obo
[ -f gene_ontology.json ] || perl scripts/read-obo.pl go.obo > gene_ontology.json
cp gene_ontology.json dist/
browserify index.js | uglifyjs > dist/js/index.js
