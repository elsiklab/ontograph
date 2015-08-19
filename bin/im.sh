set -e
set -u
set -v
cp imquery.html dist/
browserify imquery.js > dist/js/imquery.js
