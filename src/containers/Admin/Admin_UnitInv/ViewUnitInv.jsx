import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import supabase from "../../../config/supabaseClient";

import BackButton from "../../../components/Button/BackButton";

const ViewUnitInv = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [unitinv, setUnitinv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUnitInvDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch unit inventory details
        const { data: unitinvData, error: unitinvError } = await supabase
          .from("unitInv")
          .select("*")
          .eq("id", id)
          .single();

        if (unitinvError) throw unitinvError;

        setUnitinv(unitinvData);
      } catch (err) {
        setError("Failed to fetch unit inventory details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnitInvDetails();
  }, [id]);

  const deleteUnitInv = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this unit inventory?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      // Delete unit inventory from the database
      const { error: unitinvError } = await supabase
        .from("unitInv")
        .delete()
        .eq("id", id);

      if (unitinvError) throw unitinvError;

      alert("Unit inventory deleted successfully.");
      navigate("/admin/unitinv"); // Redirect after deletion
    } catch (err) {
      setError("Failed to delete unit inventory.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading unit inventory...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Back Button */}
      <BackButton />

      {/* Action Buttons */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => navigate(`/admin/unitinv/edit/${id}`)} // Navigate to edit page
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#FFA500",
            color: "white",
            cursor: "pointer",
          }}
        >
          Edit Unit Inventory
        </button>
        <button
          onClick={() => deleteUnitInv(unitinv.id)} // Pass id to delete
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#f44336",
            color: "white",
            cursor: "pointer",
          }}
        >
          Delete Unit Inventory
        </button>
      </div>

      <h1>{unitinv.unitinv_tag}</h1>
      <p><span style={{ fontWeight: 'bold' }}>Unit Inventory Tag:</span> {unitinv.unitInv_tag}</p>
      <p><span style={{ fontWeight: 'bold' }}>Conversion Rate to Grams for Check:</span> {unitinv.conversion_rate_to_grams_for_check}</p>
    </div>
  );
};

export default ViewUnitInv;
