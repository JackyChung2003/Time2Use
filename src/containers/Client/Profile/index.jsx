import React, { useState } from "react";
import { FaUser, FaBirthdayCake, FaPhone, FaEnvelope, FaLock, FaBell } from "react-icons/fa"; 
import "./index.css"; // Import your CSS file

const Profile = () => {
  const [isTouched, setIsTouched] = useState(false);
  const [notificationDays, setNotificationDays] = useState(7);

  const handleTouchStart = () => {
    setIsTouched(true);
  };

  const handleTouchEnd = () => {
    setIsTouched(false);
  };
 
  const handleNotificationChange = (event) => {
    setNotificationDays(event.target.value);
  };

  return (
    <div className="profile-container">
        <div className="profile-header">
            <div className="profile-avatar"></div>
            <h1>Tan Ke Jun</h1>
        </div>
        
        <div className="profile-details">
        <div className="profile-row">
            <span className="icon"><FaUser /></span> {/* User Icon */}
            <span className="profile-label">Name</span>
            <span className="profile-value">Tan Ke Jun</span>
        </div>

            {/* Birthday Row */}
        <div className="profile-row">
            <span className="icon"><FaBirthdayCake /></span> {/* Birthday Icon */}
            <span className="profile-label">Birthday</span>
            <span className="profile-value">19 Feb 2003</span>
        </div>

        {/* Phone Number Row */}
        <div className="profile-row">
            <span className="icon"><FaPhone /></span> {/* Phone Icon */}
            <span className="profile-label">Phone</span>
            <span className="profile-value">016 2457219</span>
        </div>

        {/* Email Row */}
        <div className="profile-row">
            <span className="icon"><FaEnvelope /></span> {/* Envelope Icon */}
            <span className="profile-label">Email</span>
            <span className="profile-value">tkjun7559@gmail.com</span>
        </div>

        {/* Password Row */}
        <div className="profile-row">
            <span className="icon"><FaLock /></span> {/* Lock Icon */}
            <span className="profile-label">Password</span>
            <span className="profile-value">••••••••</span>
        </div>

        {/* Notification Preferences Row */}
        <div className="profile-row">
            <span className="icon"><FaBell /></span> {/* Bell Icon */}
            <span className="profile-label">Notification</span>
            <span className="profile-value">
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
            </span>
        </div>

        </div>

        <div className="edit-profile">
        <button
          className={`profile-button ${isTouched ? "hover-effect" : ""}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
};

export default Profile;
