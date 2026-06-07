#!/usr/bin/env node
/*
 * Tiền xử lý BaoCao_Shofy.md trước khi pandoc -> docx:
 *  1. Tách mỗi khối ```mermaid``` ra file diagrams/figNN.mmd và thay bằng ![](diagrams/figNN.png)
 *  2. Đổi <div ... page-break ...> thành ngắt trang OpenXML (Word hiểu được)
 *  3. Bỏ khối chú thích HTML <!-- ... --> ở đầu file
 * Xuất ra: BaoCao_Shofy.build.md
 *
 * Dùng: node build-docx.mjs  (sau đó render .mmd -> .png rồi pandoc; xem build-docx.sh)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const src = join(__dir, "BaoCao_Shofy.md");
const out = join(__dir, "BaoCao_Shofy.build.md");
const diagramsDir = join(__dir, "diagrams");
mkdirSync(diagramsDir, { recursive: true });

let md = readFileSync(src, "utf8");

// 1) Bỏ comment HTML mở đầu (hướng dẫn nội bộ)
md = md.replace(/^<!--[\s\S]*?-->\s*/, "");

// 2) Ngắt trang Word
const pageBreak = '\n```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```\n';
md = md.replace(/<div[^>]*page-break-after[^>]*><\/div>/g, pageBreak);

// 3) Tách mermaid -> file .mmd + thay bằng ảnh
let n = 0;
const mmds = [];
md = md.replace(/```mermaid\s*\n([\s\S]*?)```/g, (_m, code) => {
  n += 1;
  const id = String(n).padStart(2, "0");
  const mmdPath = join(diagramsDir, `fig${id}.mmd`);
  writeFileSync(mmdPath, code.trim() + "\n", "utf8");
  mmds.push(`fig${id}`);
  return `![](diagrams/fig${id}.png)`;
});

writeFileSync(out, md, "utf8");
console.log(`OK: ${n} sơ đồ -> ${diagramsDir}`);
console.log(mmds.join(" "));
