import { useState } from "react";
import supabase from "../../../../../config/supabaseClient";
import { useNavigate } from "react-router-dom";

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
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ color: "#333" }}>Create Category</h1>
            <form onSubmit={handleCreate} style={{ maxWidth: "400px" }}>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <div style={{ marginBottom: "20px" }}>
                    <label htmlFor="name" style={{ display: "block", marginBottom: "5px" }}>
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                    />
                </div>
                <div style={{ marginBottom: "20px" }}>
                    <label htmlFor="description" style={{ display: "block", marginBottom: "5px" }}>
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: "4px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Creating..." : "Create Category"}
                </button>
            </form>
        </div>
    );
};

export default CreateCategory;
