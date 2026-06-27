import { normalizeClassPart } from "./constants";
import {
  GROUP_ACTIVITY_PRD,
  ROSTER_EXCEL_HEADERS,
  achievementCodeFromLabel,
} from "./prd";
import type { AchievementLevel, Gender, RosterStudent } from "./types";
import { parseGender } from "./parse-roster";

export interface RosterImportRow {
  grade: string;
  classNo: string;
  studentNo: string;
  studentName: string;
  gender: Gender;
  achievementLevel: AchievementLevel;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(value: string | number): string {
  const type = typeof value === "number" ? "Number" : "String";
  return `<Cell><Data ss:Type="${type}">${escapeXml(String(value))}</Data></Cell>`;
}

function row(cells: (string | number)[]): string {
  return `<Row>${cells.map(cell).join("")}</Row>`;
}

export function buildRosterSpreadsheetRows(
  grade: string,
  classNo: string,
  students: RosterStudent[] = [],
): string[][] {
  const headers = ROSTER_EXCEL_HEADERS;
  if (students.length === 0) {
    const sample = GROUP_ACTIVITY_PRD.rosterImport.columns.map((c) => c.example ?? "");
    sample[0] = grade;
    sample[1] = classNo;
    return [headers, sample];
  }
  return [
    headers,
    ...students.map((s) => [
      grade,
      classNo,
      s.studentNo,
      s.studentName,
      s.gender === "male" ? "남" : "여",
      s.achievementLevel === 1 ? "상" : s.achievementLevel === 3 ? "하" : "중",
    ]),
  ];
}

export function rosterRowsToSpreadsheetXml(rows: string[][]): string {
  const tableRows = rows.map((r) => row(r)).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="명렬표">
<Table>${tableRows}</Table>
</Worksheet>
</Workbook>`;
}

export function downloadRosterExcel(grade: string, classNo: string, students: RosterStudent[] = []): void {
  const rows = buildRosterSpreadsheetRows(grade, classNo, students);
  const xml = rosterRowsToSpreadsheetXml(rows);
  const blob = new Blob(["\uFEFF", xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `명렬표_${grade}학년${classNo}반.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function headerIndexMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    map[h.trim()] = i;
  });
  return map;
}

function pickColumn(map: Record<string, number>, row: string[], keys: string[], fallback: number): string {
  for (const key of keys) {
    const idx = map[key];
    if (idx !== undefined && row[idx] !== undefined) return String(row[idx]).trim();
  }
  return row[fallback] !== undefined ? String(row[fallback]).trim() : "";
}

export function parseSpreadsheetRows(
  matrix: string[][],
  expectedGrade: string,
  expectedClassNo: string,
): RosterImportRow[] {
  if (matrix.length === 0) return [];

  const headerRow = matrix[0].map((c) => String(c ?? "").trim());
  const hasHeader = /학년|번호|이름/i.test(headerRow.join(" "));
  const dataRows = hasHeader ? matrix.slice(1) : matrix;
  const colMap = hasHeader ? headerIndexMap(headerRow) : {};

  const result: RosterImportRow[] = [];
  for (const raw of dataRows) {
    const row = raw.map((c) => String(c ?? "").trim());
    if (row.every((c) => !c)) continue;

    const grade = pickColumn(colMap, row, ["학년", "grade"], 0) || expectedGrade;
    const classNo = pickColumn(colMap, row, ["반", "classNo", "class"], 1) || expectedClassNo;
    const studentNo = pickColumn(colMap, row, ["번호", "studentNo", "no"], 2);
    const studentName = pickColumn(colMap, row, ["이름", "studentName", "name"], 3);
    if (!studentNo || !studentName) continue;

    const normalizedGrade = normalizeClassPart(grade);
    const normalizedClassNo = normalizeClassPart(classNo);
    const expectedGradeNorm = normalizeClassPart(expectedGrade);
    const expectedClassNoNorm = normalizeClassPart(expectedClassNo);

    if (normalizedGrade !== expectedGradeNorm || normalizedClassNo !== expectedClassNoNorm) {
      throw new Error(
        `${studentNo}번 ${studentName}: 학년·반(${grade} / ${classNo})이 선택된 반(${expectedGrade}학년 ${expectedClassNo}반)과 다릅니다.`,
      );
    }

    const genderRaw = pickColumn(colMap, row, ["성별", "gender"], 4);
    const achievementRaw = pickColumn(colMap, row, ["성적분포", "achievementLevel", "성적"], 5);

    result.push({
      grade: normalizedGrade,
      classNo: normalizedClassNo,
      studentNo,
      studentName,
      gender: parseGender(genderRaw) ?? "male",
      achievementLevel: achievementCodeFromLabel(achievementRaw || "중"),
    });
  }
  return result;
}

function parseSpreadsheetXml(text: string, expectedGrade: string, expectedClassNo: string): RosterImportRow[] {
  const doc = new DOMParser().parseFromString(text, "text/xml");
  const rows = Array.from(doc.getElementsByTagName("Row"));
  const matrix = rows.map((rowEl) =>
    Array.from(rowEl.getElementsByTagName("Cell")).map((cellEl) => {
      const data = cellEl.getElementsByTagName("Data")[0];
      return data?.textContent?.trim() ?? "";
    }),
  );
  return parseSpreadsheetRows(matrix, expectedGrade, expectedClassNo);
}

function parseCsvText(text: string, expectedGrade: string, expectedClassNo: string): RosterImportRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const matrix = lines.map((line) => line.split(/[,;\t]/).map((c) => c.trim()));
  return parseSpreadsheetRows(matrix, expectedGrade, expectedClassNo);
}

async function parseXlsxBuffer(_buffer: ArrayBuffer, _expectedGrade: string, _expectedClassNo: string): Promise<RosterImportRow[]> {
  throw new Error("xlsx 파일은 「Excel 97-2003 통합 문서(.xls)」로 저장하거나, 다운로드한 .xls 양식을 사용해 주세요.");
}

export async function parseRosterFile(
  file: File,
  expectedGrade: string,
  expectedClassNo: string,
): Promise<RosterImportRow[]> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "csv" || ext === "txt") {
    return parseCsvText(await file.text(), expectedGrade, expectedClassNo);
  }

  if (ext === "xls" || ext === "xml") {
    return parseSpreadsheetXml(await file.text(), expectedGrade, expectedClassNo);
  }

  if (ext === "xlsx") {
    return parseXlsxBuffer(await file.arrayBuffer(), expectedGrade, expectedClassNo);
  }

  throw new Error("지원 형식: .xls(엑셀), .csv");
}
