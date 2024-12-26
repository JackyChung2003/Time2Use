import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";

const CreateEquipment = () => {
    const [equipmentName, setEquipmentName] = useState(""); // State for equipment name
    const [error, setError] = useState(null); // State for error messages
    const [success, setSuccess] = useState(null); // State for success messages
    const navigate = useNavigate(); // Navigation function to go back or redirect

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!equipmentName.trim()) {
            setError("Equipment name cannot be empty.");
            return;
        }

        try {
            setError(null);
            setSuccess(null);

            const { error } = await supabase
                .from("equipment") // Ensure this matches your Supabase table name
                .insert([{ name: equipmentName }]);

            if (error) throw error;

            setSuccess("Equipment created successfully!");
            setEquipmentName(""); // Reset the form
            
            navigate(`/admin/recipe-management/equipment`);
        } catch (err) {
            setError("Failed to create equipment.");
            console.error(err);
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ color: "#333" }}>Create Equipment</h1>
            <p style={{ color: "#555" }}>Use this form to add a new equipment item.</p>

            {/* Form for creating a new equipment item */}
            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    maxWidth: "400px",
                }}
            >
                <label style={{ color: "#333", fontWeight: "bold" }}>
                    Equipment Name
                </label>
                <input
                    type="text"
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    placeholder="Enter equipment name"
                    style={{
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        width: "100%",
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        cursor: "pointer",
                    }}
                >
                    Create Equipment
                </button>
            </form>

            {/* Display error or success message */}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {success && <p style={{ color: "green" }}>{success}</p>}

            {/* Back button */}
            <button
                onClick={() => navigate(-1)} // Navigate back to the previous page
                style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#007BFF",
                    color: "white",
                    cursor: "pointer",
                }}
            >
                Back
            </button>
        </div>
    );
};

export default CreateEquipment;
