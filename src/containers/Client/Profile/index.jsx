import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import defaultProfilePic from "../../../assets/images/default_propic.png";
import { FaUser, FaBirthdayCake, FaEnvelope, FaLock, FaBell, FaPen } from "react-icons/fa";
import "./index.css";
import supabase from "../../../config/supabaseClient";

const Profile = () => {
  const navigate = useNavigate();
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [notificationOptions, setNotificationOptions] = useState([3]);
  const [profile, setProfile] = useState({
    username: "",
    birthday: "",
    email: "",
    password: "••••••••", // Default password display
    notificationDay: 3, // Default notification
  });
  const [editingUsername, setEditingUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Format date to dd / mm / yyyy
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error fetching user:", userError);
        return;
      }

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("username, birthday, picture, notification_day(id, day)")
        .eq("user", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile({
          username: profileData.username,
          birthday: profileData.birthday,
          email: user.email,
          password: "••••••••",
          notificationDay: profileData.notification_day?.id || 7,
        });
        setProfileImage(profileData.picture);
      }

      // Fetch notification options
      const { data: notificationData, error: notificationError } = await supabase
        .from("notification_day")
        .select("*");

      if (notificationError) {
        console.error("Error fetching notification options:", notificationError);
      } else {
        setNotificationOptions(notificationData);
      }
    };

    fetchData();
  }, []);

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
        username: editingUsername,
        birthday: profile.birthday,
        picture: profileImage,
        notification_day: profile.notificationDay,
      };

      const { error: profileError } = await supabase
        .from("profile")
        .update(updates)
        .eq("user", user.id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        } else {
          console.log("Profile updated successfully!");
          setProfile((prev) => ({
            ...prev,
            username: editingUsername,
          }));
        }
  
      // Update password if changed
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) {
          console.error("Error updating password:", passwordError);
        } else {
          console.log("Password updated successfully!");
          setNewPassword(""); // Clear the password field
        }
      }
    } else {
      setEditingUsername(profile.username); // Initialize editing username
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
    <div
  className={`profile-container ${isEditingMode ? "edit-mode" : ""}`}
>
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
              value={editingUsername}
              onChange={(e) => setEditingUsername(e.target.value)}
              className="edit-input"
            />
          ) : (
            <span className="profile-value">{profile.username}</span>
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
            <span className="profile-value">{formatDate(profile.birthday)}</span>
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
              value={newPassword}
              placeholder="New Password"
              onChange={(e) => setNewPassword(e.target.value)}
              className="edit-input"
            />
          ) : (
            <span className="profile-value">••••••••</span>
          )}
        </div>

        {/* Notification */}
        <div className="profile-row">
          <span className="icon"><FaBell /></span>
          <span className="profile-label">Notification</span>
          {isEditingMode ? (
            <select
              value={profile.notificationDay}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  notificationDay: parseInt(e.target.value, 10),
                }))
              }
              className="notification-select"
            >
              {notificationOptions
              .sort((a, b) => a.day - b.day) // Sort by day in ascending order
              .map((option) => (
                <option key={option.id} value={option.id}>
                  {option.day} Day(s) Before
                </option>
              ))}
            </select>
          ) : (
            <span className="profile-value">
              {notificationOptions.find((opt) => opt.id === profile.notificationDay)?.day || 7} Day(s) Before
            </span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="edit-profile">
        <button className="profile-button" onClick={handleEditProfile}>
          {isEditingMode ? "Save" : "Edit Profile"}
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
