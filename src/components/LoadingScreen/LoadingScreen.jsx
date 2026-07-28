import { useEffect, useState } from "react";
import "./LoadingScreen.css";

import robot from "../../assets/robot.png";

const messages = [
  "Authenticating your account...",
  "Loading your dashboard...",
  "Analyzing your spending...",
  "Preparing your AI Advisor...",
  "Almost ready..."
];

export default function LoadingScreen() {

  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {

    const progressInterval = setInterval(() => {

      setProgress((prev) => {

        if (prev >= 100) {

          clearInterval(progressInterval);

          return 100;

        }

        return prev + 2;

      });

    }, 50);

    const messageInterval = setInterval(() => {

      setMessageIndex((prev) => {

        if (prev === messages.length - 1) return prev;

        return prev + 1;

      });

    }, 1000);

    return () => {

      clearInterval(progressInterval);

      clearInterval(messageInterval);

    };

  }, []);

  return (

    <div className="loading-screen">

      <div className="background-glow"></div>

      <div className="loading-card">

        <img
          src={robot}
          className="loading-robot"
          alt="robot"
        />

        <h1>Preparing BudgetBuddy</h1>

        <p>{messages[messageIndex]}</p>

        <div className="progress-container">

          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          >

            <span className="shimmer"></span>

          </div>

        </div>

        <div className="progress-text">

          {progress}%

        </div>

        <div className="loading-dots">

          <span></span>

          <span></span>

          <span></span>

        </div>

      </div>

    </div>

  );

}