import { useState } from "react";
import supabase from "../../../../../config/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./index.css";

const CreateCategory = () => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from("category") // Replace with your actual table name
                .insert([{ name, description }]);

            if (error) throw error;

            alert("Category created successfully!");
            navigate("/admin/category-management/categories"); // Navigate back to the category list
        } catch (err) {
            setError("Failed to create category.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-category-container">
            <h1 className="create-category-title">Create Category</h1>
            <form onSubmit={handleCreate} className="form-container">
                {error && <p className="form-error">{error}</p>}
                <div className="form-group">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description" className="form-label">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        className="form-textarea"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className={`button-primary ${loading ? "button-disabled" : ""}`}
                >
                    {loading ? "Creating..." : "Create Category"}
                </button>
            </form>
        </div>
    );
    
};

export default CreateCategory;
