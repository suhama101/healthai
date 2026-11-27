import { decodeResearchImage } from "@/lib/image-validation";

export const reviewStatuses = ["Draft", "Reviewed", "Needs Review"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export type DemoImage = { blob: Blob; width: number; height: number };

export type DemoCase = {
  id: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  title: string;
  notes: string;
  status: ReviewStatus;
  image: DemoImage | null;
};

const databaseName = "medilens-demo-cases";
const storeName = "cases";

async function transact<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, finish: (value: T) => void) => void) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(storeName, mode);
      let value: T;
      transaction.oncomplete = () => resolve(value);
      transaction.onabort = () => reject(transaction.error ?? new Error("Demo storage operation was interrupted."));
      operation(transaction.objectStore(storeName), (result) => { value = result; });
    });
  } finally {
    db.close();
  }
}

export function loadDemoCases() {
  return transact<DemoCase[]>("readonly", (store, finish) => {
    const request = store.getAll();
    request.onsuccess = () => finish((request.result as DemoCase[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });
}

export function readDemoCase(id: string) {
  return transact<DemoCase | undefined>("readonly", (store, finish) => {
    const request = store.get(id);
    request.onsuccess = () => finish(request.result as DemoCase | undefined);
  });
}

export async function createDemoCase() {
  const now = new Date().toISOString();
  const item: DemoCase = {
    id: `DEMO-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    revision: 0,
    title: "",
    notes: "",
    status: "Draft",
    image: null,
  };
  await transact<void>("readwrite", (store) => { store.add(item); });
  return item;
}

export async function saveDemoCase(item: DemoCase) {
  const saved = { ...item, title: item.title.trim(), updatedAt: new Date().toISOString(), revision: item.revision + 1 };
  const updated = await transact<boolean>("readwrite", (store, finish) => {
    const request = store.get(item.id);
    request.onsuccess = () => {
      const current = request.result as DemoCase | undefined;
      const currentRevision = current?.revision === item.revision;
      if (currentRevision) store.put(saved);
      finish(currentRevision);
    };
  });
  return updated ? saved : null;
}

export function deleteDemoCase(id: string) {
  return transact<void>("readwrite", (store) => { store.delete(id); });
}

export function resetDemoCases() {
  return transact<void>("readwrite", (store) => { store.clear(); });
}

export async function prepareDemoImage(file: File): Promise<DemoImage> {
  const result = await decodeResearchImage(file);
  if ("error" in result) throw new Error(result.error);
  const { bitmap } = result;
  try {
    const { width, height } = bitmap;
    if (Math.max(width, height) > 4096 || width * height > 4_194_304) {
      throw new Error("Choose an image up to 4,096 pixels per side and 4,194,304 pixels in total.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the image for local review.");
    context.drawImage(bitmap, 0, 0);
    // Keep a lossless preview of the decoded pixels without the original filename or file metadata.
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((encoded) => {
        if (encoded) resolve(encoded);
        else reject(new Error("The browser could not save the image preview."));
      }, "image/png");
    });
    return { blob, width, height };
  } finally {
    bitmap.close();
  }
}

export function caseDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function caseImageInfo(image: DemoImage) {
  const size = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(image.blob.size / 1024);
  return `PNG preview · ${image.width} × ${image.height} pixels · ${size} KiB`;
}
