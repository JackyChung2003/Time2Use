import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";
import "./index.css";

const CreateTag = () => {
    const [tagName, setTagName] = useState(""); // State for the tag name
    const [error, setError] = useState(null); // State for error messages
    const [success, setSuccess] = useState(null); // State for success messages
    const navigate = useNavigate(); // Navigation function to go back or redirect

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!tagName.trim()) {
            setError("Tag name cannot be empty.");
            return;
        }

        try {
            setError(null);
            setSuccess(null);

            const { error } = await supabase
                .from("tags") // Ensure this matches your Supabase table name
                .insert([{ name: tagName }]);

            if (error) throw error;

            setSuccess("Tag created successfully!");
            setTagName(""); // Reset the form
            
            navigate(`/admin/recipe-management/tags`);
        } catch (err) {
            setError("Failed to create tag.");
            console.error(err);
        }
    };

    return (
        <div className="create-tag-container">
            <h1 className="create-tag-title">Create Tag</h1>
            <p className="create-tag-description">Use this form to add a new tag.</p>
    
            {/* Form for creating a new tag */}
            <form onSubmit={handleSubmit} className="form-container">
                <label htmlFor="tagName" className="form-label">Tag Name</label>
                <input
                    type="text"
                    id="tagName"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    placeholder="Enter tag name"
                    className="form-input"
                />
                <button type="submit" className="button-primary">Create Tag</button>
            </form>
    
            {/* Display error or success message */}
            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}
    
            {/* Back button */}
            <button onClick={() => navigate(-1)} className="button-secondary">Back</button>
        </div>
    );
    
};

export default CreateTag;
