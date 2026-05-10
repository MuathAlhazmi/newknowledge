const CONTROL_OR_FS = /[/\\:*?"<>|\u0000-\u001F]/g;

function displayFilenameBase(title: string, maxLen: number): string {
  return (
    title
      .trim()
      .replace(/[\r\n]/g, " ")
      .replace(CONTROL_OR_FS, "—")
      .slice(0, maxLen)
      .trim()
      .replace(/\.+$/, "") || "material"
  );
}

function asciiFilenameBase(displayBase: string, maxLen: number): string {
  const fromDisplay = displayBase
    .replace(/[^\x21-\x7E]/g, "_")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[\s._-]+|[\s._-]+$/g, "")
    .slice(0, maxLen);
  return fromDisplay || "material";
}

/** Suggested value for the HTML `download` attribute (same base name as `filename*`). */
export function materialSuggestedDownloadName(title: string, ext: "pdf" | "docx"): string {
  const suffix = ext === "pdf" ? ".pdf" : ".docx";
  return `${displayFilenameBase(title, 200)}${suffix}`;
}

function escapeDispositionFilenameParam(name: string): string {
  return name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * RFC 6266 / 5987: ASCII `filename` fallback plus `filename*=UTF-8''…` so titles
 * (e.g. Arabic) are used as the saved file name in modern browsers.
 */
export function materialContentDisposition(
  title: string,
  opts: { ext: "pdf" | "docx"; disposition: "inline" | "attachment" },
): string {
  const ext = opts.ext === "pdf" ? ".pdf" : ".docx";
  const displayBase = displayFilenameBase(title, 200);
  const fullDisplay = `${displayBase}${ext}`;
  const asciiName = `${asciiFilenameBase(displayBase, 80)}${ext}`;
  const star = encodeURIComponent(fullDisplay);
  const { disposition } = opts;
  return `${disposition}; filename="${escapeDispositionFilenameParam(asciiName)}"; filename*=UTF-8''${star}`;
}
