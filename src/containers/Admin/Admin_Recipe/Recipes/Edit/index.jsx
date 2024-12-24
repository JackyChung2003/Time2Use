import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import supabase from "../../../../../config/supabaseClient";

const EditRecipe = () => {
    const { id } = useParams(); // Get recipe ID from the URL
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState(null);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        prep_time: "",
        cook_time: "",
        category_ids: [],
        tag_ids: [],
        equipment_ids: [],
        ingredients: [{ name: "", quantity: "", unit: "" }],
        steps: [{ description: "" }],
        image: null,
        image_path: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch recipe data for editing
    useEffect(() => {
        const fetchRecipe = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("recipes")
                    .select("*")
                    .eq("id", id)
                    .single();
                if (error) throw error;

                setRecipe(data);
                setFormData((prev) => ({
                    ...prev,
                    ...data,
                    ingredients: data.ingredients || [{ name: "", quantity: "", unit: "" }],
                    steps: data.steps || [{ description: "" }],
                }));
            } catch (err) {
                console.error("Error fetching recipe:", err.message);
                setError("Failed to fetch recipe.");
            } finally {
                setLoading(false);
            }
        };

        const fetchCategoriesTagsEquipment = async () => {
            const { data: categories } = await supabase.from("category").select("*");
            const { data: tags } = await supabase.from("tags").select("*");
            const { data: equipment } = await supabase.from("equipment").select("*");

            setCategories(categories || []);
            setTags(tags || []);
            setEquipment(equipment || []);
        };

        fetchRecipe();
        fetchCategoriesTagsEquipment();
    }, [id]);

    // Handle input changes
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Handle image upload
    const handleImageUpload = async (file) => {
        try {
            const fileName = `${id}-${file.name}`;
            const { data, error } = await supabase.storage
                .from("recipe-pictures")
                .upload(fileName, file);
            if (error) throw error;

            return `recipe-pictures/${data.path}`;
        } catch (err) {
            console.error("Error uploading image:", err.message);
            return null;
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        setLoading(true);
        try {
            let imagePath = formData.image_path;

            if (formData.image) {
                const uploadedPath = await handleImageUpload(formData.image);
                if (uploadedPath) imagePath = uploadedPath;
            }

            const { error } = await supabase
                .from("recipes")
                .update({
                    name: formData.name,
                    description: formData.description,
                    prep_time: formData.prep_time,
                    cook_time: formData.cook_time,
                    image_path: imagePath,
                })
                .eq("id", id);

            if (error) throw error;

            alert("Recipe updated successfully!");
            navigate("/recipes"); // Redirect to the recipes page
        } catch (err) {
            console.error("Error updating recipe:", err.message);
            alert("Failed to update recipe.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Loading recipe...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
            <h1>Edit Recipe</h1>

            <label>Recipe Name:</label>
            <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                style={{ width: "100%", margin: "5px 0", padding: "10px" }}
            />

            <label>Description:</label>
            <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                style={{ width: "100%", margin: "5px 0", padding: "10px" }}
            />

            <label>Preparation Time (mins):</label>
            <input
                type="number"
                value={formData.prep_time}
                onChange={(e) => handleChange("prep_time", e.target.value)}
                style={{ width: "100%", margin: "5px 0", padding: "10px" }}
            />

            <label>Cooking Time (mins):</label>
            <input
                type="number"
                value={formData.cook_time}
                onChange={(e) => handleChange("cook_time", e.target.value)}
                style={{ width: "100%", margin: "5px 0", padding: "10px" }}
            />

            <label>Image:</label>
            <input
                type="file"
                onChange={(e) => handleChange("image", e.target.files[0])}
                style={{ width: "100%", margin: "5px 0", padding: "10px" }}
            />

            <button
                onClick={handleSubmit}
                style={{
                    marginTop: "20px",
                    padding: "10px 20px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                }}
            >
                Update Recipe
            </button>
        </div>
    );
};

export default EditRecipe;
