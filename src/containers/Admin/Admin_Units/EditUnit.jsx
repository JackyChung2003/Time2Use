import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../../../config/supabaseClient";

const EditUnit = () => {
    const { id } = useParams(); // Get unit ID from URL params
    const [unitTag, setUnitTag] = useState("");
    const [unitDescription, setUnitDescription] = useState("");
    const [conversionRateToGrams, setConversionRateToGrams] = useState("");
    const [selectedRoleId, setSelectedRoleId] = useState(null); // Assuming unit might have a role association
    const [roleName, setRoleName] = useState(""); // To store the role name if applicable
    const [roles, setRoles] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUnitData = async () => {
            try {
                // Fetch unit details from 'unit' table
                const { data: unit, error: unitError } = await supabase
                    .from("unit")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (unitError) throw unitError;

                // Populate form with existing unit data
                setUnitTag(unit.unit_tag);
                setUnitDescription(unit.unit_description);
                setConversionRateToGrams(unit.conversion_rate_to_grams);
            } catch (error) {
                console.error("Error fetching unit data:", error.message);
            }
        };

        fetchUnitData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!unitTag || !unitDescription || !conversionRateToGrams) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            // Update the unit in the 'unit' table
            const { error: updateError } = await supabase
                .from("unit")
                .update({
                    unit_tag: unitTag,
                    unit_description: unitDescription,
                    conversion_rate_to_grams: conversionRateToGrams,
                })
                .eq("id", id);

            if (updateError) throw updateError;

            alert("Unit updated successfully!");
            navigate("/admin/units"); // Redirect to units list
        } catch (error) {
            console.error("Error updating unit:", error.message);
            alert("Failed to update unit.");
        }
    };

    return (
        <div className="edit-unit-container">
            <div className="admin-content">
                <h2>Edit Unit</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Unit Tag:</label>
                        <input
                            type="text"
                            value={unitTag}
                            onChange={(e) => setUnitTag(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Unit Description:</label>
                        <input
                            type="text"
                            value={unitDescription}
                            onChange={(e) => setUnitDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Conversion Rate to Grams:</label>
                        <input
                            type="number"
                            value={conversionRateToGrams || ""}
                            onChange={(e) => setConversionRateToGrams(e.target.value)}
                            required
                            min="0"
                        />
                    </div>

                    <button type="submit" className="submit-btn">
                        Update Unit
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditUnit;
