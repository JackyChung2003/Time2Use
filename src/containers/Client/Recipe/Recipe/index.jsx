import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../../config/supabaseClient';

import BackButton from '../../../../components/Button/BackButton';


import { useRecipeContext } from '../Contexts/RecipeContext';


const RecipeExplore = () => {
    // const { recipes, filters, applyFilters, loading } = useRecipeContext();
    const { recipes, filters, applyFilters, loading, fetchRecipes } = useRecipeContext(); // Get recipes and filters
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [search, setSearch] = useState('');
    const [isOverlayOpen, setOverlayOpen] = useState(false);

    const [isIngredientOverlayOpen, setIngredientOverlayOpen] = useState(false);
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [matchingIngredients, setMatchingIngredients] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);

    const navigate = useNavigate();
    
    const handleIngredientRemove = (ingredientName) => {
        setSelectedIngredients((prev) => prev.filter((item) => item.name !== ingredientName));
    };

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
        // console.log("Filters changed, re-fetching recipes:", filters);
        fetchRecipes(); // Fetch recipes or re-filter based on filters
      }, [filters]);

      // console.log("Recipes:", recipes);
      // console.log("Filters:", filters);

    const filteredRecipes = recipes.filter((recipe) => {
        // console.log("Checking Recipe:", recipe);
        // console.log("Current Filters:", filters);
        const matchesSearch = recipe.name?.toLowerCase().includes(search.toLowerCase());
    
        const matchesCategory = filters.categories?.length
            ? filters.categories.every((category) =>
                  (recipe.categories || []).includes(category)
              )
            : true;
    
        const matchesTags = filters.tags?.length
            ? filters.tags.every((tag) => (recipe.tags || []).includes(tag))
            : true;
    
        const matchesEquipment = filters.equipment?.length
            ? filters.equipment.every((equip) => (recipe.equipment || []).includes(equip))
            : true;

        const matchesCookTime = filters.cookTime
            ? recipe.cook_time <= filters.cookTime // Check if cook_time is within the filter
            : true;

        const matchesIngredients = selectedIngredients.length
        ? selectedIngredients.every((ing) =>
              (recipe.ingredients || []).some(
                  (ingredient) => ingredient.toLowerCase() === ing.name.toLowerCase()
              )
          )
        : true;

        // console.log("Selected Ingredients:", selectedIngredients);
    
        return matchesSearch && matchesCategory && matchesTags && matchesEquipment && matchesCookTime && matchesIngredients;
    });
    
    const handleApplyFilters = () => {
        setOverlayOpen(false); // Close overlay on apply
    };

    return (
        <div style={{ padding: '20px' }}>
            <BackButton />
            <h1>Explore Recipes</h1>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Search recipes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        padding: '10px',
                        flex: 1,
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                    }}
                />
                <button
                    onClick={() => setOverlayOpen(true)}
                    style={{
                        padding: '10px',
                        background: '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Filters
                </button>
            </div>
            <div>
                {filteredRecipes.length > 0 ? (
                    filteredRecipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            onClick={() => navigate(`/recipes/recipe/${recipe.id}`)}
                            style={{
                                padding: '10px',
                                border: '1px solid #ddd',
                                marginBottom: '10px',
                                borderRadius: '5px',
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: 'pointer',
                            }}
                        >
                            <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
                                alt={recipe.name}
                                style={{
                                    width: '100%',
                                    height: '150px',
                                    objectFit: 'cover',
                                    borderRadius: '5px',
                                    marginBottom: '10px',
                                }}
                            />
                            <div>
                                <h3>{recipe.name}</h3>
                                <p>{recipe.description}</p>
                                <p>Prep Time: {recipe.prep_time} mins</p>
                                <p>Cook Time: {recipe.cook_time} mins</p>
                                {/* Tags */}
                                {(recipe.tags || []).length > 0 && (
                                    <div style={{ marginTop: '10px' }}>
                                        <strong>Tags:</strong>{' '}
                                        {recipe.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                style={{
                                                    background: '#ffcc00',
                                                    color: '#000',
                                                    padding: '5px 10px',
                                                    marginRight: '5px',
                                                    borderRadius: '5px',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {/* Equipment */}
                                {(recipe.equipment || []).length > 0 && (
                                    <div style={{ marginTop: '10px' }}>
                                        <strong>Equipment:</strong>{' '}
                                        {recipe.equipment.map((item, index) => (
                                            <span
                                                key={index}
                                                style={{
                                                    background: '#000000',
                                                    padding: '5px 10px',
                                                    marginRight: '5px',
                                                    borderRadius: '3px',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No recipes found.</p>
                )}
            </div>

            {/* Filter Overlay */}
            {isOverlayOpen && (
                
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
                        onClick={() => setOverlayOpen(false)}
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

                    

                    <h2 style={{ padding: '20px' }}>Filter Options</h2>
                    
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
                            {selectedIngredients.map((ingredient, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '10px',
                                    }}
                                >
                                    <span>{ingredient.name}</span>
                                    <button
                                        onClick={() => handleIngredientRemove(ingredient.name)}
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
                            ))}
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
                        <div style={{ marginBottom: '20px' }}>
                            <h3>Tags</h3>
                            {tags.map((tag) => (
                                <label key={tag.id} style={{ display: 'block', marginBottom: '5px' }}>
                                    <input
                                        type="checkbox"
                                        checked={filters.tags.includes(tag.name)} // Maintain tag state
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            applyFilters({
                                                ...filters,
                                                tags: checked
                                                    ? [...filters.tags, tag.name]
                                                    : filters.tags.filter((t) => t !== tag.name),
                                            });
                                        }}
                                    />{' '}
                                    {tag.name}
                                </label>
                            ))}
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <h3>Equipment</h3>
                            {equipment.map((equip) => (
                                <label key={equip.id} style={{ display: 'block', marginBottom: '5px' }}>
                                    <input
                                        type="checkbox"
                                        checked={filters.equipment.includes(equip.name)} // Maintain equipment state
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            applyFilters({
                                                ...filters,
                                                equipment: checked
                                                    ? [...filters.equipment, equip.name]
                                                    : filters.equipment.filter((eq) => eq !== equip.name),
                                            });
                                        }}
                                    />{' '}
                                    {equip.name}
                                </label>
                            ))}
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <h3>Cooking Time</h3>
                            <select
                                value={filters.cookTime || ''} // Maintain selected cooking time
                                onChange={(e) =>
                                    applyFilters({
                                        ...filters,
                                        cookTime: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                                style={{ padding: '10px', borderRadius: '5px', width: '100%' }}
                            >
                                <option value="">Any</option>
                                <option value="15">Less than 15 mins</option>
                                <option value="30">Less than 30 mins</option>
                                <option value="60">Less than 60 mins</option>
                            </select>
                        </div>
                        <button
                            onClick={handleApplyFilters}
                            style={{
                                padding: '10px 20px',
                                background: '#00aaff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                width: '100%',
                            }}
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
                                    if (!selectedIngredients.some((item) => item.name === ingredient.name)) {
                                        setSelectedIngredients((prev) => [...prev, ingredient]);
                                        setIngredientSearch(''); // Clear the text box
                                        setMatchingIngredients([]); // Clear the suggestions
                                    }
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
                    {selectedIngredients.length > 0 ? (
                        selectedIngredients.map((ingredient, index) => (
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
                                <div style={{ display: 'flex', alignItems: 'center' }}>
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
                                <button
                                    onClick={() =>
                                        setSelectedIngredients((prev) =>
                                            prev.filter((item) => item.name !== ingredient.name)
                                        )
                                    }
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
                        // Add logic to filter recipes based on selectedIngredients
                        // console.log('Selected Ingredients:', selectedIngredients);
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

        </div>
    );
};

export default RecipeExplore;
