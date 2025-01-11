import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";
import "./index.css";

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
        <div className="edit-category-container">
            <h1 className="edit-category-title">Edit Category</h1>
            <form onSubmit={handleEdit} className="form-container">
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
                    className={`button-warning ${loading ? "button-disabled" : ""}`}
                >
                    {loading ? "Updating..." : "Update Category"}
                </button>
            </form>
        </div>
    );
    
};

export default EditCategory;
