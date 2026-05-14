import mammoth from "mammoth";
import * as XLSX from "xlsx";
import PptxGenJS from "pptxgenjs";

export type Slide = { title: string; bullets: string[] };

export async function extractFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = await file.arrayBuffer();
  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return value;
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const wb = XLSX.read(buf, { type: "array" });
    const parts: string[] = [];
    wb.SheetNames.forEach((n) => {
      parts.push(`# Sheet: ${n}`);
      parts.push(XLSX.utils.sheet_to_csv(wb.Sheets[n]));
    });
    return parts.join("\n\n");
  }
  throw new Error("Unsupported file type. Use .docx or .xlsx");
}

export async function generateSlidesFromGemini(apiKey: string, content: string): Promise<Slide[]> {
  const trimmed = content.slice(0, 30000);
  const systemPrompt =
    "Analyze this data and return a JSON array of 5 slides. Each slide needs a 'title' and an array of 'bullets'. Use professional, high-level consultant language.";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\nDATA:\n${trimmed}` }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              bullets: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["title", "bullets"],
          },
        },
      },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  const slides = JSON.parse(text) as Slide[];
  if (!Array.isArray(slides) || slides.length === 0) throw new Error("AI returned no slides");
  return slides;
}

export async function buildPptx(slides: Slide[], filename = "SlideStream.pptx") {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = "SlideStream Presentation";

  const NAVY = "1E3A8A";
  const ACCENT = "2563EB";
  const GREY = "475569";
  const LIGHT = "F1F5F9";

  // Title slide
  const title = pptx.addSlide();
  title.background = { color: NAVY };
  title.addShape("rect", { x: 0, y: 6.4, w: 13.33, h: 0.1, fill: { color: ACCENT } });
  title.addText("SlideStream Briefing", {
    x: 0.6, y: 2.6, w: 12, h: 1.2, fontSize: 44, bold: true, color: "FFFFFF", fontFace: "Calibri",
  });
  title.addText("AI-generated executive summary", {
    x: 0.6, y: 3.9, w: 12, h: 0.6, fontSize: 20, color: "CBD5E1", fontFace: "Calibri",
  });

  slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: NAVY } });
    slide.addShape("rect", { x: 0, y: 0.9, w: 13.33, h: 0.06, fill: { color: ACCENT } });
    slide.addText(s.title, {
      x: 0.6, y: 0.15, w: 12, h: 0.6, fontSize: 24, bold: true, color: "FFFFFF", fontFace: "Calibri",
    });
    slide.addText(
      (s.bullets || []).map((b) => ({ text: b, options: { bullet: { code: "25A0" }, color: GREY } })),
      { x: 0.7, y: 1.4, w: 12, h: 5.4, fontSize: 18, fontFace: "Calibri", paraSpaceAfter: 10, valign: "top" }
    );
    slide.addShape("rect", { x: 0, y: 7.3, w: 13.33, h: 0.2, fill: { color: LIGHT } });
    slide.addText(`SlideStream  •  ${i + 1} / ${slides.length}`, {
      x: 0.6, y: 7.05, w: 12, h: 0.3, fontSize: 10, color: GREY, fontFace: "Calibri",
    });
  });

  await pptx.writeFile({ fileName: filename });
}
