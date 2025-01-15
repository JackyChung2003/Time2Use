import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';

const CreateExpiryDate = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        date: '',
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
            // Insert new expiry date into the 'expiry_date' table
            const { error: expiryDateError } = await supabase
                .from('expiry_date')
                .insert([
                    {
                        date: formData.date,
                    },
                ]);

            if (expiryDateError) throw expiryDateError;

            // Navigate back to the expiry dates list after successful creation
            navigate('/admin/expirydate');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-expiry-date-container">
            <div className="create-expiry-date-header">
                <h2>Create New Expiry Date</h2>
                <button className="back-btn" onClick={() => navigate('/admin/expiry-dates')}>
                    Back to Expiry Dates
                </button>
            </div>

            {error && <div className="error-message" style={{ color: 'red' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="create-expiry-date-form">
                <div className="form-group">
                    <label htmlFor="date">Date:</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Expiry Date'}
                </button>
            </form>
        </div>
    );
};

export default CreateExpiryDate;
