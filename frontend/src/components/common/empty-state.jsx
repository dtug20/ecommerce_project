import React from "react";
import ClButton from "@/components/clicon/ui/cl-button";

// Inline SVG illustrations — crisp at any size, themeable via CSS vars.
const illustrations = {
  "no-products": (
    <svg
      viewBox="0 0 240 200"
      width="200"
      height="167"
      role="img"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* handle */}
      <path
        d="M100 80c0-30 40-30 40 0"
        stroke="var(--tp-gray-300, #d1d5db)"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* bag body */}
      <path
        d="M78 80h84l-10 90H88L78 80z"
        fill="#fff"
        stroke="var(--tp-gray-400, #9ca3af)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* folded flap */}
      <path
        d="M139 80h23l-11 46-12-46z"
        fill="var(--tp-theme-accent, #0989FF)"
        fillOpacity="0.5"
      />
      {/* sad face */}
      <circle cx="108" cy="116" r="4" fill="var(--tp-gray-400, #9ca3af)" />
      <circle cx="132" cy="116" r="4" fill="var(--tp-gray-400, #9ca3af)" />
      <path
        d="M106 144q14-16 28 0"
        stroke="var(--tp-gray-400, #9ca3af)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* sparkle */}
      <path
        d="M120 150l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8z"
        fill="var(--tp-theme-accent, #0989FF)"
      />
    </svg>
  ),
};

const EmptyState = ({
  illustration = "no-products",
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="tp-empty-state">
      <div className="tp-empty-state__icon">
        {illustrations[illustration] || illustrations["no-products"]}
      </div>
      {title && <h2 className="tp-empty-state__title">{title}</h2>}
      {description && (
        <p className="tp-empty-state__description">{description}</p>
      )}
      {actionText && onAction && (
        <ClButton
          variant="primary"
          className="tp-empty-state__action"
          onClick={onAction}
        >
          {actionText}
        </ClButton>
      )}
    </div>
  );
};

export default EmptyState;
