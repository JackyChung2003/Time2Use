import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";

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

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>Edit Tag</h1>
            <form onSubmit={handleSubmit} style={{ maxWidth: "400px" }}>
                <div style={{ marginBottom: "10px" }}>
                    <label htmlFor="tagName" style={{ display: "block", marginBottom: "5px" }}>
                        Tag Name:
                    </label>
                    <input
                        id="tagName"
                        type="text"
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        required
                        style={{
                            padding: "10px",
                            width: "100%",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                        }}
                    />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <button
                        type="button"
                        onClick={() => navigate(-1)} // Navigate back to the previous page
                        style={{
                            padding: "10px 20px",
                            borderRadius: "4px",
                            border: "none",
                            backgroundColor: "#ccc",
                            color: "black",
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
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
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditTag;