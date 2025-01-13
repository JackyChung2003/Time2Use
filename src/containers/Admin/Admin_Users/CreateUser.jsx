import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';
import './CreateUser.css';

const CreateUser = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        role: '2', // Default to client role (role_id: 2)
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const generateRandomPassword = () => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const password = generateRandomPassword();

            // 1. Create user in auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: formData.email,
                password: password,
                email_confirm: true
            });

            if (authError) throw authError;

            // 2. Create profile entry
            const { error: profileError } = await supabase
                .from('profile')
                .insert({
                    username: formData.username,
                    user: authData.user.id
                });

            if (profileError) throw profileError;

            // 3. Set user role
            const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                    user_id: authData.user.id,
                    role_id: parseInt(formData.role)
                });

            if (roleError) throw roleError;
            
            navigate('/admin/users');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-user-container">
            <div className="create-user-header">
                <h2>Create New User</h2>
                <button className="back-btn" onClick={() => navigate('/admin/users')}>
                    Back to Users
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="create-user-form">
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="role">Role:</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    >
                        <option value="2">Client</option>
                        <option value="1">Admin</option>
                    </select>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Creating...' : 'Create User'}
                </button>
            </form>
        </div>
    );
};

export default CreateUser;
