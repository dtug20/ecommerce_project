import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Horizontal order status stepper.
 *
 * @param {Object} props
 * @param {string} props.currentStatus - One of: 'pending', 'processing', 'shipped', 'delivered', 'cancel'
 * @param {string} [props.className]
 */

const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const OrderStatusStepper = ({ currentStatus, className = '' }) => {
  const { t } = useTranslation();

  const isCancelled = currentStatus === 'cancel' || currentStatus === 'cancelled' || currentStatus === 'canceled';

  const stepLabels = {
    pending: t('order.placed', 'Order Placed'),
    processing: t('order.processing', 'Processing'),
    shipped: t('order.shipped', 'Shipped'),
    delivered: t('order.delivered', 'Delivered'),
  };

  const stepIcons = {
    pending: 'fa-solid fa-clipboard-list',
    processing: 'fa-solid fa-gear',
    shipped: 'fa-solid fa-truck',
    delivered: 'fa-solid fa-circle-check',
  };

  const currentIndex = STEPS.indexOf(currentStatus);

  if (isCancelled) {
    return (
      <div className={`cl-stepper cl-stepper--cancelled${className ? ` ${className}` : ''}`}>
        <div className="cl-stepper__cancelled-badge">
          <i className="fa-solid fa-ban" aria-hidden="true" />
          <span>{t('order.cancelled', 'Order Cancelled')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`cl-stepper${className ? ` ${className}` : ''}`} role="list">
      {STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STEPS.length - 1;

        return (
          <div
            key={step}
            className={`cl-stepper__step${isCompleted ? ' cl-stepper__step--completed' : ''}${isCurrent ? ' cl-stepper__step--current' : ''}`}
            role="listitem"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="cl-stepper__icon">
              <i className={stepIcons[step]} aria-hidden="true" />
            </div>
            <span className="cl-stepper__label">{stepLabels[step]}</span>
            {!isLast && <div className="cl-stepper__connector" />}
          </div>
        );
      })}
    </div>
  );
};

export default OrderStatusStepper;
