import React, { useState, useEffect } from "react";
import { FiUser, FiPhone, FiMail, FiCheck, FiX } from "react-icons/fi";

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Buddy1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Milo",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Sparky",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cyber",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Nexus",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aura",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Vortex",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Pixel",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Titan",
];

function EditProfileModal({ user, setUser, setIsEditing }) {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    currency: "NGN (₦)",
    language: "English",
    photo: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phone: user.phone || "",
        email: user.email || "",
        currency: user.currency || "NGN (₦)",
        language: user.language || "English",
        photo: user.photo || user.avatar || PRESET_AVATARS[0],
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectAvatar = (url) => {
    setFormData((prev) => ({ ...prev, photo: url }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedUser = {
      ...user,
      ...formData,
      name: formData.fullName,
      photo: formData.photo,  // Ensure photo property matches Settings
      avatar: formData.photo, // Maintain avatar property for backwards compatibility
    };

    setUser(updatedUser);
    setIsEditing(false);
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Edit Profile</h2>
          <button
            onClick={() => setIsEditing(false)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#666" }}
          >
            <FiX />
          </button>
        </div>

        {/* 10 Preset Avatars Grid */}
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Choose an Avatar (10 Presets)</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", marginTop: "10px" }}>
            {PRESET_AVATARS.map((avatarUrl, index) => {
              const isSelected = formData.photo === avatarUrl;
              return (
                <div
                  key={index}
                  onClick={() => handleSelectAvatar(avatarUrl)}
                  style={{
                    position: "relative",
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    border: isSelected ? "3px solid #6c3df4" : "2px solid #E5E7EB",
                    padding: "2px",
                    backgroundColor: "#f9fafb",
                    transition: "all 0.2s ease",
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={`Avatar ${index + 1}`}
                    style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                  />
                  {isSelected && (
                    <div style={checkBadgeStyle}>
                      <FiCheck size={10} color="#fff" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyle}>Full Name</label>
            <div style={inputBoxStyle}>
              <FiUser style={{ marginRight: "10px", color: "#6b7280" }} />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyle}>Phone Number</label>
            <div style={inputBoxStyle}>
              <FiPhone style={{ marginRight: "10px", color: "#6b7280" }} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={inputStyle}
                placeholder="+234..."
              />
            </div>
          </div>

          {/* Email Address */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Email Address</label>
            <div style={{ ...inputBoxStyle, backgroundColor: "#F3F4F6" }}>
              <FiMail style={{ marginRight: "10px", color: "#9CA3AF" }} />
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                style={{ ...inputStyle, color: "#6B7280", cursor: "not-allowed" }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ ...btnStyle, backgroundColor: "#E5E7EB", color: "#374151" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...btnStyle, backgroundColor: "var(--primary-color, #6c3df4)", color: "#FFFFFF" }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inline Style Constants
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: "#fff",
  padding: "25px",
  borderRadius: "14px",
  width: "90%",
  maxWidth: "480px",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
};

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "6px",
  color: "#374151",
};

const inputBoxStyle = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  padding: "10px 14px",
};

const inputStyle = {
  border: "none",
  outline: "none",
  width: "100%",
  fontSize: "14px",
  background: "transparent",
};

const checkBadgeStyle = {
  position: "absolute",
  bottom: "-2px",
  right: "-2px",
  backgroundColor: "#6c3df4",
  borderRadius: "50%",
  width: "16px",
  height: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const btnStyle = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  fontWeight: "600",
  cursor: "pointer",
};

export default EditProfileModal;