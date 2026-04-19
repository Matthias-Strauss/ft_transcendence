import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
  type RenderTask,
} from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker';
import { apiFetch } from '../../utils/api';

GlobalWorkerOptions.workerPort = new PdfWorker();

type AuthedFilePreviewProps = {
  src?: string;
  fileName?: string;
  mimeType?: string;
  className?: string;
};

export function AuthedFilePreview({
  src,
  fileName,
  mimeType = 'application/pdf',
  className,
}: AuthedFilePreviewProps) {
  const title = fileName || 'Attachment preview';
  const isPdf = mimeType === 'application/pdf';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeFileName = useMemo(() => fileName || title, [fileName, title]);

  useEffect(() => {
    let cancelled = false;

    const cleanupDocument = async () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const pdf = pdfRef.current;
      pdfRef.current = null;

      if (pdf) {
        try {
          await pdf.destroy();
        } catch {
          // ignore cleanup errors
        }
      }
    };

    if (!src || !isPdf) {
      void cleanupDocument();
      setPageCount(0);
      setCurrentPage(1);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPageCount(0);
    setCurrentPage(1);

    void (async () => {
      await cleanupDocument();

      try {
        const res = await apiFetch(src);
        if (!res.ok) {
          throw new Error(`Failed with status ${res.status}`);
        }

        const fileBytes = new Uint8Array(await res.arrayBuffer());
        const loadingTask = getDocument({ data: fileBytes });
        const pdf = await loadingTask.promise;

        if (cancelled) {
          await pdf.destroy();
          return;
        }

        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
        setCurrentPage(1);
      } catch {
        if (!cancelled) {
          setError('Preview unavailable');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      void cleanupDocument();
    };
  }, [isPdf, src]);

  useEffect(() => {
    let cancelled = false;

    const renderPage = async () => {
      const pdf = pdfRef.current;
      const canvas = canvasRef.current;
      const frame = frameRef.current;

      if (!pdf || !canvas || !frame || !pageCount || currentPage < 1 || currentPage > pageCount) {
        return;
      }

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      try {
        const page = await pdf.getPage(currentPage);
        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(frame.clientWidth - 24, 180);
        const scale = availableWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const devicePixelRatio = window.devicePixelRatio || 1;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Canvas context unavailable');
        }

        canvas.width = Math.floor(viewport.width * devicePixelRatio);
        canvas.height = Math.floor(viewport.height * devicePixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        context.clearRect(0, 0, viewport.width, viewport.height);

        const task = page.render({
          canvasContext: context,
          viewport,
        });

        renderTaskRef.current = task;
        await task.promise;

        if (!cancelled) {
          renderTaskRef.current = null;
          setError(null);
        }
      } catch (err) {
        const errorName = typeof err === 'object' && err && 'name' in err ? String(err.name) : '';
        if (!cancelled && errorName !== 'RenderingCancelledException') {
          setError('Preview unavailable');
        }
      }
    };

    if (isPdf && !isLoading && !error) {
      void renderPage();
    }

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [currentPage, error, isLoading, isPdf, pageCount]);

  if (!src) {
    return (
      <div className={className} aria-label={title}>
        <p className="chat-file-preview-fallback">Preview unavailable</p>
      </div>
    );
  }

  if (!isPdf) {
    return (
      <div
        className={`${
          className ?? ''
        } flex min-h-24 items-center justify-center border border-slate-200 bg-slate-50 px-4 py-3 text-center`}
        aria-label={title}
      >
        <div className="flex flex-col items-center gap-2 text-slate-600">
          <FileText className="size-5" />
          <p className="m-0 text-sm font-medium text-slate-700">Attachment ready</p>
          <p className="m-0 max-w-full break-words text-xs text-slate-500">{safeFileName}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className={`${
        className ?? ''
      } flex max-h-[26rem] flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50`}
      aria-label={title}
    >
      <div className="flex min-h-36 flex-1 items-center justify-center overflow-auto bg-white p-3">
        {error ? (
          <p className="m-0 text-sm text-slate-500">{error}</p>
        ) : isLoading ? (
          <p className="m-0 text-sm text-slate-500">Loading preview…</p>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full rounded border border-slate-200 shadow-sm"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2">
        <p className="m-0 min-w-0 truncate text-xs font-medium text-slate-600" title={safeFileName}>
          {safeFileName}
        </p>

        <div className="flex items-center gap-1 text-xs text-slate-500">
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={isLoading || currentPage <= 1 || pageCount <= 1}
            aria-label="Previous PDF page"
          >
            <ChevronLeft className="size-4" />
          </button>

          <span className="min-w-14 text-center font-medium">
            {pageCount > 0 ? `${currentPage}/${pageCount}` : '—'}
          </span>

          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            disabled={isLoading || currentPage >= pageCount || pageCount <= 1}
            aria-label="Next PDF page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
