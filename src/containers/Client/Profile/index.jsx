import React, { useState } from "react";
import { FaUser, FaBirthdayCake, FaPhone, FaEnvelope, FaLock, FaBell, FaPen } from "react-icons/fa"; 
import "./index.css"; // Import your CSS file

const Profile = () => {
  const [isTouched, setIsTouched] = useState(false);
  const [notificationDays, setNotificationDays] = useState(7);
  const [isEditing, setIsEditing] = useState({
    name: false,
    birthday: false,
    phone: false,
    email: false,
    password: false,
    notification: false,
  });

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

  return (
    <div className="profile-container">
        <div className="profile-header">
            <div className="profile-avatar"></div>
            <h1>Tan Ke Jun</h1>
        </div>
        
        <div className="profile-details">
            {/* Name Row */}
            <div className="profile-row">
                <span className="icon"><FaUser /></span> {/* User Icon */}
                <span className="profile-label">Name</span>
                {isEditing.name ? (
                  <input type="text" defaultValue="Tan Ke Jun" className="edit-input" />
                ) : (
                  <span className="profile-value">Tan Ke Jun</span>
                )}
                <button className="edit-button" onClick={() => handleEditToggle('name')}>
                    <FaPen />
                </button>
            </div>

            {/* Birthday Row */}
            <div className="profile-row">
                <span className="icon"><FaBirthdayCake /></span> {/* Birthday Icon */}
                <span className="profile-label">Birthday</span>
                {isEditing.birthday ? (
                  <input type="date" defaultValue="2003-02-19" className="edit-input" />
                ) : (
                  <span className="profile-value">19 Feb 2003</span>
                )}
                <button className="edit-button" onClick={() => handleEditToggle('birthday')}>
                    <FaPen />
                </button>
            </div>

            {/* Phone Number Row */}
            <div className="profile-row">
                <span className="icon"><FaPhone /></span> {/* Phone Icon */}
                <span className="profile-label">Phone</span>
                {isEditing.phone ? (
                  <input type="tel" defaultValue="016 2457219" className="edit-input" />
                ) : (
                  <span className="profile-value">016 2457219</span>
                )}
                <button className="edit-button" onClick={() => handleEditToggle('phone')}>
                    <FaPen />
                </button>
            </div>

            {/* Email Row */}
            <div className="profile-row">
                <span className="icon"><FaEnvelope /></span> {/* Envelope Icon */}
                <span className="profile-label">Email</span>
                {isEditing.email ? (
                  <input type="email" defaultValue="tkjun7559@gmail.com" className="edit-input" />
                ) : (
                  <span className="profile-value">tkjun7559@gmail.com</span>
                )}
                <button className="edit-button" onClick={() => handleEditToggle('email')}>
                    <FaPen />
                </button>
            </div>

            {/* Password Row */}
            <div className="profile-row">
                <span className="icon"><FaLock /></span> {/* Lock Icon */}
                <span className="profile-label">Password</span>
                {isEditing.password ? (
                  <input type="password" defaultValue="••••••••" className="edit-input" />
                ) : (
                  <span className="profile-value">••••••••</span>
                )}
                <button className="edit-button" onClick={() => handleEditToggle('password')}>
                    <FaPen />
                </button>
            </div>

            {/* Notification Preferences Row */}
            <div className="profile-row">
                <span className="icon"><FaBell /></span> {/* Bell Icon */}
                <span className="profile-label">Notification</span>
                {isEditing.notification ? (
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
                )}
                <button className="edit-button" onClick={() => handleEditToggle('notification')}>
                    <FaPen />
                </button>
            </div>
        </div>

        <div className="edit-profile">
            <button
                className={`profile-button ${isTouched ? "hover-effect" : ""}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                Done
            </button>
        </div>
    </div>
  );
};

export default Profile;
