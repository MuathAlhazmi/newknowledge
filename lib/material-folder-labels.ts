export type FolderForSelect = { id: string; name: string; parentId: string | null };

/** Build stable display labels for nested folders (e.g. `وحدة 1 / جزء أ`). */
export function materialFoldersWithLabels(folders: FolderForSelect[]): { id: string; label: string }[] {
  const byId = new Map(folders.map((f) => [f.id, f]));

  function pathFor(id: string): string {
    const seen = new Set<string>();
    const parts: string[] = [];
    let cur: string | null | undefined = id;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const f = byId.get(cur);
      if (!f) break;
      parts.unshift(f.name);
      cur = f.parentId;
    }
    return parts.join(" / ");
  }

  return folders.map((f) => ({ id: f.id, label: pathFor(f.id) }));
}
