import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../../../config/supabaseClient";
import BackButton from "../../../../components/Button/BackButton";
import { useRecipeContext } from "../Contexts/RecipeContext";
import CommonLoader from "../../../../components/Loader/CommonLoader";

// import "./index.css";

const RecipeFavorites = () => {
  const {
    favorites,
    toggleFavorite,
    fetchRecipesByIds,
    loading,
    filters,
    applyFilters,
  } = useRecipeContext();

  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [search, setSearch] = useState(""); // Added search state
  const [isOverlayOpen, setOverlayOpen] = useState(false);

  const [isIngredientOverlayOpen, setIngredientOverlayOpen] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState('');
  
  const [matchingIngredients, setMatchingIngredients] = useState([]);
  const navigate = useNavigate();

  // Fetch filter options (categories, tags, and equipment)
  const fetchFilterOptions = async () => {
    try {
      const [{ data: categoriesData }, { data: tagsData }, { data: equipmentData }] = await Promise.all([
        supabase.from("category").select("id, name"),
        supabase.from("tags").select("id, name"),
        supabase.from("equipment").select("id, name"),
      ]);

      setCategories(categoriesData || []);
      setTags(tagsData || []);
      setEquipment(equipmentData || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  useEffect(() => {
          // Add 'page' class to the body and set background color for the whole page
          document.body.classList.add('page');
  
          // Clean up when the component is unmounted
          return () => {
              document.body.classList.remove('page');
              document.body.style.backgroundColor = "";  // Reset background color if needed
          };
      }, []);

  // Fetch favorite recipes
  useEffect(() => {
    const fetchFavoriteRecipes = async () => {
      if (favorites.length === 0) {
        setFavoriteRecipes([]);
        setIsLoading(false);
        return;
      }

      try {
        const data = await fetchRecipesByIds(favorites);
        if (data) {
          const enrichedData = data.map((recipe) => ({
            ...recipe,
            tags: recipe.recipe_tags?.map((tag) => tag.tags.name) || [],
            equipment: recipe.recipe_equipment?.map((equip) => equip.equipment.name) || [],
          }));
          setFavoriteRecipes(enrichedData);
        } else {
          setFavoriteRecipes([]);
        }
      } catch (err) {
        console.error("Error fetching favorite recipes:", err.message);
        setFavoriteRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteRecipes();
    fetchFilterOptions();
  }, [favorites, fetchRecipesByIds]);

  // Filter favorite recipes based on search term and filters
  const filteredRecipes = favoriteRecipes.filter((recipe) => {
    const matchesSearch = recipe.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filters.categories.length
      ? filters.categories.some((category) =>
          (recipe.categories || []).includes(category)
        )
      : true;

    const matchesTags = filters.tags.length
      ? filters.tags.some((tag) => (recipe.tags || []).includes(tag))
      : true;

    const matchesEquipment = filters.equipment.length
      ? filters.equipment.some((equip) => (recipe.equipment || []).includes(equip))
      : true;

    const matchesCookTime = filters.cookTime
      ? recipe.cook_time <= filters.cookTime
      : true;

    return matchesSearch && matchesCategory && matchesTags && matchesEquipment && matchesCookTime;
  });

//   const filteredRecipes = recipes.filter((recipe) => {
//     const matchesSearch = recipe.name?.toLowerCase().includes(search.toLowerCase());

//     // Handle union logic (OR) for categories
//     const matchesCategory = filters.categories.length
//         ? filters.categories.some((category) =>
//             (recipe.categories || []).includes(category)
//         )
//         : true;

//     // Handle union logic (OR) for tags
//     const matchesTags = filters.tags.length
//         ? filters.tags.some((tag) => (recipe.tags || []).includes(tag))
//         : true;

//     // Handle union logic (OR) for equipment
//     const matchesEquipment = filters.equipment.length
//         ? filters.equipment.some((equip) => (recipe.equipment || []).includes(equip))
//         : true;

//     // Handle cooking time (single condition, no union needed)
//     const matchesCookTime = filters.cookTime
//         ? recipe.cook_time <= filters.cookTime
//         : true;
    
//     // Handle intersection logic (AND) for ingredients
//     const matchesIngredients = filters.ingredients.length
//         ? filters.ingredients.every((ingredient) =>
//                 (recipe.ingredients || []).some(
//                     (ing) => ing.toLowerCase() === ingredient.toLowerCase()
//                 )
//             )
//         : true;

//     return matchesSearch && matchesCategory && matchesTags && matchesEquipment && matchesCookTime && matchesIngredients;
// });

const handleIngredientAdd = (ingredient) => {
    if (!filters.ingredients.includes(ingredient.name)) {
        applyFilters({
            ingredients: [...filters.ingredients, ingredient.name], // Add the name to filters
        });
        setMatchingIngredients((prev) => ({
            ...prev,
            [ingredient.name]: ingredient.icon_path, // Add icon_path to lookup
        }));
    }
};

const handleIngredientRemove = (ingredientName) => {
    applyFilters({
        ingredients: filters.ingredients.filter((ing) => ing !== ingredientName), // Remove the ingredient from the filter
    });
};

const handleApplyFilters = () => {
    setOverlayOpen(false); // Close overlay on apply
};

const isAllSelected = () => {
    return (
        filters.categories.length === categories.length &&
        filters.tags.length === tags.length &&
        filters.equipment.length === equipment.length
    );
};

const isAnySelected = () => {
    return (
        filters.categories.length > 0 ||
        filters.tags.length > 0 ||
        filters.equipment.length > 0
    );
};

const handleSelectAll = () => {
    applyFilters({
        categories: categories.map((category) => category.name),
        tags: tags.map((tag) => tag.name),
        equipment: equipment.map((equip) => equip.name),
    });
};

const handleClear = () => {
    applyFilters({
        categories: [],
        tags: [],
        equipment: [],
    });
};
  const fetchMatchingIngredients = async (search) => {
    if (!search.trim()) {
        setMatchingIngredients([]);
        return;
    }
    try {
        const { data, error } = await supabase
            .from('ingredients') // Replace with your table name
            .select('name, icon_path')
            .ilike('name', `%${search}%`); // Case-insensitive search

        if (error) {
            console.error('Error fetching ingredients:', error);
            return;
        }
        console.log("Matching Ingredients:", data); // Debug: Check if icon_path is present
        setMatchingIngredients(data || []);
    } catch (error) {
        console.error('Unexpected error:', error);
    }
  };

  

  if (isLoading || loading) {
    return <CommonLoader />;
  }

  return (
    <div className="explore-recipes-container">
      <BackButton />
      <h1 className="page-title">Your Favorite Recipes</h1>
  
      {/* Search Bar */}
            <div className="search-container">
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button
            onClick={() => setOverlayOpen(true)}
            className="filters-button"
            title="Filter"
            >
             <svg viewBox="0 0 512 512" height="1em">
                <path
                d="M0 416c0 17.7 14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384c-17.7 0-32 14.3-32 32zm128 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM320 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32-80c-32.8 0-61 19.7-73.3 48L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-54.7 0c-12.3-28.3-40.5-48-73.3-48zM192 128a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm73.3-64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48L32 64C14.3 64 0 78.3 0 96s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 128c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64z"
                ></path>
            </svg>
        </button>
      </div>
  
      {/* Recipe List */}
      <div className="recipes-list">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() =>
                navigate(`/recipes/recipe/${recipe.id}`, {
                  state: { recipe_id: recipe.id, recipe_name: recipe.name },
                })
              }
              className="recipe-card"
              title={`View details for ${recipe.name}`}
            >
              <div className="image-container">
                  <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                      alt={recipe.name}
                      className="recipe-image"
                  />
                  <button
                      onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(recipe.id);
                      }}
                      className="favorite-button"
                  >
                      {favorites.includes(recipe.id) ? "❤️" : "🤍"}
                  </button>
              </div>
              <div className="recipe-details">
                <h3>{recipe.name}</h3>
                <p>{recipe.description}</p>
                <p>Prep Time: {recipe.prep_time} mins</p>
                <p>Cook Time: {recipe.cook_time} mins</p>
  
                {/* Tags */}
                {recipe.tags?.length > 0 && (
                  <div className="tags-container">
                    <strong>Tags:</strong>
                    {recipe.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
  
                {/* Equipment */}
                {recipe.equipment?.length > 0 && (
                  <div className="equipment-container">
                    <strong>Equipment:</strong>
                    {recipe.equipment.map((item, index) => (
                      <span key={index} className="equipment">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="no-recipes-message">No favorite recipes found. Start adding some!</p>
        )}
      </div>
  
      {/* Filter Overlay */}
      {isOverlayOpen && (
        <div className="filter-overlay">
            <button className="close-button" onClick={() => setOverlayOpen(false)}>
            X
            </button>
            <h2 className="filter-title">Filter Options</h2>
            <div className="filter-content">
            {!isAnySelected() && (
                <button onClick={handleSelectAll} className="select-all-button">
                Select All
                </button>
            )}
            {isAnySelected() && !isAllSelected() && (
                <div className="filter-buttons">
                <button onClick={handleClear} className="clear-button">
                    Clear
                </button>
                <button onClick={handleSelectAll} className="select-all-button">
                    Select All
                </button>
                </div>
            )}
            {isAllSelected() && (
                <button onClick={handleClear} className="deselect-all-button">
                Deselect All
                </button>
            )}
            </div>
            <div className="scrollable-content">
            <button
                onClick={() => setIngredientOverlayOpen(true)}
                className="add-ingredient-button"
            >
                + Search Recipe by Ingredient
            </button>
            <div className="selected-ingredients">
                <h3>Selected Ingredients:</h3>
                {filters.ingredients.length > 0 ? (
                filters.ingredients.map((ingredient, index) => (
                    <div className="ingredient-item" key={index}>
                    <span>{ingredient}</span>
                    <button
                        onClick={() => handleIngredientRemove(ingredient)}
                        className="remove-ingredient-button"
                    >
                        X
                    </button>
                    </div>
                ))
                ) : (
                <p>No ingredients selected.</p>
                )}
            </div>
            {/* Category */}
            <div className="filter-group">
                <h3>Category</h3>
                {categories.map((category) => (
                <label key={category.id} className="filter-label">
                    <input
                    type="checkbox"
                    checked={filters.categories.includes(category.name)}
                    onChange={(e) => {
                        const checked = e.target.checked;
                        applyFilters({
                        ...filters,
                        categories: checked
                            ? [...filters.categories, category.name]
                            : filters.categories.filter((c) => c !== category.name),
                        });
                    }}
                    />
                    {category.name}
                </label>
                ))}
            </div>

            {/* Tags */}
            <div className="filter-group">
                <h3>Tags</h3>
                {tags.map((tag) => (
                <label key={tag.id} className="filter-label">
                    <input
                    type="checkbox"
                    checked={filters.tags.includes(tag.name)}
                    onChange={(e) => {
                        const checked = e.target.checked;
                        applyFilters({
                        ...filters,
                        tags: checked
                            ? [...filters.tags, tag.name]
                            : filters.tags.filter((t) => t !== tag.name),
                        });
                    }}
                    />
                    {tag.name}
                </label>
                ))}
            </div>

            {/* Equipment */}
            <div className="filter-group">
                <h3>Equipment</h3>
                {equipment.map((equip) => (
                <label key={equip.id} className="filter-label">
                    <input
                    type="checkbox"
                    checked={filters.equipment.includes(equip.name)}
                    onChange={(e) => {
                        const checked = e.target.checked;
                        applyFilters({
                        ...filters,
                        equipment: checked
                            ? [...filters.equipment, equip.name]
                            : filters.equipment.filter((e) => e !== equip.name),
                        });
                    }}
                    />
                    {equip.name}
                </label>
                ))}
            </div>

            {/* Cooking Time */}
            <div className="filter-group">
                <h3>Cooking Time</h3>
                <select
                    className="cook-time-dropdown"
                    value={filters.cookTime || ''} // Maintain selected cooking time
                    onChange={(e) =>
                        applyFilters({
                            ...filters,
                            cookTime: e.target.value ? Number(e.target.value) : null,
                        })
                    }
                >
                    <option value="">Any</option>
                    <option value="15">Less than 15 mins</option>
                    <option value="30">Less than 30 mins</option>
                    <option value="60">Less than 60 mins</option>
                </select>
            </div>
            </div>
            <button onClick={handleApplyFilters} className="apply-filters-button">
            Apply Filters
            </button>
        </div>
      )}

      {isIngredientOverlayOpen && (
        <div className="ingredient-overlay">
            <button
            onClick={() => setIngredientOverlayOpen(false)}
            className="close-overlay-button"
            >
            X
            </button>
            <h2>Search Ingredients</h2>
            <div className="search-bar">
            <input
                type="text"
                placeholder="Type an ingredient..."
                value={ingredientSearch}
                onChange={(e) => {
                setIngredientSearch(e.target.value);
                fetchMatchingIngredients(e.target.value);
                }}
            />
            </div>
            <div className="matching-ingredients">
            {matchingIngredients.length > 0 ? (
                matchingIngredients.map((ingredient, index) => (
                <div
                    className="ingredient-item"
                    key={index}
                    onClick={() => handleIngredientAdd(ingredient)}
                >
                    <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${ingredient.icon_path}`}
                    alt={ingredient.name}
                    className="ingredient-icon"
                    />
                    <span>{ingredient.name}</span>
                </div>
                ))
            ) : (
                <p>No matching ingredients found.</p>
            )}
            </div>
            <div className="selected-ingredients">
            <h3>Selected Ingredients:</h3>
            {filters.ingredients.length > 0 ? (
                filters.ingredients.map((ingredient, index) => (
                <div className="ingredient-item" key={index}>
                    <span>{ingredient}</span>
                    <button
                    onClick={() => handleIngredientRemove(ingredient)}
                    className="remove-ingredient-button"
                    >
                    X
                    </button>
                </div>
                ))
            ) : (
                <p>No ingredients selected.</p>
            )}
            </div>
            <button
            onClick={() => setIngredientOverlayOpen(false)}
            className="find-recipes-button"
            >
            Find Recipes
            </button>
        </div>
      )}
    </div>
  );
};

export default RecipeFavorites;
