"use client";

import { ImagePlus, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/image-validation";

export function ImageUploader({ hasImage, onSelect }: {
  hasImage: boolean;
  onSelect: (files: FileList) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="drop-zone" data-dragging={dragging}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onSelect(event.dataTransfer.files);
      }}>
      <span className="icon-tile"><UploadCloud size={27} aria-hidden="true" /></span>
      <p className="drop-title">{hasImage ? "Replace the selected crop" : "Choose one cell crop"}</p>
      <p id="upload-requirements">Browse or drop a JPEG or PNG image up to 10 MB.</p>
      <input ref={input} type="file" accept={ACCEPTED_IMAGE_TYPES} hidden
        onChange={(event) => {
          const files = event.currentTarget.files;
          if (files?.length) onSelect(files);
          event.currentTarget.value = "";
        }} />
      <button className="button button-secondary" type="button" aria-describedby="upload-requirements"
        onClick={() => input.current?.click()}>
        <ImagePlus size={18} aria-hidden="true" /> {hasImage ? "Replace image" : "Browse files"}
      </button>
    </div>
  );
}
