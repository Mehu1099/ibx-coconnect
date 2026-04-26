import { type RefObject, useEffect, useRef, useState } from "react";

// A projection of the on-screen image: where it actually lives in
// container pixels, plus a function to map natural-image %-coords
// (which is how pins and the IBX route are stored) to screen pixels.
//
// With object-fit: cover, parts of the image are cropped, so a naive
// `left: x%` on a positioned child drifts as the viewport changes.
// The projection accounts for the cropping and (optionally) a mobile
// zoom + focus point.
export interface ImageProjection {
  imageScreenX: number;
  imageScreenY: number;
  imageScreenWidth: number;
  imageScreenHeight: number;
  containerWidth: number;
  containerHeight: number;
  /** Maps a (xPercent, yPercent) of the natural image to container
   *  pixels. `visible` is false if the point lies in the cropped band. */
  projectPin: (
    xPercent: number,
    yPercent: number,
  ) => { x: number; y: number; visible: boolean };
}

export function useImageProjection(
  containerRef: RefObject<HTMLElement | null>,
  imageNaturalWidth: number,
  imageNaturalHeight: number,
  fitMode: "cover" | "contain" = "cover",
  // For mobile portrait, apply additional zoom and shift the visible
  // window to keep the most relevant part of the image on-screen.
  mobileZoom: number = 1,
  mobileFocusX: number = 50,
  mobileFocusY: number = 50,
): ImageProjection | null {
  const [projection, setProjection] = useState<ImageProjection | null>(null);

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ResizeObserver fires on every layout change — during a drag-resize
    // that's 60+/sec. Coalesce with rAF so we only ever compute once
    // per frame (the next paint can't use anything more anyway).
    function calculate() {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        compute();
      });
    }

    function compute() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      if (containerWidth <= 0 || containerHeight <= 0) return;

      const imageAspect = imageNaturalWidth / imageNaturalHeight;
      const containerAspect = containerWidth / containerHeight;

      let renderedWidth: number;
      let renderedHeight: number;
      let imageOffsetX = 0;
      let imageOffsetY = 0;

      if (fitMode === "cover") {
        // Whichever dimension is the constraint, scale to it (then
        // multiply by mobileZoom to allow oversize cropping).
        if (imageAspect > containerAspect) {
          renderedHeight = containerHeight * mobileZoom;
          renderedWidth = renderedHeight * imageAspect;
        } else {
          renderedWidth = containerWidth * mobileZoom;
          renderedHeight = renderedWidth / imageAspect;
        }
        // Anchor the focus point of the image to the same % of the
        // container. focus = 50/50 ⇒ centered (default cover behaviour).
        imageOffsetX = (mobileFocusX / 100) * (containerWidth - renderedWidth);
        imageOffsetY = (mobileFocusY / 100) * (containerHeight - renderedHeight);
      } else {
        // contain — image fits entirely with letterbox bands.
        if (imageAspect > containerAspect) {
          renderedWidth = containerWidth;
          renderedHeight = renderedWidth / imageAspect;
          imageOffsetY = (containerHeight - renderedHeight) / 2;
        } else {
          renderedHeight = containerHeight;
          renderedWidth = renderedHeight * imageAspect;
          imageOffsetX = (containerWidth - renderedWidth) / 2;
        }
      }

      function projectPin(xPercent: number, yPercent: number) {
        const screenX = imageOffsetX + (xPercent / 100) * renderedWidth;
        const screenY = imageOffsetY + (yPercent / 100) * renderedHeight;
        const visible =
          screenX >= 0 &&
          screenX <= containerWidth &&
          screenY >= 0 &&
          screenY <= containerHeight;
        return { x: screenX, y: screenY, visible };
      }

      setProjection({
        imageScreenX: imageOffsetX,
        imageScreenY: imageOffsetY,
        imageScreenWidth: renderedWidth,
        imageScreenHeight: renderedHeight,
        containerWidth,
        containerHeight,
        projectPin,
      });
    }

    // First measurement runs synchronously so SSR-mounted children
    // don't flash before projection is ready.
    compute();

    const observer = new ResizeObserver(calculate);
    observer.observe(container);
    window.addEventListener("orientationchange", calculate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      observer.disconnect();
      window.removeEventListener("orientationchange", calculate);
    };
  }, [
    containerRef,
    imageNaturalWidth,
    imageNaturalHeight,
    fitMode,
    mobileZoom,
    mobileFocusX,
    mobileFocusY,
  ]);

  return projection;
}
