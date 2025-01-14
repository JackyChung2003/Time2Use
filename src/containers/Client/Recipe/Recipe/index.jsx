import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../../../../config/supabaseClient';

import BackButton from '../../../../components/Button/BackButton';

import { useRecipeContext } from '../Contexts/RecipeContext';
import CommonLoader from './../../../../components/Loader/CommonLoader';

import './index.css';

const RecipeExplore = () => {
    const {
        recipes,
        filters,
        applyFilters,
        loading,
        fetchRecipes,
        mealTypes,
        userData,
        favorites,
        toggleFavorite, 
      } = useRecipeContext();
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [search, setSearch] = useState('');
    const [isOverlayOpen, setOverlayOpen] = useState(false);

    const [isIngredientOverlayOpen, setIngredientOverlayOpen] = useState(false);
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [matchingIngredients, setMatchingIngredients] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);

    // const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(null); // For showing the add modal
    const [newMeal, setNewMeal] = useState({
        notes: "",
        time: "",
        meal_type_id: "",
        planned_date: "",
        recipe_id: "",
      });

    const location = useLocation();
    const navigate = useNavigate();

    // Extract the state passed from the previous page
    const { planned_date, meal_type_id, activity_type } = location.state || {};

    // Dynamically map meal_type_id to its name
    const mealTypeName =
        mealTypes.find((mealType) => mealType.id === meal_type_id)?.name || "Unknown Meal Type";
    
    const fetchFilterOptions = async () => {
        try {
            // Fetch categories, tags, and equipment
            const [{ data: categoriesData, error: categoriesError }, { data: tagsData }, { data: equipmentData }] = await Promise.all([
                supabase.from('category').select('id, name'),
                supabase.from('tags').select('id, name'),
                supabase.from('equipment').select('id, name'),
            ]);
    
            if (categoriesError) {
                console.error('Error fetching categories:', categoriesError);
                return;
            }
    
            setCategories(categoriesData || []); // Set fetched categories
            setTags(tagsData || []);
            setEquipment(equipmentData || []);
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
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

    useEffect(() => {
        fetchRecipes();
        fetchFilterOptions();
    }, []);

    useEffect(() => {
        fetchRecipes(); // Fetch recipes or re-filter based on filters
      }, [filters]);


    const filteredRecipes = recipes.filter((recipe) => {
        const matchesSearch = recipe.name?.toLowerCase().includes(search.toLowerCase());
    
        // Handle union logic (OR) for categories
        const matchesCategory = filters.categories.length
            ? filters.categories.some((category) =>
                (recipe.categories || []).includes(category)
            )
            : true;

        // Handle union logic (OR) for tags
        const matchesTags = filters.tags.length
            ? filters.tags.some((tag) => (recipe.tags || []).includes(tag))
            : true;

        // Handle union logic (OR) for equipment
        const matchesEquipment = filters.equipment.length
            ? filters.equipment.some((equip) => (recipe.equipment || []).includes(equip))
            : true;

        // Handle cooking time (single condition, no union needed)
        const matchesCookTime = filters.cookTime
            ? recipe.cook_time <= filters.cookTime
            : true;
        
        // Handle intersection logic (AND) for ingredients
        const matchesIngredients = filters.ingredients.length
            ? filters.ingredients.every((ingredient) =>
                    (recipe.ingredients || []).some(
                        (ing) => ing.toLowerCase() === ingredient.toLowerCase()
                    )
                )
            : true;

        return matchesSearch && matchesCategory && matchesTags && matchesEquipment && matchesCookTime && matchesIngredients;
    });
    
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

    const handleAddMeal = async () => {
        try {
          const { error } = await supabase.from("meal_plan").insert([
            {
              user_id: userData.id,
              recipe_id: newMeal.recipe_id,
              planned_date: newMeal.planned_date,
              meal_type_id: newMeal.meal_type_id,
              notes: newMeal.notes,
              time: newMeal.time,
              serving_packs: newMeal.servingPacks,
            },
          ]);
    
          if (error) {
            console.error("Error adding meal:", error.message);
            return;
          }
    
          alert("Meal successfully added!");
          setShowAddModal(null); // Close modal after success
        } catch (err) {
          console.error("Unexpected error adding meal:", err.message);
        }
      };
    
      const handleOpenAddModal = (recipeId) => {
        const defaultTime =
          mealTypes.find((type) => type.id === meal_type_id)?.default_time ||
          "12:00";
    
        setNewMeal({
          notes: "",
          time: defaultTime,
          meal_type_id: meal_type_id,
          planned_date: planned_date,
          recipe_id: recipeId,
        });
    
        setShowAddModal(true);
      };

      if (loading) {
        return <CommonLoader />;
      }
    


      return (
        <div className="explore-recipes-container">
            {/* <div className="header-container">
                <BackButton />
                <h1 className="page-title">Explore Recipes</h1>
            </div> */}
            <BackButton />
            <h1 className="page-title">Explore Recipes</h1>
    
            {/* Display Planned Date and Meal Type */}
            {planned_date && activity_type && meal_type_id && (
                <div className="meal-info">
                    <p><strong>Adding meal for:</strong></p>
                    <p><strong>Date:</strong> {planned_date}</p>
                    <p><strong>Meal Type:</strong> {mealTypeName}</p>
                    <p><strong>Activity Type:</strong> {activity_type}</p>
                </div>
            )}
    
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
                    {/* <svg viewBox="0 0 512 512" height="1em" className="filter-icon">
                        <path
                        d="M0 416c0 17.7 14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384c-17.7 0-32 14.3-32 32zm128 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM320 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32-80c-32.8 0-61 19.7-73.3 48L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-54.7 0c-12.3-28.3-40.5-48-73.3-48zM192 128a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm73.3-64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48L32 64C14.3 64 0 78.3 0 96s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 128c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64z"
                        ></path>
                    </svg> */}
                     <svg viewBox="0 0 512 512" height="1em">
                        <path
                        d="M0 416c0 17.7 14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384c-17.7 0-32 14.3-32 32zm128 0a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zM320 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32-80c-32.8 0-61 19.7-73.3 48L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-54.7 0c-12.3-28.3-40.5-48-73.3-48zM192 128a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm73.3-64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48L32 64C14.3 64 0 78.3 0 96s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 128c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64z"
                        ></path>
                    </svg>
                </button>
            
            </div>
    
            <div className="recipes-list">
                {filteredRecipes.length > 0 ? (
                    filteredRecipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            onClick={() =>
                                navigate(`/recipes/recipe/${recipe.id}`, {
                                    state: {
                                        planned_date,
                                        meal_type_id,
                                        recipe_id: recipe.id,
                                        recipe_name: recipe.name,
                                        activity_type: activity_type,
                                    },
                                })
                            }
                            className="recipe-card"
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
                                {planned_date && meal_type_id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenAddModal(recipe.id);
                                        }}
                                        className="add-to-meal-button"
                                    >
                                        Add to Meal
                                    </button>
                                )}
                                {(recipe.tags || []).length > 0 && (
                                    <div className="tags-container">
                                        <strong>Tags:</strong>
                                        {recipe.tags.map((tag, index) => (
                                            <span key={index} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                )}
                                {(recipe.equipment || []).length > 0 && (
                                    <div className="equipment-container">
                                        <strong>Equipment:</strong>
                                        {recipe.equipment.map((item, index) => (
                                            <span key={index} className="equipment">{item}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-recipes">No recipes found.</p>
                )}
            </div>
    
            {/* Filter Overlay */}
            {isOverlayOpen && (
                <div className="filter-overlay">
                    <button
                        onClick={() => setOverlayOpen(false)}
                        className="close-button"
                    >
                        X
                    </button>
                    <h2 className="filter-title">Filter Options</h2>
                    <div className="filter-content">
                        {!isAnySelected() && (
                            <button
                                onClick={handleSelectAll}
                                className="select-all-button"
                            >
                                Select All
                            </button>
                        )}
                        {isAnySelected() && !isAllSelected() && (
                            <div className="filter-buttons">
                                <button
                                    onClick={handleClear}
                                    className="clear-button"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={handleSelectAll}
                                    className="select-all-button"
                                >
                                    Select All
                                </button>
                            </div>
                        )}
                        {isAllSelected() && (
                            <button
                                onClick={handleClear}
                                className="deselect-all-button"
                            >
                                Deselect All
                            </button>
                        )}

                        {/* Scrollable Content */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                        }}
                    >   
                    <button
                        onClick={() => setIngredientOverlayOpen(true)}
                        style={{
                            padding: '10px',
                            background: '#00aaff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        + Search Recipe by Ingredient
                    </button>

                    <div style={{ padding: '20px' }}>
                        <h3>Selected Ingredients:</h3>
                        <div>
                            {filters.ingredients.length > 0 ? (
                                filters.ingredients.map((ingredientName, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginBottom: '10px',
                                        }}
                                    >
                                        <span>{ingredientName}</span>
                                        <button
                                            onClick={() => handleIngredientRemove(ingredientName)}
                                            style={{
                                                marginLeft: '10px',
                                                background: 'red',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                padding: '5px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            X
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p>No ingredients selected.</p>
                            )}
                        </div>
                    </div>
                            
                    <div style={{ marginBottom: '20px' }}>
                            <h3>Category</h3>
                            {categories.map((category) => (
                                <label key={category.id} style={{ display: 'block', marginBottom: '5px' }}>
                                    <input
                                        type="checkbox"
                                        // checked={filters.categories?.includes(category.name)} // Safeguard includes
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
                    </div>
                        
    
                        <div className="filter-options">
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
                                                        : filters.equipment.filter((eq) => eq !== equip.name),
                                                });
                                            }}
                                        />
                                        {equip.name}
                                    </label>
                                ))}
                            </div>
                            <div className="filter-group">
                                <h3>Cooking Time</h3>
                                <select
                                    value={filters.cookTime || ''}
                                    onChange={(e) =>
                                        applyFilters({
                                            ...filters,
                                            cookTime: e.target.value ? Number(e.target.value) : null,
                                        })
                                    }
                                    className="cook-time-select"
                                >
                                    <option value="">Any</option>
                                    <option value="15">Less than 15 mins</option>
                                    <option value="30">Less than 30 mins</option>
                                    <option value="60">Less than 60 mins</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handleApplyFilters}
                            className="apply-filters-button"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
            {isIngredientOverlayOpen && (
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={() => setIngredientOverlayOpen(false)}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'red',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                    }}
                >
                    X
                </button>
                <h2 style={{ padding: '20px' }}>Search Ingredients</h2>
                
                {/* Search Bar */}
                <div style={{ padding: '0 20px', marginBottom: '10px' }}>
                    <input
                        type="text"
                        placeholder="Type an ingredient..."
                        value={ingredientSearch}
                        onChange={(e) => {
                            setIngredientSearch(e.target.value);
                            fetchMatchingIngredients(e.target.value);
                        }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '5px',
                            border: '1px solid #ddd',
                        }}
                    />
                </div>
                    
                {/* Matching Ingredients List */}
                <div style={{ flex: 1, padding: '0 20px', overflowY: 'auto' }}>
                    {matchingIngredients.length > 0 ? (
                        matchingIngredients.map((ingredient, index) => (
                            <div
                                key={index}
                                onClick={() => {
                                    // if (!selectedIngredients.some((item) => item.name === ingredient.name)) {
                                    //     setSelectedIngredients((prev) => [...prev, ingredient]);
                                    //     setIngredientSearch(''); // Clear the text box
                                    //     setMatchingIngredients([]); // Clear the suggestions
                                    // }
                                    handleIngredientAdd(ingredient); // Add the ingredient to the global filter
                                    console.log('Ingredient added:', ingredient.name);
                                    setIngredientSearch(''); // Clear the text box
                                    setMatchingIngredients([]); // Clear the suggestions
                                }}

                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '10px',
                                    marginBottom: '5px',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    background: '#444',
                                    cursor: 'pointer',
                                }}
                            >
                                {/* Display the Icon */}
                                <img
                                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${ingredient.icon_path}`}
                                    alt={ingredient.name}
                                    style={{
                                        width: '30px',
                                        height: '30px',
                                        marginRight: '10px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        background: '#fff',
                                    }}
                                />
                                <span>{ingredient.name}</span>
                            </div>
                        ))
                    ) : (
                        <p>No matching ingredients found.</p>
                    )}
                </div>

                
                {/* Selected Ingredients */}
                <div style={{ padding: '20px', background: '#333', borderTop: '1px solid #555' }}>
                    <h3>Selected Ingredients:</h3>
                    {filters.ingredients.length > 0 ? (
                        filters.ingredients.map((ingredient, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '5px 10px',
                                    border: '1px solid #666',
                                    borderRadius: '5px',
                                    marginBottom: '5px',
                                    background: '#555',
                                }}
                            >
                                {/* <span>{ingredient}</span> */}
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {ingredient.icon_path && (
                                        <img
                                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${ingredient.icon_path}`}
                                            alt={ingredient.name}
                                            style={{
                                                width: '30px',
                                                height: '30px',
                                                marginRight: '10px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                background: '#fff',
                                            }}
                                        />
                                    )}
                                    <span>{ingredient}</span>
                                    <span>{ingredient.icon_path}</span>


                                </div>
                                <button
                                    onClick={() => handleIngredientRemove(ingredient)} 
                                    style={{
                                        background: 'red',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    X
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>No ingredients selected.</p>
                    )}
                </div>

                

                {/* Search Button */}
                <button
                    onClick={() => {
                        setIngredientOverlayOpen(false);
                    }}
                    style={{
                        padding: '10px 20px',
                        background: '#00aaff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        margin: '20px',
                        cursor: 'pointer',
                    }}
                >
                    Find Recipes
                </button>
            </div>
        )}

{showAddModal && (
            <div className="modal">
            <div className="modal-content">
                <h2>Add a Meal</h2>
                <p>
                <strong>Meal Type:</strong>{" "}
                {mealTypes.find((type) => type.id === newMeal.meal_type_id)?.name ||
                    "Unknown"}
                </p>
                <p>
                <strong>Planned Date:</strong> {newMeal.planned_date}
                </p>
                <label>
                Notes:
                <textarea
                    value={newMeal.notes}
                    placeholder="Enter additional notes (e.g., extra ingredients, instructions)"
                    onChange={(e) =>
                    setNewMeal((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows="3"
                />
                </label>
                <label>
                Time:
                <input
                    type="time"
                    value={newMeal.time}
                    onChange={(e) =>
                    setNewMeal((prev) => ({ ...prev, time: e.target.value }))
                    }
                />
                </label>
                <button onClick={handleAddMeal} style={{ marginRight: "10px" }}>
                Save
                </button>
                <button onClick={() => setShowAddModal(null)}>Cancel</button>
            </div>
            </div>
        )}
        </div>
    );
    
};

export default RecipeExplore;
