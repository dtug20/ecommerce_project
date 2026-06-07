#!/usr/bin/env bash
# Build BaoCao_Shofy.md -> BaoCao_Shofy.docx (kèm render sơ đồ Mermaid thành ảnh).
# Yêu cầu: node, mmdc (@mermaid-js/mermaid-cli), pandoc, và Google Chrome.
set -euo pipefail
cd "$(dirname "$0")"

# Tìm Chrome (macOS / Linux phổ biến)
CHROME=""
for p in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "$(command -v google-chrome || true)" \
  "$(command -v chromium || true)"; do
  if [ -n "$p" ] && [ -x "$p" ]; then CHROME="$p"; break; fi
done

PPT_CFG="$(mktemp)"
if [ -n "$CHROME" ]; then
  printf '{ "executablePath": %s, "args": ["--no-sandbox"] }\n' "\"$CHROME\"" > "$PPT_CFG"
else
  printf '{ "args": ["--no-sandbox"] }\n' > "$PPT_CFG"   # dựa vào chrome của puppeteer nếu có
fi

echo "==> Tiền xử lý markdown + tách sơ đồ"
node build-docx.mjs

echo "==> Render sơ đồ Mermaid -> PNG"
fail=0
for f in diagrams/*.mmd; do
  [ -e "$f" ] || continue
  out="${f%.mmd}.png"
  echo "    $f -> $out"
  if ! mmdc -i "$f" -o "$out" -b white -s 2 -p "$PPT_CFG" >/dev/null 2>&1; then
    echo "    !! LỖI render $f (sơ đồ này sẽ thiếu ảnh) — kiểm tra cú pháp Mermaid"
    fail=$((fail+1))
  fi
done
[ "$fail" -gt 0 ] && echo "==> Cảnh báo: $fail sơ đồ render lỗi"

echo "==> Pandoc -> docx"
pandoc BaoCao_Shofy.build.md -o BaoCao_Shofy.docx \
  --resource-path=. \
  -V lang=vi

rm -f "$PPT_CFG"
echo "==> Hoàn tất: $(pwd)/BaoCao_Shofy.docx"
