import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const HWPX_DIRS = [
  { dir: "1.지도안(틀)", out: "01-lesson-plan-template.md", title: "지도안 설계 틀" },
  { dir: "2. 실험반 지도안", out: "02-experiment-class-lesson-plan.md", title: "실험반 지도안 (용해와 용액 1차시 예시)" },
  { dir: "3. 실험반 활동지", out: "03-experiment-class-worksheet.md", title: "실험반 활동지 (차시별 웹앱·글쓰기 맥락)" },
  { dir: "4. 사고 도구 활동지", out: "04-thinking-tool-worksheet.md", title: "사고 도구 활동지 (부록)" },
];

function extractParagraphs(xml) {
  const paragraphs = [];
  const pRe = /<hp:p[^>]*>([\s\S]*?)<\/hp:p>/g;
  let pm;
  while ((pm = pRe.exec(xml)) !== null) {
    const tRe = /<hp:t[^>]*>([^<]*)<\/hp:t>/g;
    let tm;
    let line = "";
    while ((tm = tRe.exec(pm[1])) !== null) {
      line += tm[1];
    }
    const trimmed = line.replace(/\u0000/g, "").trim();
    if (trimmed) paragraphs.push(trimmed);
  }
  return paragraphs;
}

function toMarkdown(title, paragraphs, sourceFile) {
  const lines = [
    `# ${title}`,
    "",
    `> 원본: \`${sourceFile}\` (한글 hwpx에서 자동 변환)`,
    "",
  ];
  for (const p of paragraphs) {
    if (/^<[^>]+>$/.test(p) || p.startsWith("<") && p.endsWith(">")) continue;
    if (p.length < 80 && !p.includes(".") && !p.includes("?") && !p.includes("。")) {
      lines.push(`## ${p.replace(/^<|>$/g, "")}`);
      lines.push("");
    } else {
      lines.push(p);
      lines.push("");
    }
  }
  return lines.join("\n");
}

const outDir = path.join(ROOT, "docs", "templates");
fs.mkdirSync(outDir, { recursive: true });

for (const { dir, out, title } of HWPX_DIRS) {
  const contentsDir = path.join(ROOT, "tmp-hwpx", dir, "Contents");
  const paragraphs = [];
  if (fs.existsSync(contentsDir)) {
    for (const file of fs.readdirSync(contentsDir).filter((f) => f.endsWith(".xml")).sort()) {
      const xml = fs.readFileSync(path.join(contentsDir, file), "utf8");
      paragraphs.push(...extractParagraphs(xml));
    }
  }
  const md = toMarkdown(title, paragraphs, `${dir}.hwpx`);
  fs.writeFileSync(path.join(outDir, out), md, "utf8");
  console.log(`Wrote ${out} (${paragraphs.length} paragraphs)`);
}
