import React from "react";

export default function Logo({
  className = "w-24 h-24",
  alt = "Meditrap Logo",
}) {
  return (
    <img
      src="/main-logo.png"
      alt={alt}
      className={`mx-auto object-contain ${className} mb-2 ml-0 relative z-10`}
      onError={(event) => {
        event.currentTarget.src = "/final-logo.png";
      }}
    />
  );
}
