import React from 'react';
import dayjs from 'dayjs';

const STEPS = [
  { key: 'pending',    label: 'Order Placed',  icon: 'fa-regular fa-circle-check' },
  { key: 'processing', label: 'Processing',     icon: 'fa-regular fa-gear' },
  { key: 'shipped',    label: 'Shipped',         icon: 'fa-regular fa-truck' },
  { key: 'delivered',  label: 'Delivered',       icon: 'fa-regular fa-box-open' },
];

const STATUS_RANK = {
  pending: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
  cancel: -1,
};

/**
 * Vertical stepper showing order progress.
 *
 * Props:
 *  status        — current order status string (e.g. "pending", "shipped", "delivered", "cancel")
 *  statusHistory — optional array of { status, timestamp } events from the backend
 *  createdAt     — order creation date (used as fallback for "Order Placed" timestamp)
 */
const OrderStatusTimeline = ({ status, statusHistory = [], createdAt }) => {
  const isCancelled = status?.toLowerCase() === 'cancel' || status?.toLowerCase() === 'cancelled';
  const currentRank = STATUS_RANK[status?.toLowerCase()] ?? 0;

  // Build a map of status -> timestamp from history
  const timestampMap = {};
  statusHistory.forEach((entry) => {
    const key = entry.status?.toLowerCase();
    if (key) timestampMap[key] = entry.timestamp || entry.createdAt;
  });
  // Always add the order placed timestamp
  if (createdAt && !timestampMap.pending) {
    timestampMap.pending = createdAt;
  }

  if (isCancelled) {
    return (
      <div className="tp-order-timeline mb-30">
        <h5 className="mb-15">Order Status</h5>
        <div
          className="d-flex align-items-center gap-3 p-3"
          style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #fca5a5',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className="fa-regular fa-xmark" style={{ color: '#fff' }} />
          </div>
          <div>
            <p className="mb-0 fw-bold" style={{ color: '#dc2626' }}>Order Cancelled</p>
            {timestampMap.cancel && (
              <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                {dayjs(timestampMap.cancel).format('MMM D, YYYY h:mm A')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-order-timeline mb-30">
      <h5 className="mb-20">Order Status</h5>
      <div style={{ position: 'relative' }}>
        {/* Vertical connector line */}
        <div
          style={{
            position: 'absolute',
            left: '17px',
            top: '18px',
            bottom: '18px',
            width: '2px',
            backgroundColor: '#e5e7eb',
            zIndex: 0,
          }}
        />

        {STEPS.map((step, index) => {
          const stepRank = STATUS_RANK[step.key];
          const isCompleted = currentRank >= stepRank;
          const isCurrent = currentRank === stepRank;
          const timestamp = timestampMap[step.key];

          return (
            <div
              key={step.key}
              className="d-flex align-items-start gap-3 mb-20"
              style={{ position: 'relative', zIndex: 1 }}
            >
              {/* Step circle */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted ? '#821F40' : '#e5e7eb',
                  border: isCurrent ? '3px solid #821F40' : isCompleted ? '3px solid #821F40' : '3px solid #d1d5db',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isCurrent ? '0 0 0 4px rgba(130,31,64,0.15)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <i
                  className={step.icon}
                  style={{
                    color: isCompleted ? '#fff' : '#9ca3af',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Step content */}
              <div style={{ paddingTop: '6px' }}>
                <p
                  className="mb-0 fw-bold"
                  style={{
                    fontSize: '14px',
                    color: isCompleted ? '#111' : '#9ca3af',
                  }}
                >
                  {step.label}
                  {isCurrent && (
                    <span
                      className="ms-2 badge"
                      style={{
                        backgroundColor: '#821F40',
                        fontSize: '10px',
                        padding: '3px 8px',
                        verticalAlign: 'middle',
                      }}
                    >
                      Current
                    </span>
                  )}
                </p>
                {timestamp ? (
                  <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>
                    {dayjs(timestamp).format('MMM D, YYYY h:mm A')}
                  </p>
                ) : isCompleted ? (
                  <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>Completed</p>
                ) : (
                  <p className="mb-0" style={{ fontSize: '12px', color: '#d1d5db' }}>Pending</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusTimeline;
