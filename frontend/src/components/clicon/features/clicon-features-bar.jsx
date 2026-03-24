import React from 'react';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Static feature data — icons use Font Awesome 6 free classes
// ---------------------------------------------------------------------------
const FEATURES = [
  {
    id: 'delivery',
    icon: 'fa-solid fa-truck-fast',
    titleKey: 'features.delivery',
    subtitleKey: 'features.deliverySub',
  },
  {
    id: 'return',
    icon: 'fa-solid fa-trophy',
    titleKey: 'features.return',
    subtitleKey: 'features.returnSub',
  },
  {
    id: 'secure',
    icon: 'fa-solid fa-credit-card',
    titleKey: 'features.secure',
    subtitleKey: 'features.secureSub',
  },
  {
    id: 'support',
    icon: 'fa-solid fa-headset',
    titleKey: 'features.support',
    subtitleKey: 'features.supportSub',
  },
];

const CliconFeaturesBar = () => {
  const { t } = useTranslation();

  return (
    <div className="cl-features-bar" data-testid="clicon-features-bar">
      <div className="container">
        <div className="cl-features-bar__inner">
          {FEATURES.map((feature, index) => (
            <React.Fragment key={feature.id}>
              <div
                className="cl-feature-item"
                data-testid={`clicon-feature-${feature.id}`}
              >
                <div className="cl-feature-item__icon" aria-hidden="true">
                  <i className={feature.icon} />
                </div>
                <div className="cl-feature-item__text">
                  <h4 className="cl-feature-item__title">{t(feature.titleKey)}</h4>
                  <p className="cl-feature-item__subtitle">{t(feature.subtitleKey)}</p>
                </div>
              </div>
              {/* Vertical divider between items — hidden on mobile */}
              {index < FEATURES.length - 1 && (
                <span className="cl-features-bar__divider" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CliconFeaturesBar;
