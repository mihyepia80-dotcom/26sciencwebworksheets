/**
 * hwpx(한글) → Markdown 변환
 * - 프로젝트 루트의 *.hwpx 자동 탐색·압축 해제
 * - XML 표(hp:tbl) 구조 파싱 + Preview/PrvText.txt 보조
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs", "templates");
const EXTRACT_DIR = path.join(ROOT, ".hwpx-extract");

const OUTPUT_MAP = [
  { pattern: /지도안\s*\(\s*틀\s*\)|1\.지도안/i, out: "01-lesson-plan-template.md", title: "지도안 설계 틀" },
  { pattern: /실험반\s*지도안|2\.\s*실험반/i, out: "02-experiment-class-lesson-plan.md", title: "실험반 지도안" },
  { pattern: /실험반\s*활동지|3\.\s*실험반/i, out: "03-experiment-class-worksheet.md", title: "실험반 활동지" },
  { pattern: /사고\s*도구\s*활동지|4\.\s*사고/i, out: "04-thinking-tool-worksheet.md", title: "사고 도구 활동지" },
];

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function normalizeText(s) {
  return decodeHtml(s)
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cellText(tcXml) {
  const parts = [];
  const re = /<hp:t[^>]*>([^<]*)<\/hp:t>/g;
  let m;
  while ((m = re.exec(tcXml)) !== null) {
    parts.push(m[1]);
  }
  return normalizeText(parts.join("\n"));
}

function extractTables(xml) {
  const tables = [];
  const tblRe = /<hp:tbl[^>]*rowCnt="(\d+)"[^>]*colCnt="(\d+)"[^>]*>([\s\S]*?)<\/hp:tbl>/g;
  let tm;
  while ((tm = tblRe.exec(xml)) !== null) {
    const rows = [];
    const trRe = /<hp:tr>([\s\S]*?)<\/hp:tr>/g;
    let trm;
    while ((trm = trRe.exec(tm[3])) !== null) {
      const cells = [];
      const tcRe = /<hp:tc[^>]*>([\s\S]*?)<\/hp:tc>/g;
      let tcm;
      while ((tcm = tcRe.exec(trm[1])) !== null) {
        cells.push(cellText(tcm[1]));
      }
      if (cells.some((c) => c)) rows.push(cells);
    }
    if (rows.length > 0) tables.push({ rowCnt: Number(tm[1]), colCnt: Number(tm[2]), rows });
  }
  return tables;
}

function extractParagraphs(xml) {
  const paragraphs = [];
  const pRe = /<hp:p[^>]*>([\s\S]*?)<\/hp:p>/g;
  let pm;
  while ((pm = pRe.exec(xml)) !== null) {
    const text = cellText(pm[1]);
    if (text) paragraphs.push(text);
  }
  return paragraphs;
}

/** PrvText: <라벨><값><라벨><값> … */
function parsePrvTextLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed === "<>") return null;
  const inner = trimmed.replace(/^</, "").replace(/>$/, "");
  const parts = inner.split("><").map((p) => p.trim());
  const pairs = [];
  for (let i = 0; i < parts.length; i += 2) {
    const label = parts[i] ?? "";
    const value = parts[i + 1] ?? "";
    if (label) pairs.push({ label, value });
  }
  return pairs.length ? pairs : null;
}

function parsePrvText(content) {
  const blocks = [];
  let currentTitle = "";
  let currentPairs = [];

  const flush = () => {
    if (currentPairs.length) {
      blocks.push({ title: currentTitle, pairs: [...currentPairs] });
      currentPairs = [];
    }
  };

  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t === "<>") {
      flush();
      continue;
    }
    if (!t.startsWith("<") && !t.includes("><")) {
      flush();
      currentTitle = t;
      continue;
    }
    const pairs = parsePrvTextLine(t);
    if (pairs) currentPairs.push(...pairs);
  }
  flush();
  return blocks;
}

