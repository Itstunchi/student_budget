import { useState } from "react";

export default function CacheRow() {
  const [cacheSize, setCacheSize] = useState(0);

  const clearCache = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear the app cache?"
    );

    if (confirmClear) {
      localStorage.clear(); // clears local storage for now
      setCacheSize(0);
      alert("App cache cleared successfully.");
    }
  };

  return (
    <div className="cache-row" onClick={clearCache}>

      <div className="cache-left">
        <h4>Clear App Cache</h4>
        <p>Free up storage used by the Student Budget app.</p>
      </div>

      <span className="cache-size">
        {cacheSize} MB
      </span>

    </div>
  );
}