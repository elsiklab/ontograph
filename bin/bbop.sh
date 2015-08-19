set -e
set -u
set -v
cp bbopquery.html dist/
browserify bbopquery.js > dist/js/bbopquery.js
