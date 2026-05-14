import { useCallback, useRef, useState } from "react";
import { FileUp, FileText, FileSpreadsheet, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}

export function Dropzone({ file, onFile, disabled }: Props) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback((f: File) => {
    const ok = /\.(docx|xlsx|xls)$/i.test(f.name);
    if (!ok) return;
    onFile(f);
  }, [onFile]);

  if (file) {
    const isDoc = /\.docx$/i.test(file.name);
    const Icon = isDoc ? FileText : FileSpreadsheet;
    return (
      <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onFile(null)} disabled={disabled}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handle(f);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card p-12 text-center transition-all",
        hover ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
        <FileUp className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold">Drop your document here</h3>
      <p className="mt-1 text-sm text-muted-foreground">Supports .docx and .xlsx — up to 10MB</p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".docx,.xlsx,.xls"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
    </div>
  );
}