/** 활동지 표(6행 내외) → 필드 맵 */
function worksheetTableToFields(rows) {
  const fields = {};
  for (const row of rows) {
    const cells = row.filter((c) => c.length > 0);
    if (cells.length === 0) continue;

    if (cells.length >= 4 && /단원/.test(cells[0])) {
      fields["단원"] = cells[1];
      if (/학습\s*주제|학습주제/.test(cells[2])) fields["학습 주제"] = cells[3];
      continue;
    }
    if (cells.length >= 2 && /사고\s*도구|사고도구/.test(cells[0])) {
      fields["사고도구"] = cells[1];
      if (cells[2] === "학반" && cells[3]) fields["학반"] = cells[3];
      continue;
    }
    if (cells[0] === "템플릿") {
      if (cells[1] === "차시" && cells[2]) {
        fields["차시"] = cells[2];
      } else {
        if (cells[1] && cells[1] !== "차시") fields["템플릿"] = cells[1];
        const ci = cells.findIndex((c, i) => i > 0 && c === "차시");
        if (ci >= 0 && cells[ci + 1]) fields["차시"] = cells[ci + 1];
      }
      continue;
    }
    if (cells.length === 1) {
      const key = cells[0];
      fields[key] = fields[key] ?? "";
      continue;
    }
    if (cells.length >= 2) {
      fields[cells[0]] = cells.slice(1).join(" ").trim();
    }
  }
  return fields;
}

function fieldsToMarkdown(fields) {
  const order = [
    "단원", "학습 주제", "차시", "사고도구", "템플릿", "학반", "주제",
    "탐구질문", "글쓰기 상황", "웹앱화면", "화면구성", "활용팁", "프로그램",
  ];
  const lines = [];
  const used = new Set();
  for (const key of order) {
    if (key in fields) {
      lines.push(fields[key] ? `- **${key}**: ${fields[key]}` : `- **${key}**: _(작성란)_`);
      used.add(key);
    }
  }
  for (const [key, value] of Object.entries(fields)) {
    if (used.has(key)) continue;
    lines.push(value ? `- **${key}**: ${value}` : `- **${key}**: _(작성란)_`);
  }
  return lines.join("\n");
}

function worksheetSectionTitle(fields) {
  const tool = fields["사고도구"] ?? fields["사고 도구"];
  const period = fields["차시"];
  if (tool && period) return `## ${tool} (${period})`;
  if (tool) return `## ${tool}`;
  if (period) return `## ${period}차시`;
  return "## 활동지";
}

function extractPeriodFromMeta(keyValues) {
  for (const { value } of keyValues) {
    const m = value.match(/(\d+\s*~\s*\d+\/\d+|\d+\/\d+)/);
    if (m) return m[1].replace(/\s/g, "");
  }
  return null;
}

