import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  apiKey: string;
  onSave: (k: string) => void;
}

export function SettingsDialog({ open, onOpenChange, apiKey, onSave }: Props) {
  const [value, setValue] = useState(apiKey);
  useEffect(() => setValue(apiKey), [apiKey, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Settings</DialogTitle>
          <DialogDescription>
            Your Gemini API key is stored locally in your browser and never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="key">Google Gemini API Key</Label>
          <Input
            id="key"
            type="password"
            placeholder="AIza..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Get a key at{" "}
            <a className="underline text-primary" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
              Google AI Studio
            </a>.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(value.trim()); onOpenChange(false); }}>Save key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
