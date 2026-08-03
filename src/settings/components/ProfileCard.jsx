import { useRef } from "react";
import { FaCalendarAlt, FaCamera, FaUser } from "react-icons/fa";

export default function ProfileCard({ user, setIsEditing, setUser }) {
  const inputRef = useRef();

  // Resolve image source: file upload blob / preset photo / preset avatar
  const avatarSrc = user?.photo || user?.avatar;

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const imageUrl = URL.createObjectURL(file);
      // Update parent user state & sync with storage
      if (setUser) {
        const updatedUser = { ...user, photo: imageUrl, avatar: imageUrl };
        setUser(updatedUser);
      }
    }
  };

  return (
    <div className="profile-card">
      <div className="profile-left">
        <div className="profile-image-wrapper">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={user?.fullName || "Profile"}
              className="profile-image"
              onError={(e) => {
                // Graceful fallback if image fails to load
                e.target.onerror = null;
                e.target.src = "https://api.dicebear.com/7.x/bottts/svg?seed=Felix";
              }}
            />
          ) : (
            <div className="profile-placeholder">
              <FaUser />
            </div>
          )}

          <button
            className="camera-btn"
            onClick={() => inputRef.current.click()}
            aria-label="Upload Profile Picture"
          >
            <FaCamera />
          </button>

          <input
            type="file"
            accept="image/*"
            hidden
            ref={inputRef}
            onChange={handleImageChange}
          />
        </div>
      </div>

      <div className="profile-center">
        <div className="profile-name-row">
          <h2>{user?.fullName || "User"}</h2>
          <span className="student-badge">Student</span>
        </div>

        <p className="profile-email">{user?.email}</p>

        <p className="member-since">
          <FaCalendarAlt /> Member since {user?.joinedAt || "July 2026"}
        </p>
      </div>

      <div className="profile-right">
        <button className="edit-btn" onClick={() => setIsEditing(true)}>
          Edit Profile
        </button>
      </div>
    </div>
  );
}