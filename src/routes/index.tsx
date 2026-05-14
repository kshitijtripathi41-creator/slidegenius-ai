import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Settings as SettingsIcon, Wand2, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Dropzone } from "@/components/Dropzone";
import { ProgressSteps, type Step } from "@/components/ProgressSteps";
import { buildPptx, extractFile, generateSlidesFromGemini, type Slide } from "@/lib/slidestream";

export const Route = createFileRoute("/")({ component: Index });

const KEY_STORAGE = "slidestream:gemini-key";

function Index() {
  const [apiKey, setApiKey] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const k = localStorage.getItem(KEY_STORAGE) ?? "";
    setApiKey(k);
  }, []);

  const saveKey = (k: string) => {
    setApiKey(k);
    if (k) localStorage.setItem(KEY_STORAGE, k);
    else localStorage.removeItem(KEY_STORAGE);
    toast.success(k ? "API key saved" : "API key cleared");
  };

  const busy = step === "reading" || step === "summarizing" || step === "building";
  const canGenerate = !!apiKey && !!file && !busy;

  const handleGenerate = async () => {
    if (!apiKey || !file) return;
    setError(null);
    setSlides(null);
    try {
      setStep("reading");
      const text = await extractFile(file);
      if (!text.trim()) throw new Error("File appears to be empty.");

      setStep("summarizing");
      const result = await generateSlidesFromGemini(apiKey, text);

      setStep("building");
      await buildPptx(result, file.name.replace(/\.[^.]+$/, "") + ".pptx");
      setSlides(result);
      setStep("done");
      toast.success("Presentation downloaded");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      setStep("error");
      toast.error(msg);
    }
  };

  const rebuild = async () => {
    if (!slides || !file) return;
    await buildPptx(slides, file.name.replace(/\.[^.]+$/, "") + ".pptx");
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-subtle)]">
      <Toaster richColors position="top-right" />
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">SlideStream</h1>
              <p className="text-xs text-muted-foreground">Documents → Decks, instantly</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            {apiKey ? "Settings" : "Add API Key"}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <section className="mb-10 text-center">
          <h2 className="text-4xl font-bold tracking-tight">Turn dense files into board-ready decks</h2>
          <p className="mt-3 text-muted-foreground">
            Upload a Word or Excel file. Our AI distills it into a 5-slide executive briefing.
          </p>
        </section>

        {!apiKey && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none text-primary" />
            <div className="flex-1">
              <p className="font-medium text-foreground">Please enter your Gemini API Key in Settings to begin.</p>
              <p className="mt-1 text-muted-foreground">Your key stays in your browser — calls go directly to Google.</p>
            </div>
            <Button size="sm" onClick={() => setSettingsOpen(true)}>Open Settings</Button>
          </div>
        )}

        <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <Dropzone file={file} onFile={setFile} disabled={busy} />

          {(busy || step === "done") && (
            <div className="rounded-xl border bg-background p-5">
              <ProgressSteps step={step} />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Powered by Gemini 1.5 Flash · Generated locally with PptxGenJS
            </p>
            <div className="flex gap-2">
              {step === "done" && slides && (
                <Button variant="outline" onClick={rebuild}>
                  <Download className="mr-2 h-4 w-4" /> Re-download
                </Button>
              )}
              <Button onClick={handleGenerate} disabled={!canGenerate} size="lg">
                <Wand2 className="mr-2 h-4 w-4" />
                {busy ? "Working…" : "Generate Slides"}
              </Button>
            </div>
          </div>
        </div>

        {step === "done" && slides && (
          <section className="mt-8 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Preview</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {slides.map((s, i) => (
                <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Slide {i + 1}</span>
                  </div>
                  <h4 className="font-semibold">{s.title}</h4>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {s.bullets.slice(0, 4).map((b, j) => (
                      <li key={j} className="flex gap-2"><span className="text-primary">▪</span><span>{b}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} apiKey={apiKey} onSave={saveKey} />
    </div>
  );
}
