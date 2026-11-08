"use client";

import { JarItem } from "@/types/gift";

interface JarThumbnailProps {
  item: JarItem;
  isSelected: boolean;
  disabled: boolean;
  showPlaceholder: boolean;
  onClick: (e: React.MouseEvent) => void;
  onHoverChange: (id: string | null) => void;
}

/**
 * One grid cell. The 3D jar itself is painted by JarStage over the [data-jar-cell] box.
 * Don't add transforms or opacity to the button: they would shift the measured cell
 * and trap the halo and badge in the wrong stacking order.
 */
export default function JarThumbnail({
  item,
  isSelected,
  disabled,
  showPlaceholder,
  onClick,
  onHoverChange,
}: JarThumbnailProps) {
  const isLocked = disabled && !isSelected;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      onMouseEnter={() => onHoverChange(item.id)}
      onMouseLeave={() => onHoverChange(null)}
      onFocus={() => onHoverChange(item.id)}
      onBlur={() => onHoverChange(null)}
      aria-label={`${item.name}${isSelected ? " (In your box, click to remove)" : ""}`}
      className={`relative group flex flex-col items-center w-full max-w-[130px] text-center select-none outline-none pt-4 sm:pt-6 ${
        isLocked ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none transition-all duration-300 ${
          isSelected
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-2"
        }`}
      >
        <span className="px-1.5 sm:px-2.5 py-0.5 rounded-full bg-[#f2b31e] text-[#1a1200] font-body text-[8px] sm:text-[10px] font-bold tracking-tight shadow-md whitespace-nowrap">
          In your box
        </span>
        <span className="w-0 h-0 border-l-[3px] sm:border-l-[4px] border-l-transparent border-r-[3px] sm:border-r-[4px] border-r-transparent border-t-[4px] sm:border-t-[5px] border-t-[#f2b31e] -mt-[1px]" />
      </div>

      <div data-jar-cell={item.id} className="relative w-full aspect-[4/5]">
        {isSelected && (
          <div
            className="absolute inset-0 rounded-full blur-xl pointer-events-none animate-pulse"
            style={{
              background:
                "radial-gradient(circle, rgba(242, 179, 30, 0.45) 0%, rgba(230, 191, 90, 0.2) 50%, transparent 75%)",
            }}
          />
        )}

        {/* Flat jar outline, part of the first HTML, shown until the 3D jars are drawn */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${
            showPlaceholder ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        >
          <div className="w-[62%] h-[14%] rounded-t-md rounded-b-sm bg-[#d9a92c]" />
          <div
            className="w-[56%] h-[46%] rounded-b-lg opacity-75"
            style={{
              backgroundColor: `#${item.color.toString(16).padStart(6, "0")}`,
            }}
          />
        </div>
      </div>

      <span
        className={`font-body text-[10px] sm:text-xs md:text-sm tracking-wide mt-1 sm:mt-1.5 leading-tight min-h-[2.5em] line-clamp-2 transition-colors ${
          isSelected
            ? "text-gold font-medium drop-shadow-[0_0_8px_rgba(242,179,30,0.5)]"
            : disabled
            ? "text-fg/40"
            : "text-fg/80 group-hover:text-gold"
        }`}
      >
        {item.name}
      </span>
    </button>
  );
}
