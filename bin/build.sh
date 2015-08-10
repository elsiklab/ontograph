set -e
set -u
set -v
rm -rf dist
mkdir -p dist/js
mkdir -p dist/css
cp index.html dist/
[ -f go.obo ] || wget http://www.geneontology.org/ontology/go.obo
[ -f gene_ontology.json ] || perl scripts/read-obo.pl go.obo > gene_ontology.json
browserify index.js | uglifyjs > dist/js/index.js
