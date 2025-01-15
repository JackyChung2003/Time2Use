import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
//import './CreateUnit.css';

const CreateUnit = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        unitTag: '',
        unitDescription: '',
        conversionRateToGrams: '',
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
            // 1. Insert new unit into the 'unit' table
            const { error: unitError } = await supabase
                .from('unit')
                .insert([
                    {
                        unit_tag: formData.unitTag,
                        unit_description: formData.unitDescription,
                        conversion_rate_to_grams: parseFloat(formData.conversionRateToGrams),
                    },
                ]);

            if (unitError) throw unitError;

            // Navigate back to the units list after successful creation
            navigate('/admin/units');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-unit-container">
            <div className="create-unit-header">
                <h2>Create New Unit</h2>
                <button className="back-btn" onClick={() => navigate('/admin/units')}>
                    Back to Units
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="create-unit-form">
                <div className="form-group">
                    <label htmlFor="unitTag">Unit Tag:</label>
                    <input
                        type="text"
                        id="unitTag"
                        name="unitTag"
                        value={formData.unitTag}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="unitDescription">Unit Description:</label>
                    <input
                        type="text"
                        id="unitDescription"
                        name="unitDescription"
                        value={formData.unitDescription}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="conversionRateToGrams">Conversion Rate to Grams:</label>
                    <input
                        type="number"
                        id="conversionRateToGrams"
                        name="conversionRateToGrams"
                        value={formData.conversionRateToGrams}
                        onChange={handleChange}
                        required
                        min="0"
                    />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Unit'}
                </button>
            </form>
        </div>
    );
};

export default CreateUnit;
