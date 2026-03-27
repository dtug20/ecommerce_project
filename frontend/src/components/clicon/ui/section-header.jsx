import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

/**
 * Reusable section header with title, optional browse link, and custom right content.
 *
 * @param {Object} props
 * @param {string} props.title - Section heading text
 * @param {string} [props.subtitle] - Optional subtitle below the title
 * @param {string} [props.browseLink] - URL for the "Browse All" link
 * @param {string} [props.browseLinkText] - Custom text for browse link
 * @param {React.ReactNode} [props.rightContent] - Custom content for the right side (e.g., countdown, tabs)
 * @param {boolean} [props.hasBorder=true] - Show bottom border
 * @param {boolean} [props.centered=false] - Center the title
 * @param {string} [props.className] - Additional CSS class
 */
const SectionHeader = ({
  title,
  subtitle,
  browseLink,
  browseLinkText,
  rightContent,
  hasBorder = true,
  centered = false,
  className = '',
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`cl-section-header${hasBorder ? ' cl-section-header--bordered' : ''}${centered ? ' cl-section-header--centered' : ''}${className ? ` ${className}` : ''}`}
    >
      <div className="cl-section-header__left">
        <h2 className="cl-section-header__title">{title}</h2>
        {subtitle && (
          <p className="cl-section-header__subtitle">{subtitle}</p>
        )}
        {rightContent && (
          <div className="cl-section-header__extra">{rightContent}</div>
        )}
      </div>

      {browseLink && (
        <Link href={browseLink} className="cl-browse-link">
          {browseLinkText || t('section.browseAll', 'Browse All Product')}
          <i className="fa-solid fa-arrow-right ms-1" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
