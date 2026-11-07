"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  if (!current) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-3xl border border-line bg-panel text-muted">
        No photography on file
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line bg-panel">
        <Image
          src={current}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border ${
                index === active ? "border-gold" : "border-line"
              }`}
            >
              <Image
                src={image}
                alt={`${alt} view ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
