import { useRef, useState } from "react";
import {
  FaCalendarAlt,
  FaCamera,
  FaUser,
} from "react-icons/fa";







export default function ProfileCard({ user, setIsEditing }) {


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




  


         




         {image ? (
  <img
    src={image}
    alt="profile"
    className="profile-image"
  />
) : (
  

  <div className="profile-placeholder">
  <FaUser />
</div>
)}






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

          

          <h2>{user.fullName}</h2>

          <span className="student-badge">
            Student
          </span>

        </div>

        
        <p className="profile-email">
  {user.email}
</p>

        <p className="member-since">

          <FaCalendarAlt />

         

          Member since {user.joinedAt}

        </p>

      </div>

      <div className="profile-right">

       




        <button
    className="edit-btn"
    onClick={() => setIsEditing(true)}
>
    Edit Profile
</button>






      </div>

    </div>
  );
}