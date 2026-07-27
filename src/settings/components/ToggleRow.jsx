import { useState } from "react";

export default function ToggleRow({
  title,
  description,
  defaultOn = false,
}) {
  const [enabled, setEnabled] = useState(defaultOn);

  return (
    <div className="toggle-row">

      <div className="toggle-text">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>

      <button
        className={`toggle-switch ${enabled ? "active" : ""}`}
        onClick={() => setEnabled(!enabled)}
      >
        <span className="toggle-circle"></span>
      </button>

    </div>
  );
}