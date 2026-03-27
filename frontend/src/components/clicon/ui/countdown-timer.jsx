import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useCountdown from '@/hooks/use-countdown';

/**
 * Countdown timer display with labeled time units.
 *
 * @param {Object} props
 * @param {Date} [props.targetDate] - Target date. If omitted, counts to midnight.
 * @param {function} [props.onComplete] - Called when countdown reaches zero
 * @param {boolean} [props.showDays=false] - Show days unit
 * @param {string} [props.label] - Optional label before the timer (e.g., "Ends in:")
 * @param {string} [props.className] - Additional CSS class
 */
const CountdownTimer = ({
  targetDate,
  onComplete,
  showDays = false,
  label,
  className = '',
}) => {
  const { t } = useTranslation();
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  useEffect(() => {
    if (isExpired && onComplete) {
      onComplete();
    }
  }, [isExpired, onComplete]);

  return (
    <div
      className={`cl-countdown${className ? ` ${className}` : ''}`}
      aria-live="off"
      data-testid="cl-countdown"
    >
      {label && <span className="cl-countdown__label">{label}</span>}
      <div className="cl-countdown__units">
        {showDays && (
          <>
            <div className="cl-countdown__unit">
              <span className="cl-countdown__value">{days}</span>
              <span className="cl-countdown__unit-label">
                {t('countdown.days', 'Days')}
              </span>
            </div>
            <span className="cl-countdown__sep" aria-hidden="true">:</span>
          </>
        )}
        <div className="cl-countdown__unit">
          <span className="cl-countdown__value">{hours}</span>
          <span className="cl-countdown__unit-label">
            {t('countdown.hours', 'Hrs')}
          </span>
        </div>
        <span className="cl-countdown__sep" aria-hidden="true">:</span>
        <div className="cl-countdown__unit">
          <span className="cl-countdown__value">{minutes}</span>
          <span className="cl-countdown__unit-label">
            {t('countdown.minutes', 'Min')}
          </span>
        </div>
        <span className="cl-countdown__sep" aria-hidden="true">:</span>
        <div className="cl-countdown__unit">
          <span className="cl-countdown__value">{seconds}</span>
          <span className="cl-countdown__unit-label">
            {t('countdown.seconds', 'Sec')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