function escapeMdCell(s) {
  return (s ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function tableToMarkdown(rows, maxCols) {
  if (!rows.length) return "";
  const colCount = Math.min(maxCols ?? Math.max(...rows.map((r) => r.length)), 8);
  const trimmed = rows.map((r) => {
    const row = r.slice(0, colCount);
    while (row.length < colCount) row.push("");
    return row;
  });
  const lines = [];
  const header = trimmed[0].map(escapeMdCell);
  lines.push(`| ${header.join(" | ")} |`);
  lines.push(`| ${header.map(() => "---").join(" | ")} |`);
  for (let i = 1; i < trimmed.length; i++) {
    lines.push(`| ${trimmed[i].map(escapeMdCell).join(" | ")} |`);
  }
  return lines.join("\n");
}

function pairsToMarkdown(pairs) {
  const lines = [];
  for (const { label, value } of pairs) {
    if (!label) continue;
    if (value) {
      lines.push(`- **${label}**: ${value}`);
    } else {
      lines.push(`- **${label}**: _(작성란)_`);
    }
  }
  return lines.join("\n");
}

function findHwpxFiles() {
  return fs
    .readdirSync(ROOT)
    .filter((f) => f.toLowerCase().endsWith(".hwpx"))
    .map((f) => path.join(ROOT, f));
}

function matchOutput(hwpxPath) {
  const name = path.basename(hwpxPath);
  for (const entry of OUTPUT_MAP) {
    if (entry.pattern.test(name)) return entry;
  }
  return null;
}

function extractHwpx(hwpxPath) {
  const base = path.basename(hwpxPath, ".hwpx");
  const dest = path.join(EXTRACT_DIR, base);
  fs.mkdirSync(dest, { recursive: true });
  const zipPath = path.join(EXTRACT_DIR, `${base}.zip`);
  fs.copyFileSync(hwpxPath, zipPath);
  try {
    if (process.platform === "win32") {
      execSync(
        `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force"`,
        { stdio: "pipe" },
      );
    } else {
      execSync(`unzip -o -q "${zipPath}" -d "${dest}"`, { stdio: "pipe" });
    }
  } catch (e) {
    throw new Error(`압축 해제 실패: ${base} — ${e.message}`);
  }
  return dest;
}

function readSectionXml(extractPath) {
  const contentsDir = path.join(extractPath, "Contents");
  if (!fs.existsSync(contentsDir)) return "";
  return fs
    .readdirSync(contentsDir)
    .filter((f) => f.endsWith(".xml"))
    .sort()
    .map((f) => fs.readFileSync(path.join(contentsDir, f), "utf8"))
    .join("\n");
}

function readPrvText(extractPath) {
  const p = path.join(extractPath, "Preview", "PrvText.txt");
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

/** 지도안 표: 첫 행이 메타, 이후 교수학습 과정·평가 */
function renderLessonPlanMd(title, sourceFile, tables, prvBlocks, paragraphs) {
  const lines = [
    `# ${title}`,
    "",
    `> 원본: \`${path.basename(sourceFile)}\` · hwpx → Markdown 자동 변환`,
    "",
  ];

  if (tables.length > 0) {
    tables.forEach((tbl, idx) => {
      const nonEmpty = tbl.rows.filter((r) => r.some((c) => c.length > 2));
      if (nonEmpty.length === 0) return;

      const compact = compressLessonTable(nonEmpty);
      const period = extractPeriodFromMeta(compact.keyValues);
      if (period) {
        lines.push(`## [실험반] ${period}차시`);
      } else if (/실험반|글쓰기 수업/.test(firstCell)) {
        lines.push(`## ${firstCell}`);
      } else {
        lines.push(`## 차시별 지도안 ${idx + 1}`);
      }
      lines.push("");
      if (compact.keyValues.length) {
        lines.push("### 기본 정보");
        lines.push("");
        lines.push(pairsToMarkdown(compact.keyValues));
        lines.push("");
      }
      if (compact.processRows.length) {
        lines.push("### 교수·학습 과정");
        lines.push("");
        lines.push(tableToMarkdown(compact.processRows, 4));
        lines.push("");
      }
      if (compact.evalRows.length) {
        lines.push("### 평가계획");
        lines.push("");
        lines.push(tableToMarkdown(compact.evalRows, 5));
        lines.push("");
      }
      if (!compact.keyValues.length && !compact.processRows.length && !compact.evalRows.length) {
        lines.push(tableToMarkdown(nonEmpty.slice(0, 25), 6));
        lines.push("");
      }
    });
  }

  if (lines.length <= 4 && prvBlocks.length) {
    lines.push("## 문서 미리보기 추출");
    lines.push("");
    for (const block of prvBlocks) {
      if (block.title) {
        lines.push(`### ${block.title}`);
        lines.push("");
      }
      lines.push(pairsToMarkdown(block.pairs));
      lines.push("");
    }
  }

  if (lines.length <= 4 && paragraphs.length) {
    lines.push("## 본문");
    lines.push("");
    for (const p of paragraphs.slice(0, 200)) {
      lines.push(p);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function compressLessonTable(rows) {
  const keyValues = [];
  const processRows = [];
  const evalRows = [];
  let section = "meta";

  const knownLabels = new Set([
    "단원", "차시", "교수학습모형", "핵심아이디어", "학습주제", "성취기준", "학습목표",
    "탐구 질문", "사고 도구", "탐구질문", "범주", "지식·이해", "과정·기능", "가치·태도",
    "내용 요소", "글쓰기", "사고 과정과 관점", "템플릿", "학습 주제", "학습주제",
  ]);

  for (const row of rows) {
    const joined = row.join(" ");
    if (/교\s*수\s*·\s*학\s*습|학습과정|단계\s*\(/.test(joined)) {
      section = "process";
      processRows.push(row.filter(Boolean).length ? row : null);
      continue;
    }
    if (/평가\s*방법|평가\s*기준|피드백\s*지도|\[지식·이해\]|\[과정·기능\]|\[가치·태도\]/.test(joined)) {
      section = "eval";
      evalRows.push(row);
      continue;
    }

    if (row.length === 2 && row[0] && row[1]) {
      keyValues.push({ label: row[0], value: row[1] });
    } else if (row.length >= 2) {
      const label = row[0];
      const value = row.slice(1).filter(Boolean).join(" / ");
      if (label && (knownLabels.has(label.replace(/\s/g, "")) || knownLabels.has(label) || value.length > 3)) {
        keyValues.push({ label, value });
      } else if (section === "process") {
        processRows.push(row);
      } else if (section === "eval") {
        evalRows.push(row);
      }
    } else if (row.length === 1 && row[0].length > 1) {
      if (section === "process") processRows.push([row[0], "", "", ""]);
      else keyValues.push({ label: row[0], value: "" });
    }
  }

  return {
    keyValues: dedupePairs(keyValues),
    processRows: processRows.filter(Boolean).slice(0, 30),
    evalRows: evalRows.slice(0, 20),
  };
}

function dedupePairs(pairs) {
  const seen = new Set();
  return pairs.filter(({ label, value }) => {
    const key = `${label}::${value}`;
    if (seen.has(key) || !label) return false;
    seen.add(key);
    return true;
  });
}

function renderWorksheetMd(title, sourceFile, prvBlocks, tables) {
  const lines = [
    `# ${title}`,
    "",
    `> 원본: \`${path.basename(sourceFile)}\` · hwpx → Markdown 자동 변환`,
    "",
  ];

  const worksheetTables = tables.filter((rows) =>
    rows.some((r) => r.join(" ").match(/단원|사고\s*도구|사고도구|탐구질문|글쓰기\s*상황/)),
  );

  if (worksheetTables.length > 0) {
    worksheetTables.forEach((rows, i) => {
      const fields = worksheetTableToFields(rows);
      if (Object.keys(fields).length === 0) return;
      lines.push(worksheetSectionTitle(fields));
      lines.push("");
      lines.push(fieldsToMarkdown(fields));
      lines.push("");
      if (i < worksheetTables.length - 1) {
        lines.push("---");
        lines.push("");
      }
    });
    return lines.join("\n");
  }

  if (prvBlocks.length) {
    for (const block of prvBlocks) {
      const fields = Object.fromEntries(block.pairs.map((p) => [p.label, p.value]));
      lines.push(worksheetSectionTitle(fields));
      lines.push("");
      lines.push(fieldsToMarkdown(fields));
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}

function renderTemplateMd(title, sourceFile, tables, prvBlocks) {
  const lines = [
    `# ${title}`,
    "",
    `> 원본: \`${path.basename(sourceFile)}\` · hwpx → Markdown 자동 변환`,
    "",
    "개념기반 탐구수업 **사고촉진 전략 글쓰기 수업 설계** 양식입니다.",
    "",
  ];

  if (tables.length > 0) {
    const rows = Array.isArray(tables[0].rows) ? tables[0].rows : tables[0];
    lines.push("## 설계 항목");
    lines.push("");
    lines.push(tableToMarkdown(rows.slice(0, 30), 4));
    lines.push("");
  }

  if (prvBlocks.length) {
    lines.push("## 항목 목록");
    lines.push("");
    for (const block of prvBlocks) {
      lines.push(pairsToMarkdown(block.pairs));
      lines.push("");
    }
  }

  lines.push(
    "## 작성 안내",
    "",
    "1. **탐구 단계** — 질문·탐구·일반화·전이·성찰 중 해당 차시 1개 선택",
    "2. **사고 도구** — 주 1개, 성찰 단계 추가 시 1개 더",
    "3. **교수·학습 과정** — 생각 만들기(5분) / 생각 모으기(30분) / 표현하기(5분)",
    "4. **평가계획** — 지식·이해 / 과정·기능 / 가치·태도",
    "",
  );

  return lines.join("\n");
}

function convertFile(hwpxPath, entry) {
  console.log(`변환 중: ${path.basename(hwpxPath)}`);
  const extractPath = extractHwpx(hwpxPath);
  const xml = readSectionXml(extractPath);
  const tables = xml ? extractTables(xml) : [];
  const paragraphs = xml ? extractParagraphs(xml) : [];
  const prvBlocks = parsePrvText(readPrvText(extractPath));

  let md;
  const tableRows = tables.map((t) => t.rows ?? t);
  if (entry.out.startsWith("01")) {
    md = renderTemplateMd(entry.title, hwpxPath, tableRows, prvBlocks);
  } else if (entry.out.startsWith("02")) {
    md = renderLessonPlanMd(entry.title, hwpxPath, tables, prvBlocks, paragraphs);
  } else {
    md = renderWorksheetMd(entry.title, hwpxPath, prvBlocks, tableRows);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, entry.out);
  fs.writeFileSync(outPath, md, "utf8");
  console.log(`  → ${entry.out} (표 ${tables.length}개, PrvText 블록 ${prvBlocks.length}개, ${md.length}자)`);
  return outPath;
}

function main() {
  fs.mkdirSync(EXTRACT_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const hwpxFiles = findHwpxFiles();
  if (hwpxFiles.length === 0) {
    console.error("루트에 .hwpx 파일이 없습니다.");
    process.exit(1);
  }

  const converted = [];
  for (const hwpxPath of hwpxFiles) {
    const entry = matchOutput(hwpxPath);
    if (!entry) {
      console.warn(`  건너뜀 (매핑 없음): ${path.basename(hwpxPath)}`);
      continue;
    }
    converted.push(convertFile(hwpxPath, entry));
  }

  console.log(`\n완료: ${converted.length}개 MD 파일 → ${OUT_DIR}`);
}

main();
