import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import supabase from '../../../config/supabaseClient';

import BackButton from "../../../components/Button/BackButton";

const ViewUser = () => {
    const { id } = useParams();
    const navigate = useNavigate(); 
    const [user, setUser] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserDetails = async () => {
            setLoading(true);
            setError(null);
    
            try {
                // Step 1: Fetch user details
                const { data: userData, error: userError } = await supabase
                    .from("profile")
                    .select("*")
                    .eq("id", id)
                    .single();
                if (userError) throw userError;
    
                setUser(userData);
    
                // Step 2: Fetch related roles
                const { data: rolesData, error: rolesError } = await supabase
                    .from("roles")
                    .select("*");
                if (rolesError) {
                    console.error("Error fetching roles:", rolesError.message);
                    setRoles([]);
                } else {
                    setRoles(rolesData || []);
                }

            } catch (err) {
                setError("Failed to fetch user details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
    
        fetchUserDetails();
    }, [id]);

    const deleteUser = async (id, picturePath) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this user?");
        if (!confirmDelete) return;

        try {
            setLoading(true);

            // Delete picture from Supabase Storage
            const { error: storageError } = await supabase.storage
                .from("profile-picture") // Adjust the bucket name if needed
                .remove([picturePath]);

            if (storageError) {
                console.error("Failed to delete picture:", storageError);
                setError("Failed to delete user's profile picture.");
                return;
            }

            // Delete user from the database
            const { error: userError } = await supabase
                .from("profile")
                .delete()
                .eq("id", id);

            if (userError) throw userError;

            alert("User and profile picture deleted successfully.");
            navigate("/admin/users"); // Redirect after deletion
        } catch (err) {
            setError("Failed to delete user.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <p>Loading user...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            {/* Back Button */}
            <BackButton />

            {/* Action Buttons */}
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                    onClick={() => navigate(`/admin/users/edit/${id}`)}                    
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#FFA500",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Edit User
                </button>
                <button
                    onClick={() => deleteUser(user.id, user.picture_path)} // Pass id and picture_path to delete
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#f44336",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Delete User
                </button>
            </div>

            <h1>{user.username}</h1>
            <p><span style={{ fontWeight: 'bold' }}>Birthday:</span> {user.birthday}</p>
            <p><span style={{ fontWeight: 'bold' }}>Notification Day:</span> {user.notification_day}</p>
            <p><span style={{ fontWeight: 'bold' }}>Role:</span> {roles.find(role => role.id === user.role_id)?.role_name || "N/A"}</p>
            {user.picture_path && (
                <img
                    src={`${supabase.storage.from("profile-picture").getPublicUrl(user.picture_path).publicURL}`}
                    alt={user.username}
                    style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "8px",
                    }}
                />
            )}
        </div>
    );
};

export default ViewUser;
