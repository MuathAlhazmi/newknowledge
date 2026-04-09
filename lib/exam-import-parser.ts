import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ParsedImportTable = {
  headers: string[];
  rows: Record<string, string>[];
};

export type ParseImportErrorCode =
  | "empty_file"
  | "unsupported_type"
  | "parse_failed"
  | "empty_sheet";

export type ParseImportResult =
  | { ok: true; table: ParsedImportTable }
  | { ok: false; code: ParseImportErrorCode };

export type ImportColumnMapping = {
  question: string;
  choice1: string;
  choice2: string;
  choice3: string;
  choice4: string;
  correct: string;
  order: string;
};

export type MappedImportRow = {
  questionText: string;
  choices: [string, string, string, string];
  correctRaw: string;
  orderRaw: string;
};

function normalizeHeaderName(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, " ").replace(/[_-]+/g, " ");
}

function coerceString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  return "";
}

function parseCsv(text: string): ParseImportResult {
  const out = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
  });
  if (out.errors.length > 0) return { ok: false, code: "parse_failed" };
  const data = out.data ?? [];
  if (data.length === 0) return { ok: false, code: "empty_sheet" };
  const headers = (out.meta.fields ?? [])
    .map((h) => h.trim())
    .filter((h) => h.length > 0);
  if (headers.length === 0) return { ok: false, code: "empty_sheet" };
  return {
    ok: true,
    table: {
      headers,
      rows: data.map((row) =>
        Object.fromEntries(headers.map((h) => [h, coerceString(row[h])])),
      ),
    },
  };
}

function parseXlsx(buffer: ArrayBuffer): ParseImportResult {
  try {
    const wb = XLSX.read(buffer, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { ok: false, code: "empty_sheet" };
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return { ok: false, code: "empty_sheet" };
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
    if (rows.length === 0) return { ok: false, code: "empty_sheet" };
    const headers = Object.keys(rows[0] ?? {})
      .map((h) => h.trim())
      .filter((h) => h.length > 0);
    if (headers.length === 0) return { ok: false, code: "empty_sheet" };
    return {
      ok: true,
      table: {
        headers,
        rows: rows.map((row) =>
          Object.fromEntries(headers.map((h) => [h, coerceString(row[h])])),
        ),
      },
    };
  } catch {
    return { ok: false, code: "parse_failed" };
  }
}

export async function parseExamImportFile(file: File): Promise<ParseImportResult> {
  if (!file || file.size <= 0) return { ok: false, code: "empty_file" };
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".csv")) {
    return parseCsv(await file.text());
  }
  if (lower.endsWith(".xlsx")) {
    return parseXlsx(await file.arrayBuffer());
  }
  return { ok: false, code: "unsupported_type" };
}

export function suggestImportMapping(headers: string[]): ImportColumnMapping {
  const byNorm = new Map<string, string>();
  for (const h of headers) byNorm.set(normalizeHeaderName(h), h);
  const pick = (...candidates: string[]) => {
    for (const c of candidates) {
      const v = byNorm.get(normalizeHeaderName(c));
      if (v) return v;
    }
    return "";
  };
  return {
    question: pick("question", "question text", "text", "السؤال", "نص السؤال"),
    choice1: pick("choice1", "choice 1", "a", "choice a", "الخيار 1", "الخيار أ"),
    choice2: pick("choice2", "choice 2", "b", "choice b", "الخيار 2", "الخيار ب"),
    choice3: pick("choice3", "choice 3", "c", "choice c", "الخيار 3", "الخيار ج"),
    choice4: pick("choice4", "choice 4", "d", "choice d", "الخيار 4", "الخيار د"),
    correct: pick("correct", "answer", "correct answer", "الإجابة الصحيحة", "الجواب"),
    order: pick("order", "sort", "ترتيب", "order no"),
  };
}

export function mapRowsWithMapping(
  rows: Record<string, string>[],
  mapping: ImportColumnMapping,
): MappedImportRow[] {
  return rows.map((row) => ({
    questionText: coerceString(mapping.question ? row[mapping.question] : ""),
    choices: [
      coerceString(mapping.choice1 ? row[mapping.choice1] : ""),
      coerceString(mapping.choice2 ? row[mapping.choice2] : ""),
      coerceString(mapping.choice3 ? row[mapping.choice3] : ""),
      coerceString(mapping.choice4 ? row[mapping.choice4] : ""),
    ],
    correctRaw: coerceString(mapping.correct ? row[mapping.correct] : ""),
    orderRaw: coerceString(mapping.order ? row[mapping.order] : ""),
  }));
}
