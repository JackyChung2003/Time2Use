// import necessary hooks and supabase client
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";
import "./index.css";

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
        <div className="edit-equipment-container">
            <h1 className="edit-equipment-title">Edit Equipment</h1>
            {error && <p className="form-error">{error}</p>}
    
            <form onSubmit={handleSubmit} className="form-container">
                <label htmlFor="equipmentName" className="form-label">Equipment Name:</label>
                <input
                    type="text"
                    id="equipmentName"
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    required
                    className="form-input"
                />
    
                <button
                    type="submit"
                    disabled={loading}
                    className={`button-primary ${loading ? "button-disabled" : ""}`}
                >
                    {loading ? "Updating..." : "Update Equipment"}
                </button>
            </form>
        </div>
    );
    
};

export default EditEquipment;
