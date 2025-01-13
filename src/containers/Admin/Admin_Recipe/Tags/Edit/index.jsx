import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";
import "./index.css";
import Loader from "../../../../../components/Loader";

const EditTag = () => {
    const { id } = useParams(); // Get the tag ID from the URL
    const navigate = useNavigate(); // Initialize navigate function

    const [tagName, setTagName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch tag details on component mount
    useEffect(() => {
        const fetchTag = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from("tags") // Ensure this matches your Supabase table name
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;

                setTagName(data.name);
            } catch (err) {
                console.error("Failed to fetch tag details:", err);
                setError("Failed to fetch tag details.");
            } finally {
                setLoading(false);
            }
        };

        fetchTag();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from("tags") // Ensure this matches your Supabase table name
                .update({ name: tagName })
                .eq("id", id);

            if (error) throw error;

            alert("Tag updated successfully!");
            navigate(-1); // Navigate back to the previous page
        } catch (err) {
            console.error("Failed to update tag:", err);
            setError("Failed to update tag.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return  <Loader />;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div className="edit-tag-container">
            <h1 className="edit-tag-title">Edit Tag</h1>
            {error && <p className="form-error">{error}</p>}
            {loading &&  <Loader />}
    
            <form onSubmit={handleSubmit} className="form-container">
                <div className="form-group">
                    <label htmlFor="tagName" className="form-label">
                        Tag Name:
                    </label>
                    <input
                        id="tagName"
                        type="text"
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="button-secondary"
                    >
                        Cancel
                    </button>
                    <button type="submit" className="button-primary">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
    
};

export default EditTag;