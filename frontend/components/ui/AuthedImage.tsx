import { fetchAuthedImageURL } from '../../utils/api';
import { useEffect, useState, type ImgHTMLAttributes } from 'react';

type AuthedImageProps = ImgHTMLAttributes<HTMLImageElement>;

export function AuthedImage({ src, alt = '', ...props }: AuthedImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(() => {
    if (typeof src === 'string' && src.startsWith('/files/')) return undefined;
    return typeof src === 'string' ? src : undefined;
  });

  useEffect(() => {
    if (!src || typeof src !== 'string' || !src.startsWith('/files/')) {
      setResolvedSrc(typeof src === 'string' ? src : undefined);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;
    const srcDef = src;

    async function loadImage() {
      try {
        objectUrl = await fetchAuthedImageURL(srcDef);

        if (active) {
          setResolvedSrc(objectUrl);
        }
      } catch (e) {
        if (active) {
          setResolvedSrc(undefined);
        }
      }
    }

    void loadImage();

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return <img src={resolvedSrc} alt={alt} {...props} />;
}
