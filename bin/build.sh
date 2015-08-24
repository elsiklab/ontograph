set -e
set -u
set -v
rm -rf dist
mkdir -p dist/js
mkdir -p dist/css
cp index.html dist/
cp reversed.html dist/
cp children.html dist/
cp tipsy.css dist/css/
cp tipsy.js dist/js/
cp jquery-1.11.3.js dist/js/
cp custom.css dist/css/
[ -f go.obo ] || wget http://www.geneontology.org/ontology/go.obo
[ -f gene_ontology.json ] || perl scripts/read-obo.pl go.obo > gene_ontology.json
cp gene_ontology.json dist/
browserify index.js | uglifyjs > dist/js/index.js
browserify reversed.js | uglifyjs > dist/js/reversed.js
browserify children.js | uglifyjs > dist/js/children.js
