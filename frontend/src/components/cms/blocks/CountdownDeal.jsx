import React, { useState, useEffect } from 'react';

/**
 * Countdown Deal block — deal banner with a live countdown timer.
 * CRM settings: { title, endDate, image, productId }
 */
const getTimeLeft = (endDate) => {
  const total = new Date(endDate) - Date.now();
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    expired: false,
  };
};

const pad = (n) => String(n).padStart(2, '0');

const CountdownDeal = ({ settings = {}, title }) => {
  const heading = title || settings.title || 'Deal of the Day';
  const { endDate, image } = settings;

  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endDate) return;
    setTimeLeft(getTimeLeft(endDate));
    const timer = setInterval(() => setTimeLeft(getTimeLeft(endDate)), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!endDate) return null;
  if (timeLeft?.expired) return null;

  return (
    <section className="cl-countdown-deal pt-60 pb-60">
      <div className="container">
        <div className="cl-countdown-deal__inner">
          {image && (
            <div className="cl-countdown-deal__image">
              <img src={image} alt={heading} />
            </div>
          )}
          <div className="cl-countdown-deal__content">
            <h2 className="cl-countdown-deal__title">{heading}</h2>
            {timeLeft && !timeLeft.expired && (
              <div className="cl-countdown-deal__timer">
                {[
                  { label: 'Days', value: timeLeft.days },
                  { label: 'Hours', value: timeLeft.hours },
                  { label: 'Mins', value: timeLeft.minutes },
                  { label: 'Secs', value: timeLeft.seconds },
                ].map(({ label, value }) => (
                  <div key={label} className="cl-countdown-deal__unit">
                    <span className="cl-countdown-deal__number">{pad(value)}</span>
                    <span className="cl-countdown-deal__label">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CountdownDeal;
