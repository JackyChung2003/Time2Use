import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
// import './CreateIngredientsCat.css';

const CreateIngredientsCat = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    categoryTag: '',
    categoryName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Insert new ingredient category into the 'ingredients_category' table
      const { error: ingredientsCatError } = await supabase
        .from('ingredients_category')
        .insert([
          {
            category_tag: formData.categoryTag,
            category_name: formData.categoryName,
          },
        ]);

      if (ingredientsCatError) throw ingredientsCatError;

      // Navigate back to the ingredients category list after successful creation
      navigate('/admin/ingredientscat');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-ingredients-cat-container">
      <div className="create-ingredients-cat-header">
        <h2>Create New Ingredient Category</h2>
        <button className="back-btn" onClick={() => navigate('/admin/ingredients-category')}>
          Back to Categories
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="create-ingredients-cat-form">
        <div className="form-group">
          <label htmlFor="categoryTag">Category Tag:</label>
          <input
            type="text"
            id="categoryTag"
            name="categoryTag"
            value={formData.categoryTag}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="categoryName">Category Name:</label>
          <input
            type="text"
            id="categoryName"
            name="categoryName"
            value={formData.categoryName}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Creating...' : 'Create Category'}
        </button>
      </form>
    </div>
  );
};

export default CreateIngredientsCat;
