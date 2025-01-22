import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import "./index.css";

const RecipeDashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Add 'page' class to the body and set background color for the whole page
        document.body.classList.add('page');

        // Clean up when the component is unmounted
        return () => {
            document.body.classList.remove('page');
        };
    }, []);
          
    return (
        <div style={{ padding: '20px' }}>
            <h1>Recipe Dashboard</h1>
            <p>Welcome to your Recipe Dashboard! Use the options below to navigate to different sections of your recipe module.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Navigate to Recipe Explore */}
                <button 
                    onClick={() => navigate('/recipes/explore')} 
                    style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
                >
                    Explore Recipes
                </button>

                {/* Navigate to Recipe Favorites */}
                <button 
                    onClick={() => navigate('/recipes/favorites')} 
                    style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px' }}
                >
                    View Favorites
                </button>

                {/* Navigate to Recipe Calendar */}
                <button 
                    onClick={() => navigate('/recipes/calendar')} 
                    style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#FFC107', color: 'white', border: 'none', borderRadius: '5px' }}
                >
                    Plan Your Meals
                </button>
            </div>
        </div>
    );
};

export default RecipeDashboard;