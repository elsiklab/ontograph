set -e
set -u
set -v
rm -rf dist
mkdir -p dist/js
mkdir -p dist/css
cp index.html dist/
cp tipsy.css dist/css/
cp jquery.tipsy.js dist/js/
browserify index.js > dist/js/index.js
