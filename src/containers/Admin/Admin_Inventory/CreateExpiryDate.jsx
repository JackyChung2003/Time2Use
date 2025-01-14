import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import './index.css';

const CreateExpiryDate = () => {
  const [expiryDate, setExpiryDate] = useState('');
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!expiryDate) {
      alert('Please enter an expiry date.');
      return;
    }

    try {
      // Insert the new expiry date into the database
      const { error } = await supabase
        .from('expiry_date')
        .insert([{ date: expiryDate }]);

      if (error) throw error;

      alert('Expiry date created successfully!');
      navigate('/admin/inventories'); // Redirect to the inventories page
    } catch (error) {
      console.error('Error creating expiry date:', error.message);
      alert('Failed to create expiry date.');
    }
  };

  return (
    <div className="create-expiry-date">
      <h2>Create Expiry Date</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Expiry Date:</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="submit-btn">
          Create Expiry Date
        </button>
      </form>
    </div>
  );
};

export default CreateExpiryDate;
