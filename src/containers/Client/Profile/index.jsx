import React, { useState } from "react";
import defaultProfilePic from "../../../assets/images/default _propic.png";
import { FaUser, FaBirthdayCake, FaEnvelope, FaLock, FaBell, FaPen } from "react-icons/fa";
import "./index.css"; // Import your CSS file

const Profile = () => {
  const [isTouched, setIsTouched] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [notificationDays, setNotificationDays] = useState(7);
  const [isEditing, setIsEditing] = useState({
    username: false,
    password: false,
    notification: false,
  });
  const [isEditingMode, setIsEditingMode] = useState(false);

  const handleTouchStart = () => {
    setIsTouched(true);
  };

  const handleTouchEnd = () => {
    setIsTouched(false);
  };

  const handleNotificationChange = (event) => {
    setNotificationDays(event.target.value);
  };

  const handleEditToggle = (field) => {
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result); // Set the uploaded image as the profile picture
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfile = () => {
    setIsEditingMode((prev) => !prev); // Toggle edit mode
    if (isEditingMode) {
      // Save changes (here you can add logic to save data, e.g., make an API call)
      console.log("Changes saved");
    }
  };

  return (
    <div className="profile-container">
      {/* Profile Header Section */}
      <div className="profile-header">
        <div className="profile-avatar">
          <img
            src={profileImage || defaultProfilePic}
            alt="Profile"
            className="avatar-image"
          />
          {/* Edit Button */}
          {isEditingMode && (
            <label className="edit-icon">
              <FaPen />
              <input
                type="file"
                accept="image/*"
                className="upload-input"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>
        <h1>kejun_7219</h1>
      </div>

      {/* Profile Details Section */}
      <div className="profile-details">
        {/* Username Row */}
        <div className="profile-row">
          <span className="icon">
            <FaUser />
          </span>
          <span className="profile-label">Username</span>
          {isEditingMode ? (
            isEditing.username ? (
              <input type="text" defaultValue="kejun_7219" className="edit-input" />
            ) : (
              <span className="profile-value">kejun_7219</span>
            )
          ) : (
            <span className="profile-value">kejun_7219</span>
          )}
          <button
            className={`edit-button ${isEditingMode ? 'active' : ''}`}
            onClick={() => handleEditToggle("username")}
            disabled={!isEditingMode}
          >
            <FaPen />
          </button>
        </div>

        {/* Birthday Row */}
        <div className="profile-row">
          <span className="icon">
            <FaBirthdayCake />
          </span>
          <span className="profile-label">Birthday</span>
          <span className="profile-value">19 Feb 2003</span>
          <span className="edit-placeholder" />
        </div>

        {/* Email Row */}
        <div className="profile-row">
          <span className="icon">
            <FaEnvelope />
          </span>
          <span className="profile-label">Email</span>
          <span className="profile-value">tkjun7559@gmail.com</span>
          <span className="edit-placeholder" />
        </div>

        {/* Password Row */}
        <div className="profile-row">
          <span className="icon">
            <FaLock />
          </span>
          <span className="profile-label">Password</span>
          {isEditingMode ? (
            isEditing.password ? (
              <input type="password" defaultValue="••••••••" className="edit-input" />
            ) : (
              <span className="profile-value">••••••••</span>
            )
          ) : (
            <span className="profile-value">••••••••</span>
          )}
          <button
            className={`edit-button ${isEditingMode ? 'active' : ''}`}
            onClick={() => handleEditToggle("password")}
            disabled={!isEditingMode}
          >
            <FaPen />
          </button>
        </div>

        {/* Notification Preferences Row */}
        <div className="profile-row">
          <span className="icon">
            <FaBell />
          </span>
          <span className="profile-label">Notification</span>
          {isEditingMode ? (
            isEditing.notification ? (
              <select
                value={notificationDays}
                onChange={handleNotificationChange}
                className="notification-select"
              >
                <option value={1}>1 Day Before</option>
                <option value={3}>3 Days Before</option>
                <option value={7}>7 Days Before</option>
                <option value={14}>14 Days Before</option>
                <option value={30}>30 Days Before</option>
              </select>
            ) : (
              <span className="profile-value">{notificationDays} Days Before</span>
            )
          ) : (
            <span className="profile-value">{notificationDays} Days Before</span>
          )}
          <button
            className={`edit-button ${isEditingMode ? 'active' : ''}`}
            onClick={() => handleEditToggle("notification")}
            disabled={!isEditingMode}
          >
            <FaPen />
          </button>
        </div>
      </div>

      {/* Edit/Done Button */}
      <div className="edit-profile">
        <button
          className={`profile-button ${isTouched ? "hover-effect" : ""}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleEditProfile}
        >
          {isEditingMode ? "Done" : "Edit Profile"}
        </button>
      </div>
    </div>
  );
};

export default Profile;
