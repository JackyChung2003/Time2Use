import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../../config/supabaseClient";
import SortableIngredientList from "../../../../../components/SortableDragAndDrop/Ingredient_List";
import './index.css';

const CreateRecipe = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]); // All tags from Supabase
    const [selectedTags, setSelectedTags] = useState([]); // Selected tags
    const [equipment, setEquipment] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState([]); // Selected equipment
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        prep_time: "",
        cook_time: "",
        total_time: 0,
        category_ids: [], // Now an array
        tag_ids: [],
        equipment_ids: [],
        ingredients: [{ name: "", quantity: "", unit: "" }],
        steps: [{ description: "" }],
        image: null,
    });
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState("");
    const [ingredients, setIngredients] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]); // Selected categories

    // Fetch data for dropdowns
    useEffect(() => {
        const fetchData = async () => {
            const { data: categories } = await supabase.from("category").select("*");
            const { data: tags } = await supabase.from("tags").select("*").order("name", { ascending: true });
            const { data: equipment } = await supabase.from("equipment").select("*");

            setCategories(categories);
            setTags(tags);
            setEquipment(equipment);
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchIngredients = async () => {
            const { data: fetchedIngredients, error } = await supabase.from("ingredients").select("*");
            if (error) {
                console.error("Error fetching ingredients:", error.message);
            } else {
                console.log("Fetched ingredients:", fetchedIngredients);
                setIngredients(fetchedIngredients); // Ensure this stores the correct data
            }
        };
        fetchIngredients();
    }, []);

    // Auto-calculate total time
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            total_time: Number(prev.prep_time || 0) + Number(prev.cook_time || 0),
        }));
    }, [formData.prep_time, formData.cook_time]);

    const handleSaveRecipe = async () => {
        try {
          const imageFile = formData.image; // Assuming `formData.image` contains the file
          let imagePath = null;
      
          if (imageFile) {
            imagePath = await handleImageUpload(imageFile, formData.name); // Pass the recipe name
          }
      
          // Save the recipe, including the imagePath
          const { data: recipe, error } = await supabase
            .from('recipes')
            .insert({
              name: formData.name,
              description: formData.description,
              prep_time: formData.prep_time,
              cook_time: formData.cook_time,
              image_path: imagePath, // Save the uploaded image path
            })
            .select()
            .single();
      
          if (error) throw error;

          const recipeId = recipe.id;

          console.log('Recipe id:', recipeId);
          // Save related data
          await handleSaveRecipeTags(recipeId, selectedTags);
          await handleSaveRecipeIngredients(recipeId, ingredients);
          await handleSaveRecipeEquipment(recipeId, selectedEquipment);
          await handleSaveRecipeSteps(recipeId, formData.steps);
          await handleSaveRecipeCategories(recipeId, selectedCategories);

      
          console.log('Recipe saved successfully:', recipe);

          
          navigate("/admin/category-management/recipes"); // Navigate back to the recipe list
        } catch (error) {
          console.error('Error saving recipe:', error.message);
        }
      };

    const slugify = (name) => {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
          .replace(/(^-|-$)+/g, '');   // Remove leading and trailing hyphens
      };
      
      const handleImageUpload = async (file, recipeName) => {
        try {
          const slugifiedName = slugify(recipeName); // Convert the recipe name to a slug
          const fileExtension = file.name.split('.').pop(); // Get file extension
          const fileName = `${slugifiedName}.${fileExtension}`; // Create the file name with slug
      
          const { data, error } = await supabase.storage
            .from('recipe-pictures') // Name of your bucket
            .upload(fileName, file, {
              cacheControl: '3600', // Optional: Cache control
              upsert: false, // Avoid overwriting
            });
      
          if (error) throw error;
      
          const imagePath = `recipe-pictures/${data.path}`; // Save this path to your database
          console.log('File uploaded successfully:', imagePath);
          return imagePath; // Return the path for further use
        } catch (error) {
          console.error('Error uploading file:', error.message);
          return null;
        }
      };

      const handleSaveRecipeTags = async (recipeId, selectedTags) => {
        try {
            if (selectedTags.length > 0) {
                const recipeTags = selectedTags.map((tag) => ({
                    recipe_id: recipeId,
                    tag_id: tag.id,
                }));
    
                const { error } = await supabase.from("recipe_tags").insert(recipeTags);
                if (error) throw error;
    
                console.log("Recipe tags saved successfully!");
            }
        } catch (error) {
            console.error("Error saving recipe tags:", error.message);
        }
    };

    const handleSaveRecipeIngredients = async (recipeId, ingredients) => {
        try {
            if (ingredients.length > 0) {
                const recipeIngredients = ingredients
                    .filter((ingredient) => ingredient.ingredient_id) // Use `ingredient_id` to filter out invalid entries
                    .map((ingredient) => ({
                        recipe_id: recipeId,
                        ingredient_id: ingredient.ingredient_id, // Correctly map the `ingredient_id`
                        quantity: parseFloat(ingredient.quantity), // Ensure quantity is numeric
                    }));
    
                // console.log("Recipe Ingredients to save:", recipeIngredients);
    
                if (recipeIngredients.length === 0) {
                    console.error("No valid ingredients to save");
                    return;
                }
    
                const { error } = await supabase.from("recipe_ingredients").insert(recipeIngredients);
                if (error) throw error;
    
                // console.log("Recipe ingredients saved successfully!");
            }
        } catch (error) {
            console.error("Error saving recipe ingredients:", error.message);
        }
    };
    
    const handleSaveRecipeEquipment = async (recipeId, selectedEquipment) => {
        try {
            if (selectedEquipment.length > 0) {
                const recipeEquipment = selectedEquipment.map((equipment) => ({
                    recipe_id: recipeId,
                    equipment_id: equipment.id,
                    quantity: 1, // Assuming quantity is 1 for all equipment
                }));
    
                const { error } = await supabase.from("recipe_equipment").insert(recipeEquipment);
                if (error) throw error;
    
                console.log("Recipe equipment saved successfully!");
            }
        } catch (error) {
            console.error("Error saving recipe equipment:", error.message);
        }
    };
    
    const handleSaveRecipeSteps = async (recipeId, steps) => {
        try {
            if (steps.length > 0) {
                const recipeSteps = steps.map((step, index) => ({
                    recipe_id: recipeId,
                    step_number: index + 1,
                    instruction: step.description,
                }));
    
                const { error } = await supabase.from("steps").insert(recipeSteps);
                if (error) throw error;
    
                // console.log("Recipe steps saved successfully!");
            }
        } catch (error) {
            console.error("Error saving recipe steps:", error.message);
        }
    };

    const handleSaveRecipeCategories = async (recipeId, selectedCategories) => {
        try {
            if (selectedCategories.length > 0) {
                const recipeCategories = selectedCategories.map((category) => ({
                    recipe_id: recipeId,
                    category_id: category.id,
                }));
    
                const { error } = await supabase.from("recipe_category").insert(recipeCategories);
                if (error) throw error;
    
                console.log("Recipe categories saved successfully!");
            }
        } catch (error) {
            console.error("Error saving recipe categories:", error.message);
        }
    };
    
    // Add new category
    const handleAddCategory = async () => {
        if (newCategory.trim() === "") return;

        const { data, error } = await supabase.from("category").insert({ name: newCategory });
        if (error) {
            console.error("Error adding category:", error);
        } else {
            setCategories((prev) => [...prev, data[0]]);
            setIsCategoryModalOpen(false);
            setNewCategory("");
        }
    };

    // Add selected tag or equipment
    const handleAddSelection = (selected, setter, item) => {
        if (!selected.some((selectedItem) => selectedItem.id === item.id)) {
            setter([...selected, item]);
        }
    };

    // Remove selected tag or equipment
    const handleRemoveSelection = (selected, setter, itemId) => {
        setter(selected.filter((item) => item.id !== itemId));
    };

    const handleIngredientUpdate = (updatedIngredients) => {
        setIngredients(updatedIngredients);
        console.log("Updated Ingredients:", updatedIngredients); // Log the updated list for debugging

      };

    const handleStepChange = (index, value) => {
        setFormData((prev) => ({
            ...prev,
            steps: prev.steps.map((step, i) =>
                i === index ? { ...step, description: value } : step
            ),
        }));
    };

    const addStep = () => {
        setFormData((prev) => ({
            ...prev,
            steps: [...prev.steps, { description: "" }],
        }));
    };

    const removeStep = (index) => {
        setFormData((prev) => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="create-recipe-container">
            <h1 className="create-recipe-title">Create New Recipe</h1>

            {/* Recipe Information */}
            <div className="form-section">
                <label htmlFor="recipe-name" className="form-label">Recipe Name:</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="form-input"
                />

                <label htmlFor="recipe-description" className="form-label">Description:</label>
                <textarea
                    id="recipe-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="form-textarea"
                />

                <label htmlFor="recipe-image" className="form-label">Image: (only file with &lt;1mb allowed)</label>
                <input
                    id="recipe-image"
                    type="file"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                    className="form-file-input"
                />
            </div>

            {/* Preparation Details */}
            <div className="prep-details">
                <label className="form-label">Preparation Time (mins):</label>
                <input
                    type="number"
                    value={formData.prep_time}
                    onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                    className="form-input"
                />

                <label className="form-label">Cooking Time (mins):</label>
                <input
                    type="number"
                    value={formData.cook_time}
                    onChange={(e) => setFormData({ ...formData, cook_time: e.target.value })}
                    className="form-input"
                />

                <label className="form-label">Total Time (mins):</label>
                <input type="number" value={formData.total_time} readOnly className="form-input-readonly" />
            </div>

            {/* Categories */}
            <h2 className="form-subtitle">Categories</h2>
            <select
                onChange={(e) => {
                    const categoryId = Number(e.target.value);
                    const category = categories.find((c) => c.id === categoryId);
                    if (category) handleAddSelection(selectedCategories, setSelectedCategories, category);
                    e.target.value = ""; // Reset dropdown
                }}
                className="form-select"
            >
                <option value="">Select a category...</option>
                {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                        {category.name}
                    </option>
                ))}
            </select>

            <div className="selected-list">
                <h3 className="selected-list-title">Selected Categories:</h3>
                {selectedCategories.map((category) => (
                    <div key={category.id} className="selected-item">
                        {category.name} <button className="remove-button" onClick={() => handleRemoveSelection(selectedCategories, setSelectedCategories, category.id)}>Remove</button>
                    </div>
                ))}
            </div>

            {/* Tags */}
            <h2 className="form-subtitle">Tags</h2>
            <select
                onChange={(e) => {
                    const tagId = Number(e.target.value);
                    const tag = tags.find((t) => t.id === tagId);
                    if (tag) handleAddSelection(selectedTags, setSelectedTags, tag);
                    e.target.value = ""; // Reset dropdown
                }}
                className="form-select"
            >
                <option value="">Select a tag...</option>
                {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                        {tag.name}
                    </option>
                ))}
            </select>

            <div className="selected-list">
                <h3 className="selected-list-title">Selected Tags:</h3>
                {selectedTags.map((tag) => (
                    <div key={tag.id} className="selected-item">
                        {tag.name} <button className="remove-button" onClick={() => handleRemoveSelection(selectedTags, setSelectedTags, tag.id)}>Remove</button>
                    </div>
                ))}
            </div>

            {/* Equipment */}
            <h2 className="form-subtitle">Equipment</h2>
            <select
                onChange={(e) => {
                    const equipmentId = Number(e.target.value);
                    const equip = equipment.find((e) => e.id === equipmentId);
                    if (equip) handleAddSelection(selectedEquipment, setSelectedEquipment, equip);
                    e.target.value = ""; // Reset dropdown
                }}
                className="form-select"
            >
                <option value="">Select equipment...</option>
                {equipment.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                ))}
            </select>

            <div className="selected-list">
                <h3 className="selected-list-title">Selected Equipment:</h3>
                {selectedEquipment.map((equip) => (
                    <div key={equip.id} className="selected-item">
                        {equip.name} <button className="remove-button" onClick={() => handleRemoveSelection(selectedEquipment, setSelectedEquipment, equip.id)}>Remove</button>
                    </div>
                ))}
            </div>

            {/* Modal for Adding New Category */}
            {isCategoryModalOpen && (
                <div className="modal">
                    <h2 className="modal-title">Add New Category</h2>
                    <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="form-input"
                    />
                    <button onClick={handleAddCategory} className="button-primary">Add</button>
                    <button onClick={() => setIsCategoryModalOpen(false)} className="button-secondary">Cancel</button>
                </div>
            )}

            {/* Ingredients Section */}
            <div className="ingredients-section">
                <h1 className="form-subtitle">Create Recipe</h1>
                <SortableIngredientList
                    initialIngredients={ingredients}
                    onIngredientUpdate={handleIngredientUpdate}
                />
            </div>

            {/* Steps Section */}
            <div className="steps-section">
                <h2 className="form-subtitle">Steps</h2>
                {formData.steps.map((step, index) => (
                    <div key={index} className="step-item">
                        <textarea
                            value={step.description}
                            onChange={(e) => handleStepChange(index, e.target.value)}
                            placeholder={`Step ${index + 1}`}
                            className="form-textarea"
                        />
                        <button
                            onClick={() => removeStep(index)}
                            className="button-secondary remove-step-button"
                        >
                            Remove
                        </button>
                    </div>
                ))}
                <button
                    onClick={addStep}
                    className="button-primary add-step-button"
                >
                    + Add Step
                </button>
            </div>

            <button
                onClick={handleSaveRecipe}
                className="button-primary save-recipe-button"
            >
                Save Recipe
            </button>
        </div>
    );

    
};

export default CreateRecipe;
