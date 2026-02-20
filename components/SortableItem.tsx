"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  id: string;
  label: string;
  description?: string;
  rank: number;
  moved: boolean;
}

export default function SortableItem({ id, label, description, rank, moved }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`sortable-item ${moved ? "moved" : "unmoved"} ${isDragging ? "dragging" : ""}`}
      {...attributes}
      {...listeners}
    >
      <span className="item-rank">{rank}</span>
      <span className="item-label">
        {label}
        {description && <span className="item-desc">{description}</span>}
      </span>
      <span className="item-status">{moved ? "✓ Set" : "Arrange me"}</span>
      <span className="item-handle">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="6" r="1.5" fill="currentColor" />
          <circle cx="15" cy="6" r="1.5" fill="currentColor" />
          <circle cx="9" cy="12" r="1.5" fill="currentColor" />
          <circle cx="15" cy="12" r="1.5" fill="currentColor" />
          <circle cx="9" cy="18" r="1.5" fill="currentColor" />
          <circle cx="15" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </span>
    </li>
  );
}
