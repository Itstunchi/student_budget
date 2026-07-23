// export default function EditProfileModal() {

import { useState } from "react";

export default function EditProfileModal({
  user,
  setUser,
  setIsEditing,
}) {

    const [formData, setFormData] = useState(user);


  return (
    <div className="modal-overlay">
      <div className="edit-profile-modal">

        <h2>Edit Profile</h2>

        <div className="form-group">
          <label>Full Name</label>
         

          <input
  type="text"
  value={formData.fullName}
  onChange={(e) =>
    setFormData({
      ...formData,
      fullName: e.target.value,
    })
  }
/>

        </div>

        <div className="form-group">
          <label>Email Address</label>
          

          <input
  type="email"
  value={formData.email}
  onChange={(e) =>
    setFormData({
      ...formData,
      email: e.target.value,
    })
  }
/>

        </div>

        <div className="form-group">
          <label>Phone Number</label>
         

          <input
  type="text"
  value={formData.phone}
  onChange={(e) =>
    setFormData({
      ...formData,
      phone: e.target.value,
    })
  }
/>

        </div>


        <div className="form-group">
  <label>Currency</label>

  <input
    type="text"
    value={formData.currency}
    onChange={(e) =>
      setFormData({
        ...formData,
        currency: e.target.value,
      })
    }
  />
</div>



<div className="form-group">
  <label>Language</label>

  <input
    type="text"
    value={formData.language}
    onChange={(e) =>
      setFormData({
        ...formData,
        language: e.target.value,
      })
    }
  />
</div>



<div className="form-group">
  <label>Password</label>

  <input
    type="password"
    value={formData.password}
    onChange={(e) =>
      setFormData({
        ...formData,
        password: e.target.value,
      })
    }
  />
</div>



        <div className="modal-buttons">
         

          <button
  className="cancel-btn"
  onClick={() => setIsEditing(false)}
>
  Cancel
</button>


          

          <button
  className="save-btn"
  onClick={() => {
    setUser(formData);
    setIsEditing(false);
  }}
>
  Save Changes
</button>

        </div>

      </div>
    </div>
  );
}