import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import supabase from "../../../config/supabaseClient";

import BackButton from "../../../components/Button/BackButton";

const ViewUnit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUnitDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch unit details
        const { data: unitData, error: unitError } = await supabase
          .from("unit")
          .select("*")
          .eq("id", id)
          .single();

        if (unitError) throw unitError;

        setUnit(unitData);
      } catch (err) {
        setError("Failed to fetch unit details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnitDetails();
  }, [id]);

  const deleteUnit = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this unit?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      // Delete unit from the database
      const { error: unitError } = await supabase
        .from("unit")
        .delete()
        .eq("id", id);

      if (unitError) throw unitError;

      alert("Unit deleted successfully.");
      navigate("/admin/units"); // Redirect after deletion
    } catch (err) {
      setError("Failed to delete unit.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading unit...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Back Button */}
      <BackButton />

      {/* Action Buttons */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => navigate(`/admin/units/edit/${id}`)} // Navigate to edit page
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#FFA500",
            color: "white",
            cursor: "pointer",
          }}
        >
          Edit Unit
        </button>
        <button
          onClick={() => deleteUnit(unit.id)} // Pass id to delete
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#f44336",
            color: "white",
            cursor: "pointer",
          }}
        >
          Delete Unit
        </button>
      </div>

      <h1>{unit.unit_description}</h1>
      <p><span style={{ fontWeight: 'bold' }}>Unit Tag:</span> {unit.unit_tag}</p>
      <p><span style={{ fontWeight: 'bold' }}>Conversion Rate to Grams:</span> {unit.conversion_rate_to_grams}</p>
    </div>
  );
};

export default ViewUnit;
