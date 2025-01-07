// import necessary hooks and supabase client
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";

const EditEquipment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [equipmentName, setEquipmentName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch existing equipment details
    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const { data, error } = await supabase
                    .from("equipment")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;

                setEquipmentName(data.name);
            } catch (err) {
                console.error("Error fetching equipment details", err);
                setError("Failed to fetch equipment details.");
            }
        };

        fetchEquipment();
    }, [id]);

    // Handle form submission to update equipment
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from("equipment")
                .update({ name: equipmentName })
                .eq("id", id);

            if (error) throw error;

            alert("Equipment updated successfully.");
            navigate("/equipment"); // Redirect back to equipment list
        } catch (err) {
            console.error("Error updating equipment", err);
            setError("Failed to update equipment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>Edit Equipment</h1>
            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label htmlFor="equipmentName">Equipment Name:</label>
                <input
                    type="text"
                    id="equipmentName"
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    required
                    style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Updating..." : "Update Equipment"}
                </button>
            </form>
        </div>
    );
};

export default EditEquipment;
