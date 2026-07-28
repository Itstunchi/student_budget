import { useRef, useState } from "react";
import {
  FaCalendarAlt,
  FaCamera,
} from "react-icons/fa";

export default function ProfileCard() {
  const [image, setImage] = useState(null);

  const inputRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="profile-card">

      <div className="profile-left">

        <div className="profile-image-wrapper">

          <img
            src={
              image ||
              "https://ui-avatars.com/api/?name=Malvin&background=e9e5ff&color=6c3df4&size=200"
            }
            alt="profile"
            className="profile-image"
          />

          <button
            className="camera-btn"
            onClick={() => inputRef.current.click()}
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

          <h2>Malvin</h2>

          <span className="student-badge">
            Student
          </span>

        </div>

        <p className="profile-email">
          malvin@student.com
        </p>

        <p className="member-since">

          <FaCalendarAlt />

          Member since May 12, 2024

        </p>

      </div>

      <div className="profile-right">

        <button className="edit-btn">

          Edit Profile

        </button>

      </div>

    </div>
  );
}