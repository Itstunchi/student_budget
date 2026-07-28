

import { useState, useEffect } from "react";

const colors = [
  "#6c3df4", // Purple
  "#2563eb", // Blue
  "#16a34a", // Green
  "#ea580c", // Orange
  "#dc2626", // Red
];

export default function AppearanceSettings() {


  const [theme, setTheme] = useState("Light");
  const [activeColor, setActiveColor] = useState("#6c3df4");




  useEffect(() => {
  if (theme === "Light") {
    document.body.classList.remove("dark-mode");
  }

  if (theme === "Dark") {
    document.body.classList.add("dark-mode");
  }

  if (theme === "System") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (prefersDark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }
}, [theme]);






  const changeColor = (color) => {
    setActiveColor(color);
    document.documentElement.style.setProperty("--primary-color", color);
  };

  return (
    <>
      <div className="appearance-section">

        <h4>Theme</h4>

        <div className="theme-buttons">

          <button
            className={theme === "Light" ? "theme-btn active-theme" : "theme-btn"}
            onClick={() => setTheme("Light")}
          >
            ☀ Light
          </button>

          <button
            className={theme === "Dark" ? "theme-btn active-theme" : "theme-btn"}
            onClick={() => setTheme("Dark")}
          >
            🌙 Dark
          </button>

          <button
            className={theme === "System" ? "theme-btn active-theme" : "theme-btn"}
            onClick={() => setTheme("System")}
          >
            💻 System
          </button>

        </div>

      </div>

      <div className="appearance-section">

        <h4>Accent Color</h4>

        <div className="color-picker">

          {colors.map((color) => (

            <button
              key={color}
              className={
                activeColor === color
                  ? "color-circle selected"
                  : "color-circle"
              }
              style={{ background: color }}
              onClick={() => changeColor(color)}
            />

          ))}

        </div>

      </div>
    </>
  );
}