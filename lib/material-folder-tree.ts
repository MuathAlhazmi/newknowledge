/** Minimal row shape for building a parent/child tree. */
export type MaterialFolderTreeInput = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
};

export type MaterialFolderTreeNode<T extends MaterialFolderTreeInput> = T & {
  children: MaterialFolderTreeNode<T>[];
};

function sortSiblings<T extends MaterialFolderTreeInput>(list: MaterialFolderTreeNode<T>[]) {
  list.sort((a, b) =>
    a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.name.localeCompare(b.name, "ar"),
  );
  for (const n of list) sortSiblings(n.children);
}

/** Groups flat folder rows into roots + nested `children` (stable order by sortOrder, then name). */
export function buildMaterialFolderTree<T extends MaterialFolderTreeInput>(rows: T[]): MaterialFolderTreeNode<T>[] {
  const byId = new Map<string, MaterialFolderTreeNode<T>>();
  for (const r of rows) {
    byId.set(r.id, { ...r, children: [] });
  }

  const roots: MaterialFolderTreeNode<T>[] = [];
  for (const r of rows) {
    const node = byId.get(r.id);
    if (!node) continue;
    if (r.parentId == null) {
      roots.push(node);
    } else {
      const parent = byId.get(r.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  }

  sortSiblings(roots);
  return roots;
}
