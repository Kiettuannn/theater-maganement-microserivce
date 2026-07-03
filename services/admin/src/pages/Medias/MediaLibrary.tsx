import { useState, useEffect } from "react";
import { Grid3x3, List, ChevronDown, Filter, Image } from "lucide-react";
import { SearchAddBar } from "@/components/ui/SearchAddBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { MediaFile, ViewMode, SortBy } from "@/types/media.types";
import { getAllMediaFiles, deleteMediaFile } from "@/services/mediaService";
import { FileGridView } from "@/components/media/FileGridView";
import { FileListView } from "@/components/media/FileListView";
import { FilePreviewPanel } from "@/components/media/FilePreviewPanel";
import { UploadDialog } from "@/components/media/UploadDialog";
import { useNotificationStore } from "@/stores";

export default function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  // Load files from API
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await getAllMediaFiles();
      setFiles(data);
      setFilteredFiles(data);
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort files
  useEffect(() => {
    let result = [...files];

    // Filter by file type
    if (fileTypeFilter !== "all") {
      result = result.filter((file) => {
        if (fileTypeFilter === "image")
          return file.contentType.startsWith("image/");
        if (fileTypeFilter === "video")
          return file.contentType.startsWith("video/");
        if (fileTypeFilter === "document")
          return (
            file.contentType.includes("pdf") ||
            file.contentType.includes("document")
          );
        return true;
      });
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter((file) => {
        const fileName =
          file.originalFileName || file.url.split("/").pop() || "";
        return fileName.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Sort files
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          const nameA = a.originalFileName || a.url.split("/").pop() || "";
          const nameB = b.originalFileName || b.url.split("/").pop() || "";
          return nameA.localeCompare(nameB);
        case "size":
          return b.size - a.size;
        case "date":
          return (
            new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredFiles(result);
  }, [files, fileTypeFilter, searchQuery, sortBy]);

  const handleUploadSuccess = () => {
    loadFiles();
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await deleteMediaFile(fileId);
      addNotification({
        type: "success",
        title: "Success",
        message: "File deleted successfully!",
      });
      // Reload files after deletion
      await loadFiles();
    } catch (error) {
      console.error("Failed to delete file:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete file. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Manage media files and images for your cinema"
      />

      {/* Search and Add Button */}
      <SearchAddBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="Search files by name..."
        totalCount={files.length}
        filteredCount={filteredFiles.length}
        icon={<Image />}
        label="files"
        buttonText="Add File"
        onAddClick={() => setShowUploadDialog(true)}
      />

      {/* Toolbar - Filters and View Mode */}
      <div className="flex items-center gap-2">
        {/* File Type Filter */}
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="appearance-none pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          >
            <option value="all">All</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="appearance-none px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          >
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="date">Upload Date</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* View Mode Toggle */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 transition-colors cursor-pointer ${
              viewMode === "grid"
                ? "bg-gray-200 text-gray-900"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            title="Grid view"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 transition-colors cursor-pointer border-l border-gray-300 ${
              viewMode === "list"
                ? "bg-gray-200 text-gray-900"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File Display Area */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          {loading ? (
            <LoadingSpinner
              message="Loading files..."
              size="lg"
              fullScreen={false}
            />
          ) : viewMode === "grid" ? (
            <FileGridView files={filteredFiles} onPreview={setSelectedFile} />
          ) : (
            <FileListView files={filteredFiles} onPreview={setSelectedFile} />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <UploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Preview Panel */}
      <FilePreviewPanel
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        onDelete={handleDeleteFile}
      />
    </div>
  );
}
