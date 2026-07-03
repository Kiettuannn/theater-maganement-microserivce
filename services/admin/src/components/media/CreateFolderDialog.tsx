import { useState } from "react";
import { X } from "lucide-react";
import type { MediaFolder } from "@/types/media.types";

interface CreateFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (folderName: string) => void;
  parentFolder?: MediaFolder;
}

export function CreateFolderDialog({
  isOpen,
  onClose,
  onSuccess,
  parentFolder,
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onSuccess(folderName.trim());
      setFolderName("");
      onClose();
    }
  };

  const handleClose = () => {
    setFolderName("");
    onClose();
  };

  return (
    <>
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 pointer-events-auto border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Tạo thư mục mới
            </h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {parentFolder && (
              <div className="mb-4">
                <label className="text-sm text-gray-600">
                  Thư mục cha:{" "}
                  <span className="font-medium">{parentFolder.name}</span>
                </label>
              </div>
            )}

            <div className="mb-6">
              <label
                htmlFor="folderName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tên thư mục
              </label>
              <input
                id="folderName"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Nhập tên thư mục..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!folderName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Tạo thư mục
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
