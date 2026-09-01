import React, { useState, useEffect } from 'react';

export default function AnimatedNumber({ value, duration = 1200, suffix = '', prefix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (target === 0) {
      setDisplayValue(0);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeOutQuart(progress);
      
      const current = Math.round(easedProgress * target * 10) / 10;
      setDisplayValue(Number.isInteger(target) ? Math.round(current) : current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return (
    <span>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
