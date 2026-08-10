import React from "react";
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";
import "../styles/modal.css";

function NotificationModal({
  isOpen,
  title,
  message,
  type = "alert", // "alert" | "confirm" | "danger"
  variant = "info", // "info" | "success" | "warning" | "danger"
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  // Select matching theme icon
  const renderIcon = () => {
    switch (variant) {
      case "danger":
      case "warning":
        return <FiAlertTriangle className="modal-icon warning" />;
      case "success":
        return <FiCheckCircle className="modal-icon success" />;
      default:
        return <FiInfo className="modal-icon info" />;
    }
  };

  return (
    <div className="account-switch-loading-overlay">
      <div className="custom-modal-card">
        <button className="modal-close-btn" onClick={onCancel || onConfirm} aria-label="Close">
          <FiX />
        </button>

        <div className="modal-header">
          {renderIcon()}
          <h3>{title || "Notification"}</h3>
        </div>

        <p className="modal-body">{message}</p>

        <div className="modal-actions">
          {type === "confirm" && (
            <button className="btn-modal-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            className={`btn-modal-confirm ${variant === "danger" ? "danger" : ""}`}
            onClick={onConfirm}
          >
            {type === "confirm" ? "Confirm" : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationModal;