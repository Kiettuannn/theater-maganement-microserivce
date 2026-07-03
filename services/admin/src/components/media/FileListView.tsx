import type { MediaFile } from "@/types/media.types";
import { formatFileSize } from "@/services/mediaService";
import { FileTypeIcon } from "./FileTypeIcon";
import { Eye } from "lucide-react";

interface FileListItemProps {
  file: MediaFile;
  onPreview: (file: MediaFile) => void;
}

export function FileListItem({ file, onPreview }: FileListItemProps) {
  const fileName =
    file.originalFileName || file.url.split("/").pop() || "Unknown";
  const isImage = file.contentType.startsWith("image/");

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="group flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
      onClick={() => onPreview(file)}
    >
      {/* Thumbnail/Icon */}
      <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        {isImage ? (
          <img
            src={file.url}
            alt={fileName}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileTypeIcon
            contentType={file.contentType}
            className="w-6 h-6 text-gray-400"
          />
        )}
      </div>

      {/* File Name */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium text-gray-900 truncate"
          title={fileName}
        >
          {fileName}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{file.contentType}</p>
      </div>

      {/* File Size */}
      <div className="w-24 text-sm text-gray-600 text-right">
        {formatFileSize(file.size)}
      </div>

      {/* Upload Date */}
      <div className="w-36 text-sm text-gray-600 text-right">
        {formatDate(file.uploadDate)}
      </div>

      {/* Preview Icon */}
      <div className="w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Eye className="w-5 h-5 text-gray-600" />
      </div>
    </div>
  );
}

interface FileListViewProps {
  files: MediaFile[];
  onPreview: (file: MediaFile) => void;
}

export function FileListView({ files, onPreview }: FileListViewProps) {
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase">
        <div className="w-12 flex-shrink-0">Preview</div>
        <div className="flex-1">Name</div>
        <div className="w-24 text-right">Size</div>
        <div className="w-36 text-right">Upload Date</div>
        <div className="w-8"></div>
      </div>

      {/* File List */}
      <div>
        {files.map((file) => (
          <FileListItem key={file.id} file={file} onPreview={onPreview} />
        ))}
      </div>
    </div>
  );
}
