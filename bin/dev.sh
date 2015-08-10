set -e
set -u
set -v
rm -rf dist
mkdir -p dist/js
mkdir -p dist/css
cp index.html dist/
browserify index.js > dist/js/index.js
