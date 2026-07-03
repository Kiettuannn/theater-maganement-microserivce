import {
  FileIcon,
  ImageIcon,
  VideoIcon,
  FileTextIcon,
  MusicIcon,
} from "lucide-react";

interface FileIconProps {
  contentType: string;
  className?: string;
}

export function FileTypeIcon({
  contentType,
  className = "w-5 h-5",
}: FileIconProps) {
  if (contentType.startsWith("image/")) {
    return <ImageIcon className={className} />;
  } else if (contentType.startsWith("video/")) {
    return <VideoIcon className={className} />;
  } else if (contentType.startsWith("audio/")) {
    return <MusicIcon className={className} />;
  } else if (contentType.includes("pdf") || contentType.includes("document")) {
    return <FileTextIcon className={className} />;
  }
  return <FileIcon className={className} />;
}
