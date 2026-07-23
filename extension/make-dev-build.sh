#!/usr/bin/env bash
#
# Produce a LOCAL dev copy of the extension that talks to your dev server
# instead of production. The real extension/ folder stays clean, so the store
# zip can never accidentally ship a localhost URL.
#
#   ./make-dev-build.sh                      # -> http://localhost:3000
#   ./make-dev-build.sh http://localhost:3001
#
# Then:
#   1. npm run dev            (in the project root, serves the API locally)
#   2. chrome://extensions -> Developer mode -> Load unpacked -> pick extension-dev/
#   3. Test on chatgpt.com / gemini.google.com. Reload the unpacked extension
#      after any edit; re-run this script if you changed extension/ files.
#
# The dev build is named "... (DEV)" so you can tell it apart from a store
# install, and extension-dev/ is gitignored.

set -euo pipefail
BASE="${1:-http://localhost:3000}"
SRC="$(cd "$(dirname "$0")" && pwd)"
OUT="$SRC/../extension-dev"

rm -rf "$OUT"
mkdir -p "$OUT"
cp -R "$SRC"/manifest.json "$SRC"/content.js "$SRC"/panel.js "$SRC"/background.js \
      "$SRC"/popup.html "$SRC"/popup.js "$SRC"/icons "$OUT"/

# Point the service worker at the local server.
sed -i '' "s#const API_BASE = 'https://deepclario.com'#const API_BASE = '$BASE'#" "$OUT/background.js"

# The MV3 worker needs host permission for the local origin, and a (DEV) name.
node -e "
const f = '$OUT/manifest.json';
const m = require(f);
m.name = m.name.replace(/ \(DEV\)\$/, '') + ' (DEV)';
m.host_permissions = Array.from(new Set([...(m.host_permissions || []), '$BASE/*']));
require('fs').writeFileSync(f, JSON.stringify(m, null, 2) + '\n');
"

echo "Dev build ready: $OUT"
echo "  API_BASE = $BASE"
echo "  Load extension-dev/ unpacked, and run 'npm run dev' in the project root."
