import type { MediaFolder } from "@/types/media.types";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { useState } from "react";

interface FolderTreeProps {
  folders: MediaFolder[];
  selectedFolderId?: string;
  onFolderSelect: (folderId: string) => void;
}

export function FolderTree({
  folders,
  selectedFolderId,
  onFolderSelect,
}: FolderTreeProps) {
  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          level={0}
          selectedFolderId={selectedFolderId}
          onFolderSelect={onFolderSelect}
        />
      ))}
    </div>
  );
}

interface FolderItemProps {
  folder: MediaFolder;
  level: number;
  selectedFolderId?: string;
  onFolderSelect: (folderId: string) => void;
}

function FolderItem({
  folder,
  level,
  selectedFolderId,
  onFolderSelect,
}: FolderItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
          isSelected ? "bg-gray-200" : ""
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onFolderSelect(folder.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        {isExpanded && isSelected ? (
          <FolderOpen className="w-5 h-5 text-blue-600" />
        ) : (
          <Folder className="w-5 h-5 text-gray-600" />
        )}
        <span className="text-sm font-medium flex-1">{folder.name}</span>
        {folder.fileCount !== undefined && (
          <span className="text-xs text-gray-500">{folder.fileCount}</span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onFolderSelect={onFolderSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
