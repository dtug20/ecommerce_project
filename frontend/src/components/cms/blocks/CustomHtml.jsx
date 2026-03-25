import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Custom HTML block — renders arbitrary sanitized HTML from admin.
 * CRM settings: { html }
 */
const CustomHtml = ({ settings = {} }) => {
  const raw = settings.html || '';
  if (!raw.trim()) return null;

  const clean = typeof DOMPurify?.sanitize === 'function' ? DOMPurify.sanitize(raw) : '';

  return (
    <section className="cl-custom-html">
      <div className="container">
        <div dangerouslySetInnerHTML={{ __html: clean }} />
      </div>
    </section>
  );
};

export default CustomHtml;
