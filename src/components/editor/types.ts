export interface EditorFile {
    id: string;
    name: string;
    path: string;
    language: string;
    content: string;
    isDirty: boolean;
}

export interface CodeEditorProps {
    files: EditorFile[];
    activeFileId: string;
    onFileChange: (fileId: string, content: string) => void;
    onFileSelect: (fileId: string) => void;
    onFileSave: (fileId: string) => void;
    onFileClose: (fileId: string) => void;
}
