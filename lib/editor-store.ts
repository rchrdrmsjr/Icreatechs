import { create } from "zustand";

export interface EditorFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  isDirty: boolean;
  isLoading: boolean;
}

interface EditorState {
  openFiles: EditorFile[];
  activeFileId: string | null;
  mruIds: string[];
  openFile: (file: Omit<EditorFile, "content" | "isDirty" | "isLoading">) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string) => void;
  setFileContent: (fileId: string, content: string, isDirty?: boolean) => void;
  setFileDirty: (fileId: string, isDirty: boolean) => void;
  setFileLoading: (fileId: string, isLoading: boolean) => void;
  touchMru: (fileId: string) => void;
}

function pushMru(mruIds: string[], fileId: string) {
  return [fileId, ...mruIds.filter((id) => id !== fileId)];
}

export const useEditorStore = create<EditorState>((set, get) => ({
  openFiles: [],
  activeFileId: null,
  mruIds: [],
  openFile: (file) => {
    const existing = get().openFiles.find((item) => item.id === file.id);
    if (existing) {
      set({
        activeFileId: file.id,
        mruIds: pushMru(get().mruIds, file.id),
      });
      return;
    }

    const newFile: EditorFile = {
      ...file,
      content: "",
      isDirty: false,
      isLoading: true,
    };

    set({
      openFiles: [...get().openFiles, newFile],
      activeFileId: file.id,
      mruIds: pushMru(get().mruIds, file.id),
    });
  },
  closeFile: (fileId) => {
    const nextOpenFiles = get().openFiles.filter((file) => file.id !== fileId);
    const nextMru = get().mruIds.filter((id) => id !== fileId);
    const nextActive =
      get().activeFileId === fileId ? nextMru[0] ?? null : get().activeFileId;

    set({
      openFiles: nextOpenFiles,
      activeFileId: nextActive,
      mruIds: nextMru,
    });
  },
  setActiveFile: (fileId) => {
    set({
      activeFileId: fileId,
      mruIds: pushMru(get().mruIds, fileId),
    });
  },
  setFileContent: (fileId, content, isDirty = false) => {
    set({
      openFiles: get().openFiles.map((file) =>
        file.id === fileId
          ? { ...file, content, isDirty, isLoading: false }
          : file,
      ),
    });
  },
  setFileDirty: (fileId, isDirty) => {
    set({
      openFiles: get().openFiles.map((file) =>
        file.id === fileId ? { ...file, isDirty, isLoading: false } : file,
      ),
    });
  },
  setFileLoading: (fileId, isLoading) => {
    set({
      openFiles: get().openFiles.map((file) =>
        file.id === fileId ? { ...file, isLoading } : file,
      ),
    });
  },
  touchMru: (fileId) => {
    set({ mruIds: pushMru(get().mruIds, fileId) });
  },
}));
