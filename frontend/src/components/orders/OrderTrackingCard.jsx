import React, { useState } from 'react';
import dayjs from 'dayjs';

/**
 * Shows carrier/tracking info and a "Track Package" external link.
 * Only rendered when order.trackingNumber is set.
 *
 * Props:
 *  trackingNumber    — string
 *  carrier           — string (optional, e.g. "UPS", "FedEx", "USPS")
 *  trackingUrl       — string (optional override URL)
 *  estimatedDelivery — date string (optional)
 */

// Default carrier tracking URL templates
const CARRIER_URLS = {
  ups: 'https://www.ups.com/track?tracknum={tracking}',
  fedex: 'https://www.fedex.com/fedextrack/?tracknumbers={tracking}',
  usps: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking}',
  dhl: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking}',
};

const buildTrackingUrl = (carrier, trackingNumber, overrideUrl) => {
  if (overrideUrl) return overrideUrl;
  const key = (carrier || '').toLowerCase();
  const template = CARRIER_URLS[key];
  if (template) return template.replace('{tracking}', encodeURIComponent(trackingNumber));
  // Generic fallback — Google search
  return `https://www.google.com/search?q=${encodeURIComponent(`track package ${trackingNumber}`)}`;
};

const OrderTrackingCard = ({ trackingNumber, carrier, trackingUrl, estimatedDelivery }) => {
  const [copied, setCopied] = useState(false);

  if (!trackingNumber) return null;

  const url = buildTrackingUrl(carrier, trackingNumber, trackingUrl);

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="tp-order-tracking-card p-3 mb-30"
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#f9fafb',
      }}
    >
      <h5 className="mb-15">
        <i className="fa-regular fa-truck me-2" style={{ color: '#821F40' }} />
        Shipment Tracking
      </h5>

      <div className="row g-3">
        {carrier && (
          <div className="col-md-4">
            <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>Carrier</p>
            <p className="mb-0 fw-bold" style={{ fontSize: '14px' }}>{carrier}</p>
          </div>
        )}

        <div className="col-md-carrier">
          <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>Tracking Number</p>
          <div className="d-flex align-items-center gap-2">
            <p className="mb-0 fw-bold" style={{ fontSize: '14px', fontFamily: 'monospace' }}>
              {trackingNumber}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              title="Copy tracking number"
              style={{
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                cursor: 'pointer',
                color: copied ? '#16a34a' : '#555',
                transition: 'color 0.2s',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {estimatedDelivery && (
          <div className="col-md-4">
            <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>Estimated Delivery</p>
            <p className="mb-0 fw-bold" style={{ fontSize: '14px' }}>
              {dayjs(estimatedDelivery).format('MMM D, YYYY')}
            </p>
          </div>
        )}
      </div>

      <div className="mt-15">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="tp-btn tp-color-btn banner-animation"
          style={{ fontSize: '13px', padding: '8px 20px', display: 'inline-block' }}
        >
          <i className="fa-regular fa-arrow-up-right-from-square me-2" />
          Track Package
        </a>
      </div>
    </div>
  );
};

export default OrderTrackingCard;
