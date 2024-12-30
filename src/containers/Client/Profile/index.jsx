import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import defaultProfilePic from "../../../assets/images/default_propic.png";
import { FaUser, FaBirthdayCake, FaEnvelope, FaLock, FaBell, FaPen } from "react-icons/fa";
import "./index.css";
import supabase from "../../../config/supabaseClient";

const Profile = () => {
  const navigate = useNavigate();
  const [isTouched, setIsTouched] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [notificationDays, setNotificationDays] = useState(7);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    birthday: "",
    email: "",
    password: "••••••••", // Default password display
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }

      const { data, error } = await supabase
        .from("profile")
        .select("*")
        .eq("user", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile({
          username: data.username,
          birthday: data.birthday,
          email: user.email,
          password: "••••••••", // Password hidden
        });
        setProfileImage(data.picture);
        setNotificationDays(data.notification || 7);
      }
    };

    fetchProfile();
  }, []);

  const handleTouchStart = () => setIsTouched(true);
  const handleTouchEnd = () => setIsTouched(false);

  const handleNotificationChange = (event) => setNotificationDays(event.target.value);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("profile-picture")
        .upload(fileName, file);

      if (error) {
        console.error("Error uploading image:", error.message);
      } else {
        const { data: urlData } = supabase.storage
          .from("profile-picture")
          .getPublicUrl(fileName);
        setProfileImage(urlData?.publicUrl);
      }
    }
  };

  const handleEditProfile = async () => {
    if (isEditingMode) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }

      const updates = {
        username: profile.username,
        birthday: profile.birthday,
        notification: notificationDays,
        picture: profileImage,
      };

      const { error } = await supabase
        .from("profile")
        .update(updates)
        .eq("user", user.id);

      if (error) {
        console.error("Error updating profile:", error);
      } else {
        console.log("Profile updated successfully!");
      }
    }
    setIsEditingMode((prev) => !prev);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign-out error:", error.message);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <img
            src={profileImage || defaultProfilePic}
            alt="Profile"
            className="avatar-image"
          />
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
        <h1 className="profile-username">{profile.username}</h1>
      </div>

      <div className="profile-details">
        {/* Username */}
        <div className="profile-row">
          <span className="icon"><FaUser /></span>
          <span className="profile-label">Username</span>
          {isEditingMode ? (
            <input
              type="text"
              value={profile.username}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, username: e.target.value }))
              }
              className="edit-input"
            />
          ) : (
            <span className="profile-value">{profile.username}</span>
          )}
          {isEditingMode && (
            <button className="edit-button"><FaPen /></button>
          )}
        </div>

        {/* Birthday */}
        <div className="profile-row">
          <span className="icon"><FaBirthdayCake /></span>
          <span className="profile-label">Birthday</span>
          {isEditingMode ? (
            <input
              type="date"
              value={profile.birthday}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, birthday: e.target.value }))
              }
              className="edit-input"
            />
          ) : (
            <span className="profile-value">{profile.birthday}</span>
          )}
          {isEditingMode && (
            <button className="edit-button"><FaPen /></button>
          )}
        </div>

        {/* Email */}
        <div className="profile-row">
          <span className="icon"><FaEnvelope /></span>
          <span className="profile-label">Email</span>
          <span className="profile-value">{profile.email}</span>
        </div>

        {/* Password */}
        <div className="profile-row">
          <span className="icon"><FaLock /></span>
          <span className="profile-label">Password</span>
          {isEditingMode ? (
            <input
              type="password"
              value={profile.password}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, password: e.target.value }))
              }
              className="edit-input"
            />
          ) : (
            <span className="profile-value">••••••••</span>
          )}
          {isEditingMode && (
            <button className="edit-button"><FaPen /></button>
          )}
        </div>

        {/* Notification */}
        <div className="profile-row">
          <span className="icon"><FaBell /></span>
          <span className="profile-label">Notification</span>
          {isEditingMode ? (
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
          {isEditingMode && (
            <button className="edit-button"><FaPen /></button>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="edit-profile">
        <button className="profile-button" onClick={handleEditProfile}>
          {isEditingMode ? "Done" : "Edit Profile"}
        </button>
      </div>

      <div className="edit-profile">
        <button className="profile-button" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Profile;
