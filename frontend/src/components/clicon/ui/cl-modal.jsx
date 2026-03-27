import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Clicon modal dialog.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {'sm'|'md'|'lg'} [props.size='md'] - sm=400px, md=560px, lg=720px
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.footer]
 * @param {string} [props.className]
 */
const ClModal = ({
  isOpen,
  onClose,
  size = 'md',
  title,
  children,
  footer,
  className = '',
}) => {
  const { t } = useTranslation();
  const overlayRef = useRef(null);
  const contentRef = useRef(null);

  // Close on Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={`cl-modal-overlay${className ? ` ${className}` : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'cl-modal-title' : undefined}
    >
      <div ref={contentRef} className={`cl-modal cl-modal--${size}`}>
        {/* Header */}
        {title && (
          <div className="cl-modal__header">
            <h3 id="cl-modal-title" className="cl-modal__title">{title}</h3>
          </div>
        )}

        {/* Close button */}
        <button
          type="button"
          className="cl-modal__close"
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>

        {/* Body */}
        <div className="cl-modal__body">{children}</div>

        {/* Footer */}
        {footer && <div className="cl-modal__footer">{footer}</div>}
      </div>
    </div>
  );
};

export default ClModal;
