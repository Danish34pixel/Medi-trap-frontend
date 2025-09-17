import React from 'react';


export default function Logo({ className = 'w-20 h-20', alt = 'MedTrap Logo' }) {
  return (
    <img
      src="/Gemini_Generated_Image_hnxythhnxythhnxy-removebg-preview.png"
      alt={alt}
      className={`mx-auto ${className} mb-4 relative z-10`}
    />
  );
}
