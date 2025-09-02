import React from "react";
import "../styles/Spinner.css";

interface SpinnerProps {
  fullscreen?: boolean; // centers in a container if false, takes full height if true
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ fullscreen = false, size = "md", ariaLabel = "Loading" }) => {
  return (
    <div className={fullscreen ? "spinner-wrapper fullscreen" : "spinner-wrapper"} aria-busy="true" aria-live="polite" aria-label={ariaLabel}>
      <div className={`spinner ${size}`}></div>
    </div>
  );
};

export default Spinner;
