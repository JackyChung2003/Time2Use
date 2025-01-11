import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";
import "./index.css";

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
        <div className="create-equipment-container">
            <h1 className="create-equipment-title">Create Equipment</h1>
            <p className="create-equipment-description">Use this form to add a new equipment item.</p>
    
            {/* Form for creating a new equipment item */}
            <form onSubmit={handleSubmit} className="form-container">
                <label htmlFor="equipment-name" className="form-label">Equipment Name</label>
                <input
                    id="equipment-name"
                    type="text"
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    placeholder="Enter equipment name"
                    className="form-input"
                />
                <button type="submit" className="button-primary">Create Equipment</button>
            </form>
    
            {/* Display error or success message */}
            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}
    
            {/* Back button */}
            <button onClick={() => navigate(-1)} className="button-secondary">Back</button>
        </div>
    );
    
};

export default CreateEquipment;
