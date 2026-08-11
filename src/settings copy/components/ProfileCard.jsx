import { useState } from "react";
import { FaCalendarAlt, FaCamera, FaCheck, FaTimes } from "react-icons/fa";

// 5 Custom Preset Avatars
export const PRESET_AVATARS = [
  {
    id: 1,
    name: "Classic Student",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=Student1&backgroundColor=6c3df4",
  },
  {
    id: 2,
    name: "Tech Savvy",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4",
  },
  {
    id: 3,
    name: "Creative Mind",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia&backgroundColor=ffdfbf",
  },
  {
    id: 4,
    name: "Pro Saver",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede",
  },
  {
    id: 5,
    name: "Budget Master",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=Buddy&backgroundColor=d1d4f9",
  },
];

export default function ProfileCard({ user, setUser, setIsEditing }) {
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Fallback avatar handling
  const currentAvatar =
    user?.photo ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.fullName || "User"
    )}&background=e9e5ff&color=6c3df4&size=200`;

  const handleSelectAvatar = (avatarUrl) => {
    const updatedUser = {
      ...user,
      photo: avatarUrl,
      avatar: avatarUrl,
    };

    // Update state & persist to LocalStorage
    if (setUser) setUser(updatedUser);
    try {
      const existing = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...existing, ...updatedUser, avatar: avatarUrl })
      );
    } catch (e) {
      console.error("Could not update localStorage", e);
    }

    setShowAvatarModal(false);
  };

  return (
    <div className="profile-card">
      {/* Profile Image Section */}
      <div className="profile-left">
        <div className="profile-image-wrapper">
          <img src={currentAvatar} alt="profile" className="profile-image" />

          <button
            className="camera-btn"
            onClick={() => setShowAvatarModal(true)}
            aria-label="Choose custom avatar"
            title="Choose custom avatar"
          >
            <FaCamera />
          </button>
        </div>
      </div>

      {/* Profile Details */}
      <div className="profile-center">
        <div className="profile-name-row">
          <h2>{user?.fullName || "User"}</h2>
          <span className="student-badge">
            {user?.role || "Student"}
          </span>
        </div>

        <p className="profile-email">
          {user?.email || "user@student.com"}
        </p>

        <p className="member-since">
          <FaCalendarAlt />
          Member since {user?.joinedAt || "May 12, 2024"}
        </p>
      </div>

      {/* Edit Profile Action */}
      <div className="profile-right">
        <button
          className="edit-btn"
          onClick={() => setIsEditing && setIsEditing(true)}
        >
          Edit Profile
        </button>
      </div>

      {/* Preset Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="avatar-modal-overlay">
          <div className="avatar-modal-content">
            <div className="avatar-modal-header">
              <h3>Choose a Preset Avatar</h3>
              <button
                className="close-avatar-modal"
                onClick={() => setShowAvatarModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <p className="avatar-modal-subtitle">
              Select one of the 5 custom avatars below for your profile:
            </p>

            <div className="avatar-presets-grid">
              {PRESET_AVATARS.map((avatar) => {
                const isSelected = currentAvatar === avatar.url;
                return (
                  <div
                    key={avatar.id}
                    className={`preset-avatar-card ${
                      isSelected ? "active-avatar" : ""
                    }`}
                    onClick={() => handleSelectAvatar(avatar.url)}
                  >
                    <img src={avatar.url} alt={avatar.name} />
                    <span>{avatar.name}</span>
                    {isSelected && (
                      <div className="avatar-check-badge">
                        <FaCheck />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}