import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";

const EditCategory = () => {
    const { id } = useParams(); // Get the category ID from the URL
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategory = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data, error } = await supabase
                    .from("category") // Replace with your actual table name
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;

                setName(data.name);
                setDescription(data.description);
            } catch (err) {
                setError("Failed to fetch category details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategory();
    }, [id]);

    const handleEdit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from("category") // Replace with your actual table name
                .update({ name, description })
                .eq("id", id);

            if (error) throw error;

            alert("Category updated successfully!");
            navigate(`/admin/recipe-management/categories`);
        } catch (err) {
            setError("Failed to update category.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ color: "#333" }}>Edit Category</h1>
            <form onSubmit={handleEdit} style={{ maxWidth: "400px" }}>
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
                        backgroundColor: "#FFA500",
                        color: "white",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Updating..." : "Update Category"}
                </button>
            </form>
        </div>
    );
};

export default EditCategory;
