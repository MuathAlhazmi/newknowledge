"use client";

import { useState } from "react";
import { arCopy } from "@/lib/copy/ar";

const u = arCopy.materialUpload;

function uploadErrorMessage(code: string | undefined): string {
  switch (code) {
    case "NOT_PDF":
      return u.errors.notPdf;
    case "FILE_TOO_LARGE":
      return u.errors.tooLarge;
    case "INVALID_PDF":
      return u.errors.invalidPdf;
    default:
      return u.errors.generic;
  }
}

export function PdfUploadForm({ courseId }: { courseId: string }) {
  const [title, setTitle] = useState("");
  const [pdfPath, setPdfPath] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);

  async function uploadThenSubmit() {
    if (!file || !title.trim()) return;
    setBusy(true);
    setMessage("");
    setMessageOk(false);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: uploadData });
      const body = (await res.json()) as { path?: string; code?: string };
      if (!res.ok) {
        setMessage(uploadErrorMessage(body.code));
        return;
      }
      if (!body.path) {
        setMessage(u.errors.generic);
        return;
      }
      setPdfPath(body.path);
      setMessageOk(true);
      setMessage(u.afterUpload);
    } catch {
      setMessage(u.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="nk-card nk-card-elevated grid gap-3 p-4">
      <label className="grid gap-1 text-sm">
        <span>{u.titleLabel}</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={u.titlePlaceholder}
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span>{u.pdfLabel}</span>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPdfPath("");
            setMessage("");
            setMessageOk(false);
          }}
        />
      </label>

      <button type="button" onClick={uploadThenSubmit} disabled={busy} className="nk-btn nk-btn-secondary w-fit">
        {busy ? u.uploadPending : u.uploadButton}
      </button>
      {message && (
        <p className={`text-xs transition-all ${messageOk ? "text-emerald-700" : "text-rose-700"}`}>
          {message}
        </p>
      )}

      <form action={`/api/admin/courses/${courseId}/materials`} method="post" className="grid gap-2">
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="pdfPath" value={pdfPath} />
        <button
          type="submit"
          disabled={!title.trim() || !pdfPath}
          className="nk-btn nk-btn-primary w-fit disabled:opacity-50"
        >
          {u.saveMaterial}
        </button>
      </form>
    </div>
  );
}
