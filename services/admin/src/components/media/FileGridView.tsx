import type { MediaFile } from "@/types/media.types";
import { formatFileSize } from "@/services/mediaService";
import { FileTypeIcon } from "./FileTypeIcon";
import { Eye } from "lucide-react";

interface FileGridItemProps {
  file: MediaFile;
  onPreview: (file: MediaFile) => void;
}

export function FileGridItem({ file, onPreview }: FileGridItemProps) {
  const fileName =
    file.originalFileName || file.url.split("/").pop() || "Unknown";
  const isImage = file.contentType.startsWith("image/");

  return (
    <div
      className="group relative border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 bg-white"
      onClick={() => onPreview(file)}
    >
      {/* Preview Image or Icon */}
      <div className="relative w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img
            src={file.url}
            alt={fileName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <FileTypeIcon
            contentType={file.contentType}
            className="w-16 h-16 text-gray-400"
          />
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center pointer-events-none">
          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>

      {/* File Info */}
      <div className="p-3">
        <p
          className="text-sm font-medium text-gray-900 truncate"
          title={fileName}
        >
          {fileName}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {formatFileSize(file.size)}
        </p>
      </div>
    </div>
  );
}

interface FileGridViewProps {
  files: MediaFile[];
  onPreview: (file: MediaFile) => void;
}

export function FileGridView({ files, onPreview }: FileGridViewProps) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <FileTypeIcon
            contentType=""
            className="w-16 h-16 mx-auto mb-4 opacity-30"
          />
          <p>No files found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {files.map((file) => (
        <FileGridItem key={file.id} file={file} onPreview={onPreview} />
      ))}
    </div>
  );
}
