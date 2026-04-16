import { useEffect, useMemo, useState } from 'react';
import { fetchAuthedFileURL } from '../../utils/api';

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
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>();
  const [previewUnavailable, setPreviewUnavailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const title = useMemo(() => fileName || 'Attachment preview', [fileName]);

  useEffect(() => {
    if (!src) {
      setResolvedSrc(undefined);
      setPreviewUnavailable(true);
      setIsLoading(false);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    setPreviewUnavailable(false);
    setIsLoading(true);

    async function loadPreview() {
      try {
        objectUrl = await fetchAuthedFileURL(src);

        if (active) {
          setResolvedSrc(objectUrl);
          setIsLoading(false);
        }
      } catch {
        if (active) {
          setResolvedSrc(undefined);
          setPreviewUnavailable(true);
          setIsLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (isLoading) {
    return (
      <div className={className} aria-label={title}>
        <p className="chat-file-preview-fallback">Loading preview…</p>
      </div>
    );
  }

  if (previewUnavailable || !resolvedSrc) {
    return (
      <div className={className} aria-label={title}>
        <p className="chat-file-preview-fallback">Preview unavailable</p>
      </div>
    );
  }

  return (
    <object
      data={resolvedSrc}
      type={mimeType}
      aria-label={title}
      className={className}
      title={title}
    >
      <iframe src={resolvedSrc} title={title} className={className} />
    </object>
  );
}
