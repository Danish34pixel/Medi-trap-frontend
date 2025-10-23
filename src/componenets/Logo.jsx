import React from 'react';


export default function Logo({ className = 'w-20 h-20', alt = 'MedTrap Logo' }) {
  return (
    <img
      src="/main-logo.png"
      alt={alt}
      className={`mx-auto ${className} mb-4 relative z-10`}
    />
  );
}
