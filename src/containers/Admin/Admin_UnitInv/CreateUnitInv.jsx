import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
//import './CreateUnitInv.css';

const CreateUnitInv = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        unitInvTag: '',
        conversionRateToGramsForCheck: '',
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
            // 1. Insert new unit into the 'unitinv' table
            const { error: unitinvError } = await supabase
                .from('unitInv')
                .insert([
                    {
                        unitInv_tag: formData.unitInvTag,
                        conversion_rate_to_grams_for_check: parseFloat(formData.conversionRateToGramsForCheck),
                    },
                ]);

            if (unitinvError) throw unitinvError;

            // Navigate back to the units inventory list after successful creation
            navigate('/admin/unitinv');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-unitinv-container">
            <div className="create-unitinv-header">
                <h2>Create New Unit Inventory</h2>
                <button className="back-btn" onClick={() => navigate('/admin/unitinv')}>
                    Back to Unit Inventory
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="create-unitinv-form">
                <div className="form-group">
                    <label htmlFor="unitInvTag">Unit Inventory Tag:</label>
                    <input
                        type="text"
                        id="unitInvTag"
                        name="unitInvTag"
                        value={formData.unitInvTag}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="conversionRateToGramsForCheck">Conversion Rate to Grams for Check:</label>
                    <input
                        type="number"
                        id="conversionRateToGramsForCheck"
                        name="conversionRateToGramsForCheck"
                        value={formData.conversionRateToGramsForCheck}
                        onChange={handleChange}
                        required
                        min="0"
                    />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Unit Inventory'}
                </button>
            </form>
        </div>
    );
};

export default CreateUnitInv;
