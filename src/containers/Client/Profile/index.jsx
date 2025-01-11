import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import defaultProfilePic from "../../../assets/images/default_propic.png";
import { FaUser, FaBirthdayCake, FaEnvelope, FaLock, FaBell, FaPen } from "react-icons/fa";
import "./index.css";
import supabase from "../../../config/supabaseClient";
import { useAuth } from '../../../context/AuthContext';

/// Modal component
const ProfileImageModal = ({ onClose, onChangePicture, onRemovePicture, isImageUploaded }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Profile Picture Options</h3>
      <div className="button-container">
        {!isImageUploaded ? (
          // If no image is uploaded, show the 'Upload Image' button
          <button onClick={onChangePicture}>Upload Image</button>
        ) : (
          // If an image is uploaded, show 'Change Image' and 'Remove Image' buttons
          <>
            <button onClick={onChangePicture}>Change Image</button>
            <button onClick={onRemovePicture}>Remove Image</button>
          </>
        )}
      </div>
      <button onClick={onClose}>Close</button> {/* Close button styled differently */}
    </div>
  </div>
);


const Profile = () => {
  const navigate = useNavigate();
  const { updateUserRole } = useAuth();
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [notificationOptions, setNotificationOptions] = useState([3]);
  const [profile, setProfile] = useState({
    username: "",
    birthday: "",
    email: "",
    password: "••••••••", 
    notificationDay: 3, 
  });
  const [editingUsername, setEditingUsername] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef(null); // Create a reference for the file input
  const isImageUploaded = profileImage !== null && profileImage !== defaultProfilePic;

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

  const handleRemoveImage = async () => {
    setProfileImage(null);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Error fetching user:", userError);
      return;
    }
    const updates = {
      picture: null,
    };
    const { error: profileError } = await supabase
      .from("profile")
      .update(updates)
      .eq("user", user.id);
    
    if (profileError) {
      console.error("Error updating profile:", profileError);
    } else {
      console.log("Profile picture removed successfully!");
    }
    setShowImageModal(false);
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

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          alert("Passwords do not match!");
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) {
          console.error("Error updating password:", passwordError);
        } else {
          console.log("Password updated successfully!");
          setNewPassword("");
        }
      }
    } else {
      setEditingUsername(profile.username);
    }
    setIsEditingMode((prev) => !prev);
  };

  const handleSavePassword = async () => {

    if (!oldPassword) {
      alert("Please enter your password.");
      return;
    }

    if (newPassword === oldPassword) {
      alert("Old and New passwords cannot be the same.");
      clearPasswordInputs(); // Clear inputs if the passwords are the same
      return;
    }
    
    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      clearPasswordInputs(); // Clear inputs if the new password is too short
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      clearPasswordInputs(); // Clear inputs if passwords don't match
      return;
    }
    
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: oldPassword,
    });
  
    if (signInError) {
      alert("Old password is incorrect.");
      clearPasswordInputs(); // Clear inputs if old password is wrong
      return;
    }
  
    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (passwordError) {
      console.error("Error updating password:", passwordError);
    } else {
      alert("Password updated successfully!");
      setShowPasswordModal(false);
      clearPasswordInputs();
      setIsEditingMode(false); // Exit editing mode

      await handleSignOut();
    }
  };

  const clearPasswordInputs = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };
  
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      updateUserRole(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  return (
    <div className={`profile-container ${isEditingMode ? "edit-mode" : ""}`}>
      <div className="profile-header">
        <div className="profile-avatar">
          <img
            src={profileImage || defaultProfilePic}
            alt="Profile"
            className="avatar-image"
          />
          {isEditingMode && (
            <div className="edit-icon-container">
              <label className="edit-icon" onClick={() => setShowImageModal(true)}>
                <FaPen />
              </label>
            </div>
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
        <div className="profile-password">
          <span className="profile-value">••••••••</span>
          {isEditingMode && (
            <button
              type="button"
              className="edit-icon-button"
              onClick={() => setShowPasswordModal(true)}
            >
              <FaPen />
            </button>
          )}
        </div>
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

      {showPasswordModal && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Change Password</h3>
          <div className="password-container">
            
            {/* Old Password */}
          <div className="password-input">
            <label>Old Password</label>
            <input
              type={showOldPassword ? "text" : "password"}
              value={oldPassword}
              placeholder="Enter old password"
              onChange={(e) => setOldPassword(e.target.value)}
              className="password-edit-input"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowOldPassword((prev) => !prev)}
            >
              {showOldPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

{/* New Password */}
<div className="password-input">
  <label>New Password</label>
  <input
    type={showPassword ? "text" : "password"}
    value={newPassword}
    placeholder="Enter new password"
    onChange={(e) => setNewPassword(e.target.value)}
    className="password-edit-input"
  />
  <button
    type="button"
    className="toggle-password"
    onClick={() => setShowPassword((prev) => !prev)}
  >
    {showPassword ? "👁️" : "👁️‍🗨️"}
  </button>
</div>

{/* Confirm Password */}
<div className="password-input">
  <label>Confirm Password</label>
  <input
    type={showConfirmPassword ? "text" : "password"}
    value={confirmPassword}
    placeholder="Confirm password"
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="password-edit-input"
  />
  <button
    type="button"
    className="toggle-password"
    onClick={() => setShowConfirmPassword((prev) => !prev)}
  >
    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
  </button>
</div>

          </div>
          
          {/* Save and Cancel Buttons */}
          <button onClick={handleSavePassword} className="save-password-btn">Save</button>
          <button onClick={() => { clearPasswordInputs(); setShowPasswordModal(false); }} className="cancel-btn">Cancel</button>
        </div>
      </div>
    )}

      {/* File Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleImageUpload}
        accept="image/*"
      />

      {showImageModal && (
        <ProfileImageModal
          onClose={() => setShowImageModal(false)}
          onChangePicture={() => {
            setShowImageModal(false);
            fileInputRef.current.click(); // Trigger file input on button click
          }}
          onRemovePicture={handleRemoveImage}
          isImageUploaded={isImageUploaded}
        />
      )}
    </div>
  );
};

export default Profile;