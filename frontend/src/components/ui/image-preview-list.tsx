import { X, FileText } from "lucide-react";
import { cn } from "./utils";
import type { PreviewItem } from "@/utils/filePreviewHelpers";

export interface ImagePreviewListProps {
  /** Array of preview items to display */
  items: PreviewItem[];
  /** Callback when an item is removed (optional, for edit modes) */
  onRemove?: (item: PreviewItem) => void;
  /** Layout: grid or row */
  layout?: "grid" | "row";
  /** Number of columns for grid layout */
  gridCols?: 1 | 2 | 3 | 4;
  /** Size of preview thumbnails */
  size?: "sm" | "md" | "lg";
  /** Show file names */
  showNames?: boolean;
  /** Show file sizes */
  showSizes?: boolean;
  /** RTL support */
  isRTL?: boolean;
  /** Custom className */
  className?: string;
  /** Labels for items (e.g., "Front", "Back" for ID documents) */
  itemLabels?: string[] | ((item: PreviewItem, index: number) => string);
  /** Whether items are clickable to enlarge */
  clickable?: boolean;
  /** Callback when item is clicked */
  onItemClick?: (item: PreviewItem, index: number) => void;
}

const sizeClasses = {
  sm: "w-20 h-20",
  md: "w-32 h-32",
  lg: "w-48 h-48",
};

export function ImagePreviewList({
  items,
  onRemove,
  layout = "grid",
  gridCols = 2,
  size = "md",
  showNames = true,
  showSizes = false,
  isRTL = false,
  className,
  itemLabels,
  clickable = false,
  onItemClick,
}: ImagePreviewListProps) {
  if (items.length === 0) {
    return null;
  }

  const getItemLabel = (item: PreviewItem, index: number): string | undefined => {
    if (!itemLabels) return undefined;
    if (typeof itemLabels === "function") {
      return itemLabels(item, index);
    }
    return itemLabels[index];
  };

  const handleItemClick = (item: PreviewItem, index: number) => {
    if (clickable && onItemClick) {
      onItemClick(item, index);
    }
  };

  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[gridCols];

  return (
    <div
      className={cn(
        layout === "grid" ? gridColsClass : "flex flex-wrap gap-4",
        "gap-4",
        className
      )}
    >
      {items.map((item, index) => {
        const label = getItemLabel(item, index);
        const isImage = item.url && (
          item.url.startsWith("blob:") ||
          item.url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i) ||
          item.file?.type?.startsWith("image/")
        );

        return (
          <div
            key={item.id}
            className={cn(
              "relative group",
              layout === "row" && "flex-shrink-0"
            )}
          >
            {/* Preview Container */}
            <div
              className={cn(
                "relative rounded-lg overflow-hidden border border-white/10 bg-white/5",
                sizeClasses[size],
                clickable && "cursor-pointer hover:border-primary/50 transition-all",
                !isImage && "flex items-center justify-center"
              )}
              onClick={() => handleItemClick(item, index)}
            >
              {isImage ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2">
                  <FileText className="w-8 h-8 text-white/40" />
                  {showNames && (
                    <span className="text-xs text-[#B9BBC6] mt-1 truncate max-w-full">
                      {item.name}
                    </span>
                  )}
                </div>
              )}

              {/* Remove Button (for edit modes) */}
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item);
                  }}
                  className={cn(
                    "absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 hover:bg-black/90",
                    "flex items-center justify-center transition-colors cursor-pointer",
                    "opacity-0 group-hover:opacity-100"
                  )}
                  aria-label={isRTL ? "إزالة" : "Remove"}
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              )}

              {/* Item Label Overlay (e.g., "Front", "Back") */}
              {label && (
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 text-center",
                    isRTL ? "text-right" : "text-left"
                  )}
                >
                  {label}
                </div>
              )}
            </div>

            {/* File Info Below Preview */}
            {(showNames || showSizes) && (
              <div
                className={cn(
                  "mt-2 space-y-1",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                {showNames && (
                  <p
                    className="text-xs text-white/80 truncate"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                )}
                {showSizes && item.size && (
                  <p className="text-xs text-white/40">
                    {(item.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

