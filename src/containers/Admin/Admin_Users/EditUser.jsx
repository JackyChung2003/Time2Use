import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../../../config/supabaseClient";

const EditUser = () => {
    const { id } = useParams(); // Get user ID from URL params
    const [unqID, setUnqID] = useState("");
    const [userName, setUserName] = useState("");
    const [birthday, setBirthday] = useState("");
    const [selectedNotificationDayId, setSelectedNotificationDayId] = useState(null);
    const [notificationDay, setNotificationDay] = useState([]); // Number for notification day
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [roleName, setRoleName] = useState(""); // To store the role name
    const [picture, setPicture] = useState(null);
    const [currentPicturePath, setCurrentPicturePath] = useState(""); // To display existing picture
    const [roles, setRoles] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Fetch user details from 'profile' table
                const { data: user, error: userError } = await supabase
                    .from("profile")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (userError) throw userError;

                // Populate form with existing user data
                setUnqID(user.user);
                setUserName(user.username);
                setBirthday(user.birthday);
                setSelectedNotificationDayId(user.notification_day); // Directly set the number
                setCurrentPicturePath(user.picture_path);

                // Fetch role_id from the user_roles table
                const { data: userRole, error: userRoleError } = await supabase
                    .from("user_roles")
                    .select("role_id")
                    .eq("user_id", user.user)
                    .single(); // Assuming a user can have only one role

                if (userRoleError) throw userRoleError;

                const { data: roleData, error: roleError } = await supabase
                    .from("roles")
                    .select("id, role_name")
                    .eq("id", userRole.role_id)
                    .single();

                if (roleError) throw roleError;

                // Set the role_id and role_name
                setSelectedRoleId(roleData.id);
                setRoleName(roleData.role_name);

                // Fetch all roles for the select dropdown
                const { data: rolesData, error: rolesError } = await supabase
                    .from("roles")
                    .select("id, role_name");

                if (rolesError) {
                    console.error("Error fetching roles data:", rolesError);
                } else {
                    setRoles(rolesData || []);
                }

                const { data: notificationData, error: notificationError } = await supabase
                    .from("notification_day")
                    .select("id, day");

                if (notificationError) {
                    console.error("Error fetching notification days:", notificationError);
                } else {
                    setNotificationDay(notificationData || []);
                }
            } catch (error) {
                console.error("Error fetching user data:", error.message);
            }
        };

        fetchUserData();
    }, [id]);

    const handlePictureChange = (e) => {
        setPicture(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userName || !selectedRoleId || !birthday || !notificationDay) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            let picturePath = currentPicturePath;

            if (picture) {
                const { data: pictureUploadData, error: pictureError } = await supabase.storage
                    .from("profile-picture")
                    .upload(`pictures/${picture.name}`, picture, { upsert: true });

                if (pictureError) throw pictureError;

                picturePath = pictureUploadData.path;
            }

            // Update the user in the 'profile' table
            const { error: updateError } = await supabase
                .from("profile")
                .update({
                    username: userName,
                    birthday: birthday,
                    notification_day: selectedNotificationDayId,
                    picture_path: picturePath,
                })
                .eq("id", id);

            if (updateError) throw updateError;

            // Also update user_roles table if role has changed
            if (selectedRoleId) {
                const { error: userRoleError } = await supabase
                    .from("user_roles")
                    .update({ role_id: selectedRoleId })
                    .eq("user_id", unqID);

                if (userRoleError) throw userRoleError;
            }

            alert("User updated successfully!");
            navigate("/admin/users"); // Redirect to user list
        } catch (error) {
            console.error("Error updating user:", error.message);
            alert("Failed to update user.");
        }
    };

    return (
        <div className="edit-user-container">
            <div className="admin-content">
                <h2>Edit User</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>User Name:</label>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Birthday:</label>
                        <input
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Notification Day:</label>
                        <select
                            value={selectedNotificationDayId || ""}
                            onChange={(e) => setSelectedNotificationDayId(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                Select a notification day
                            </option>
                            {notificationDay.map((notificationday) => (
                                <option key={notificationday.id} value={notificationday.id}>
                                    {notificationday.day}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Profile Picture:</label>
                        {currentPicturePath && (
                            <img
                                src={`${supabase.storage.from("profile-picture").getPublicUrl(currentPicturePath).publicURL}`}
                                alt="Current Picture"
                                className="current-picture"
                            />
                        )}
                        <label>New Picture (optional):</label>
                        <input type="file" accept="image/*" onChange={handlePictureChange} />
                    </div>

                    <div className="form-group">
                        <label>Role:</label>
                        <select
                            value={selectedRoleId || ""}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                Select a role
                            </option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.role_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="submit-btn">
                        Update User
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditUser;
