import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  listFolders,
  listFiles,
  createFolderAndUpload,
  deleteFile,
  getPDF,
} from "../../services/api"; // Correct path to your API functions
import {
  Plus,
  Upload,
  FolderPlus,
  FolderOpen,
  FileText,
  Trash2,
  Download,
} from "lucide-react";

export default function DocumentManagement() {
  const [folderName, setFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch folders
  const {
    data: folders = [],
    isLoading: loadingFolders,
    error,
    refetch: refetchFolders,
  } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const result = await listFolders();
      console.log("API /docs/list-folders result:", result);
      return result;
    },
  });
  console.log("folders state in component:", folders);

  // Fetch files for selected folder
  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ["files", selectedFolder],
    queryFn: () =>
      selectedFolder === "documents" || !selectedFolder
        ? listFiles()
        : listFiles(selectedFolder),
    enabled: !!selectedFolder,
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: (name: string) =>
      createFolderAndUpload(
        name === "documents" ? undefined : name,
        new File([], "")
      ), // Just creates folder
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setFolderName("");
      toast({ title: "Folder created successfully" });
    },
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ folder, file }: { folder: string; file: File }) =>
      createFolderAndUpload(folder === "documents" ? undefined : folder, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", selectedFolder] });
      toast({ title: "File uploaded successfully" });
    },
  });

  // File delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ folder, file }: { folder: string; file: string }) =>
      deleteFile(folder, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", selectedFolder] });
      toast({ title: "File deleted successfully" });
    },
  });

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      createFolderMutation.mutate(folderName.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length && selectedFolder) {
      uploadMutation.mutate({ folder: selectedFolder, file: files[0] });
    }
  };

  const handleDownload = async (file: string) => {
    try {
      const blob = await getPDF(file, selectedFolder);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Failed to download file", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Folder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderPlus className="mr-2 text-green-500" /> Create New Folder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateFolder} className="flex gap-2">
            <Input
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name"
              required
            />
            <Button type="submit" disabled={createFolderMutation.isPending}>
              <Plus className="mr-2" /> Create
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Upload Files */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Upload className="mr-2 text-blue-500" /> Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Select Folder</Label>
          <Select
            value={selectedFolder}
            onValueChange={setSelectedFolder}
            disabled={loadingFolders}
            onOpenChange={(open) => {
              if (open) {
                refetchFolders();
              }
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loadingFolders
                    ? "Loading folders..."
                    : folders.length === 0
                    ? "No folders found"
                    : "Select a folder"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {loadingFolders ? (
                <div className="p-2 text-muted-foreground">
                  Loading folders...
                </div>
              ) : folders.length === 0 ? (
                <div className="p-2 text-muted-foreground">
                  No folders found
                </div>
              ) : (
                folders.map((folder) => (
                  <SelectItem key={folder} value={folder}>
                    {folder}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <div className="mt-4">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={!selectedFolder}
            />
          </div>
        </CardContent>
      </Card>

      {/* List Files */}
      {selectedFolder && (
        <Card>
          <CardHeader>
            <CardTitle>Files in {selectedFolder}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFiles ? (
              <p>Loading files...</p>
            ) : files.length === 0 ? (
              <p>No files found</p>
            ) : (
              <ul className="space-y-2">
                {files.map((file) => (
                  <li key={file} className="flex justify-between items-center">
                    <span>{file}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="mr-1 h-4 w-4" /> Download
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          deleteMutation.mutate({
                            folder: selectedFolder,
                            file,
                          })
                        }
                      >
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
