"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export type CarouselItem = {
  id: string;
  content: ReactNode;
};

type ResponsiveCarouselProps = {
  ariaLabel: string;
  items: CarouselItem[];
  desktopColumns?: 2 | 3;
  className?: string;
};

export default function ResponsiveCarousel({
  ariaLabel,
  items,
  desktopColumns = 2,
  className = "",
}: ResponsiveCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const activeIndexRef = useRef(0);
  const lastInteractionRef = useRef(0);
  const hoverRef = useRef(false);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        const nextIndex = slideRefs.current.findIndex((slide) => slide === visible.target);
        if (nextIndex >= 0) {
          setActiveIndex(nextIndex);
        }
      },
      {
        root: track,
        threshold: [0.5, 0.65, 0.8, 0.95],
      },
    );

    slideRefs.current.forEach((slide) => {
      if (slide) {
        observer.observe(slide);
      }
    });

    return () => observer.disconnect();
  }, [items.length]);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    const slide = slideRefs.current[index];
    if (!track || !slide) {
      return;
    }

    const trackRect = track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const left = slideRect.left - trackRect.left + track.scrollLeft;

    track.scrollTo({
      left,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      if (hoverRef.current || now - lastInteractionRef.current < 2500) {
        return;
      }

      const nextIndex = (activeIndexRef.current + 1) % items.length;
      scrollToIndex(nextIndex);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [items.length, prefersReducedMotion]);

  const step = (direction: -1 | 1) => {
    if (items.length === 0) {
      return;
    }

    const nextIndex = (activeIndex + direction + items.length) % items.length;
    lastInteractionRef.current = Date.now();
    scrollToIndex(nextIndex);
  };

  return (
    <div className={`carousel ${className}`.trim()} role="region" aria-label={ariaLabel}>
      <div className="carousel__controls">
        <button
          type="button"
          className="carousel__button"
          onClick={() => {
            step(-1);
          }}
          disabled={items.length === 0 || activeIndex === 0}
          aria-label="前の項目へ"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="carousel__button"
          onClick={() => {
            step(1);
          }}
          disabled={items.length === 0 || activeIndex === items.length - 1}
          aria-label="次の項目へ"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={trackRef}
        className="carousel__track"
        style={{ "--carousel-columns": desktopColumns } as CSSProperties}
        onPointerDown={() => {
          lastInteractionRef.current = Date.now();
        }}
        onTouchStart={() => {
          lastInteractionRef.current = Date.now();
        }}
        onMouseEnter={() => {
          hoverRef.current = true;
        }}
        onMouseLeave={() => {
          hoverRef.current = false;
        }}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            ref={(element) => {
              slideRefs.current[index] = element;
            }}
            className="carousel__slide"
          >
            {item.content}
          </div>
        ))}
      </div>

      <div className="carousel__dots" aria-label="スライド位置">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`carousel__dot ${index === activeIndex ? "carousel__dot--active" : ""}`}
            onClick={() => {
              lastInteractionRef.current = Date.now();
              scrollToIndex(index);
            }}
            aria-label={`${index + 1}枚目へ`}
            aria-current={index === activeIndex ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
