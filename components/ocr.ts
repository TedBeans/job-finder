/** Browser-side text recognition for image-only PDFs and photos of a resume. Runs on the user's device; nothing is uploaded. */
export type Progress = (message: string, pct?: number) => void;

async function pdfToCanvases(file: File, onProgress: Progress): Promise<HTMLCanvasElement[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = Math.min(doc.numPages, 3);
  const out: HTMLCanvasElement[] = [];
  for (let i = 1; i <= pages; i++) {
    onProgress(`Preparing page ${i} of ${pages}`);
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(3, 2000 / base.width) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
    out.push(canvas);
  }
  return out;
}

export async function ocrFile(file: File, onProgress: Progress): Promise<string> {
  const isPdf = file.name.toLowerCase().endsWith(".pdf");
  const images: (HTMLCanvasElement | File)[] = isPdf ? await pdfToCanvases(file, onProgress) : [file];
  onProgress("Loading text recognition (first time takes a few seconds)");
  const { createWorker } = await import("tesseract.js");
  // Optional self-hosting: set NEXT_PUBLIC_OCR_BASE to a folder holding worker.min.js, the core files and eng.traineddata.gz.
  const base = process.env.NEXT_PUBLIC_OCR_BASE;
  const worker = await createWorker("eng", 1, {
    ...(base ? { workerPath: `${base}/worker.min.js`, corePath: `${base}/core`, langPath: base } : {}),
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress("Reading the text", Math.round(m.progress * 100));
    },
  });
  try {
    let text = "";
    for (const img of images) text += (await worker.recognize(img)).data.text + "\n";
    return text.trim();
  } finally {
    await worker.terminate();
  }
}
