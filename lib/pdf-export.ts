// lib/pdf-export.ts
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import type { ExportableQuery } from "./csv-export";

const PAGE_W = 612; // US Letter
const PAGE_H = 792;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

const VIOLET = rgb(0.486, 0.227, 0.929); // #7c3aed
const SLATE_900 = rgb(0.06, 0.07, 0.1);
const SLATE_500 = rgb(0.39, 0.45, 0.55);
const SLATE_200 = rgb(0.89, 0.91, 0.95);
const EMERALD = rgb(0.02, 0.59, 0.41);
const CODE_BG = rgb(0.965, 0.965, 0.975);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    let line = "";
    const words = rawLine.split(" ");
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines;
}

class PdfBuilder {
  doc!: PDFDocument;
  page!: PDFPage;
  y = 0;
  font!: PDFFont;
  bold!: PDFFont;
  mono!: PDFFont;
  pageNum = 0;

  async init() {
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.bold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.mono = await this.doc.embedFont(StandardFonts.Courier);
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pageNum++;
    this.y = PAGE_H - MARGIN;
    this.page.drawText("QueryForge", {
      x: MARGIN, y: PAGE_H - 28, size: 8, font: this.bold, color: VIOLET,
    });
    this.page.drawText(`Page ${this.pageNum}`, {
      x: PAGE_W - MARGIN - 40, y: PAGE_H - 28, size: 8, font: this.font, color: SLATE_500,
    });
    this.y -= 20;
  }

  ensureSpace(h: number) {
    if (this.y - h < MARGIN) this.newPage();
  }

  heading(text: string, size = 18) {
    this.ensureSpace(size + 10);
    this.page.drawText(text, { x: MARGIN, y: this.y, size, font: this.bold, color: SLATE_900 });
    this.y -= size + 8;
  }

  subheading(text: string, color = VIOLET) {
    this.ensureSpace(16);
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 11, font: this.bold, color });
    this.y -= 16;
  }

  paragraph(text: string, opts: { size?: number; color?: ReturnType<typeof rgb>; font?: PDFFont } = {}) {
    const size = opts.size ?? 9.5;
    const font = opts.font ?? this.font;
    const color = opts.color ?? SLATE_900;
    const lines = wrapText(text, font, size, CONTENT_W);
    for (const line of lines) {
      this.ensureSpace(size + 4);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font, color });
      this.y -= size + 4;
    }
  }

  bullet(text: string, color = SLATE_900) {
    const size = 9;
    const lines = wrapText(text, this.font, size, CONTENT_W - 14);
    lines.forEach((line, i) => {
      this.ensureSpace(size + 4);
      if (i === 0) {
        this.page.drawText("•", { x: MARGIN, y: this.y, size, font: this.bold, color: VIOLET });
      }
      this.page.drawText(line, { x: MARGIN + 14, y: this.y, size, font: this.font, color });
      this.y -= size + 4;
    });
  }

  codeBlock(code: string, label: string) {
    const size = 8;
    const lineH = size + 3;
    const lines = wrapText(code, this.mono, size, CONTENT_W - 16);
    const blockH = lines.length * lineH + 24;
    this.ensureSpace(Math.min(blockH, PAGE_H - MARGIN * 2 - 40));

    this.page.drawText(label, { x: MARGIN, y: this.y, size: 8, font: this.bold, color: SLATE_500 });
    this.y -= 12;

    let remaining = lines;
    while (remaining.length > 0) {
      const availableLines = Math.max(1, Math.floor((this.y - MARGIN) / lineH) - 1);
      const chunk = remaining.slice(0, availableLines);
      remaining = remaining.slice(availableLines);
      const chunkH = chunk.length * lineH + 10;

      this.page.drawRectangle({
        x: MARGIN, y: this.y - chunkH, width: CONTENT_W, height: chunkH,
        color: CODE_BG, borderColor: SLATE_200, borderWidth: 0.5,
      });
      let cy = this.y - 12;
      for (const line of chunk) {
        this.page.drawText(line, { x: MARGIN + 8, y: cy, size, font: this.mono, color: SLATE_900 });
        cy -= lineH;
      }
      this.y -= chunkH + 8;
      if (remaining.length > 0) this.newPage();
    }
  }

  divider() {
    this.ensureSpace(16);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y }, end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 0.75, color: SLATE_200,
    });
    this.y -= 16;
  }

  spacer(h = 10) { this.y -= h; }
}

export async function buildPdf(queries: ExportableQuery[], reportTitle = "Optimization Report"): Promise<Uint8Array> {
  const b = new PdfBuilder();
  await b.init();

  b.heading(reportTitle, 20);
  b.paragraph(`Generated ${new Date().toLocaleString()} · ${queries.length} ${queries.length === 1 ? "query" : "queries"}`, { size: 9, color: SLATE_500 });
  b.spacer(14);

  if (queries.length > 1) {
    const avgGain = Math.round(queries.reduce((s, q) => s + q.performanceGain, 0) / queries.length);
    b.subheading("Summary");
    b.paragraph(`Average performance gain: +${avgGain}%  ·  Total optimizations: ${queries.length}`, { size: 9.5 });
    b.spacer(8);
    b.divider();
  }

  queries.forEach((q, idx) => {
    if (idx > 0) {
      b.spacer(4);
      b.divider();
    }
    b.subheading(`${idx + 1}. ${q.title ?? "SQL Query"}`, SLATE_900);
    b.paragraph(`Domain: ${q.domain ?? "General"}   ·   Type: ${q.queryType}   ·   Engine: ${q.engine ?? "claude"}`, { size: 8.5, color: SLATE_500 });
    b.paragraph(`Performance gain: +${q.performanceGain}%${q.costScore != null ? `   ·   Cost score: ${q.costScore}/100` : ""}`, { size: 9.5, color: EMERALD, font: b.bold });
    b.spacer(6);

    if (q.explanation) {
      b.paragraph(q.explanation, { size: 9, color: SLATE_900 });
      b.spacer(6);
    }

    const issues = Array.isArray(q.issues) ? q.issues as Array<{ severity?: string; description?: string }> : [];
    if (issues.length > 0) {
      b.subheading("Issues Found", VIOLET);
      issues.forEach((i) => b.bullet(`[${(i.severity ?? "").toUpperCase()}] ${i.description ?? ""}`));
      b.spacer(6);
    }

    const improvements = Array.isArray(q.improvements) ? q.improvements as string[] : [];
    if (improvements.length > 0) {
      b.subheading("Improvements Applied", VIOLET);
      improvements.forEach((imp) => b.bullet(imp));
      b.spacer(6);
    }

    const indexRecs = Array.isArray(q.indexRecs) ? q.indexRecs as string[] : [];
    if (indexRecs.length > 0) {
      b.subheading("Recommended Indexes", VIOLET);
      indexRecs.forEach((rec) => b.bullet(rec));
      b.spacer(6);
    }

    b.codeBlock(q.originalQuery, "ORIGINAL QUERY");
    b.spacer(4);
    b.codeBlock(q.optimizedQuery, "OPTIMIZED QUERY");
  });

  return b.doc.save();
}
