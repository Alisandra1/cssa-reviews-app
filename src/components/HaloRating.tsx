"use client";

import { useState } from "react";

const CAPTIONS: Record<number, string> = {
  1: "Very poor",
  2: "Poor",
  3: "Below average",
  4: "Needs improvement",
  5: "Average",
  6: "Satisfactory",
  7: "Good",
  8: "Very good",
  9: "Excellent",
  10: "Outstanding",
};

export default function HaloRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="halo-section">
      <div className="halo-value">
        {shown ? shown : "–"}
        <span className="of10"> / 10</span>
      </div>
      <div className="halo-caption">{shown ? CAPTIONS[shown] : "\u00A0"}</div>
      <div className="halo-arc">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={`halo-btn${n <= shown ? " filled" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
