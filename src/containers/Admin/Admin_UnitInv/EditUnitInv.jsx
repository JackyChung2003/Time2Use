import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "../../../config/supabaseClient";

const EditUnitInv = () => {
    const { id } = useParams(); // Get unit inventory ID from URL params
    const [unitinvTag, setUnitinvTag] = useState("");
    const [conversionRateToGramsForCheck, setConversionRateToGramsForCheck] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUnitInvData = async () => {
            try {
                // Fetch unit inventory details from 'unitinv' table
                const { data: unitinv, error: unitinvError } = await supabase
                    .from("unitInv")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (unitinvError) throw unitinvError;

                // Populate form with existing unit inventory data
                setUnitinvTag(unitinv.unitInv_tag);
                setConversionRateToGramsForCheck(unitinv.conversion_rate_to_grams_for_check);
            } catch (error) {
                console.error("Error fetching unit inventory data:", error.message);
            }
        };

        fetchUnitInvData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!unitinvTag || !conversionRateToGramsForCheck) {
            alert("Please fill all required fields.");
            return;
        }

        try {
            // Update the unit inventory in the 'unitinv' table
            const { error: updateError } = await supabase
                .from("unitInv")
                .update({
                    unitInv_tag: unitinvTag,
                    conversion_rate_to_grams_for_check: conversionRateToGramsForCheck,
                })
                .eq("id", id);

            if (updateError) throw updateError;

            alert("Unit inventory updated successfully!");
            navigate("/admin/unitinv"); // Redirect to unit inventory list
        } catch (error) {
            console.error("Error updating unit inventory:", error.message);
            alert("Failed to update unit inventory.");
        }
    };

    return (
        <div className="edit-unitinv-container">
            <div className="admin-content">
                <h2>Edit Unit Inventory</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Unit Inventory Tag:</label>
                        <input
                            type="text"
                            value={unitinvTag}
                            onChange={(e) => setUnitinvTag(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Conversion Rate to Grams for Check:</label>
                        <input
                            type="number"
                            value={conversionRateToGramsForCheck || ""}
                            onChange={(e) => setConversionRateToGramsForCheck(e.target.value)}
                            required
                            min="0"
                        />
                    </div>

                    <button type="submit" className="submit-btn">
                        Update Unit Inventory
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditUnitInv;
