import { Trash2 } from "lucide-react";

export function ImagePreview({ file, url, onRemove }: {
  file: File;
  url: string;
  onRemove: () => void;
}) {
  return (
    <figure className="image-preview">
      {/* A local object URL bypasses server-side image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Preview of the selected research image" />
      <figcaption>
        <span>{file.name}</span>
        <button className="button button-secondary" onClick={onRemove} type="button">
          <Trash2 size={16} aria-hidden="true" /> Remove
        </button>
      </figcaption>
    </figure>
  );
}
