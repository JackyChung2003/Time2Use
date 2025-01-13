import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import './index.css';
import CommonLoader from '../../../components/Loader/CommonLoader';

const AdminIngredients = () => {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // State for the current page
  const rowsPerPage = 15; // Rows per page
  const navigate = useNavigate();

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('id, name, nutritional_info, pred_shelf_life, ingredients_category_id');
  
      if (ingredientsError) throw ingredientsError;

      const { data: ingredientcategories, error: ingredientcategoriesError } = await supabase
        .from('ingredients_category')
        .select('id, category_name, category_tag');
  
      if (ingredientcategoriesError) throw ingredientcategoriesError;
  
      // Merge the data
      const ingredientDetails = ingredients.map(ingredient => {
        const catIngredient = ingredientcategories.find(ingredientcategory => ingredientcategory.id === ingredient.ingredients_category_id); // Match by ID
        return {
          id: ingredient.id,
          name: ingredient.name,
          nutritional_info: Object.entries(ingredient.nutritional_info)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n'),
          pred_shelf_life: ingredient.pred_shelf_life,
          category: catIngredient.category_name
        };
      });

      setIngredients(ingredientDetails);
    } catch (error) {
      console.error('Error fetching ingredient details:', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate the paginated data
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = ingredients.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(ingredients.length / rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) return  <CommonLoader />;

  return (
    <div className="admin-ingredients">
      <div className="admin-ingredients-header">
        <h2>Manage Ingredient</h2>
        <button 
          className="create-ingredient-btn"
          onClick={() => navigate('/admin/ingredients/create')}
        >
          Create Ingredient
        </button>
      </div>
      
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Nutritional Info</th>
              <th>Pred Shelf Life</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((ingredient) => (
              <tr key={ingredient.id}>
                <td>{ingredient.name}</td>
                <td>
                  <pre>{ingredient.nutritional_info}</pre>
                </td>
                <td>{ingredient.pred_shelf_life}</td>
                <td>{ingredient.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        {Array.from({ length: totalPages }, (_, index) => (
          <button 
            key={index + 1} 
            className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
            onClick={() => handlePageChange(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminIngredients;
