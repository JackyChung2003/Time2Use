import supabase from '../../../config/supabaseClient';
import React, { useState } from 'react';

export const fetchItems = async () => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        id:ingredient_id,
        daysLeft:days_left,
        quantity,
        quantity_unit,
        freshness_status_id,
        ingredients (
          name,
          icon_path,
          ingredients_category (
            category_tag
          )
        ),
        freshness_status (
          status_color
        )
      `);

    if (error) {
      throw error;
    }

    console.log('Fetched raw data from Supabase:', data);

    const SUPABASE_STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/`;
    const items = data.map((item) => {
      const categoryTag = item.ingredients?.ingredients_category?.category_tag;
      const statusColor = item.freshness_status?.status_color || 'green'; // Default to 'green' if no status_color

      // Construct the full image URL
      const imageUrl = item.ingredients?.icon_path
        ? `${SUPABASE_STORAGE_URL}${item.ingredients.icon_path}`
        : '';

      return {
        id: item.id,
        name: item.ingredients?.name || 'Unknown',
        daysLeft: `${item.daysLeft}d`,
        imageUrl: imageUrl,
        category: categoryTag,
        quantity: item.quantity, // Keep as number
        quantity_unit: item.quantity_unit,
        statusColor: statusColor, // Add statusColor to the returned object
      };
    });

    return items;
  } catch (err) {
    console.error('Error fetching items:', err);
    return [];
  }
};


// Update quantity in the database
export const updateQuantityInDatabase = async (itemId, newQuantity) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .update({
        quantity: newQuantity,
        updated_at: supabase.raw('now()'), // Use PostgreSQL's now() function
      })
      .match({ ingredient_id: itemId });

    if (error) {
      throw error;
    }

    console.log('Quantity and updated_at timestamp updated:', data);
  } catch (err) {
    console.error('Error updating quantity:', err);
  }
};


// Handle portion click
export const handlePortionClick = async (item, portion, setItems) => {
  try {
    console.log('Item before update:', item);
    console.log('Portion to deduct:', portion);

    // Calculate the new quantity
    let newQuantity = item.quantity - portion;

    // Round to 2 decimal places
    newQuantity = parseFloat(newQuantity.toFixed(2));

    console.log('New quantity:', newQuantity);

    // Update the quantity in the database
    await updateQuantityInDatabase(item.id, newQuantity);

    // Update the state in the parent component to trigger re-render
    setItems((prevItems) =>
      prevItems.map((i) =>
        i.id === item.id ? { ...i, quantity: newQuantity } : i
      )
    );
    
    return newQuantity; // Return for UI updates
  } catch (err) {
    console.error('Error handling portion click:', err);
    throw err;
  }
};

export const ParentComponent = () => {
  const [items, setItems] = useState([]);

  // Handle portion click and update the UI state
  const handlePortionClickWithState = async (item, portion) => {
    try {
      const newQuantity = await handlePortionClick(item, portion, setItems);
      console.log('Portion click handled and state updated:', newQuantity);
    } catch (err) {
      console.error('Error handling portion click:', err);
    }
  };

  return (
    <ItemList items={items} handlePortionClick={handlePortionClickWithState} />
  );
};

const inventoryUtils = {
  fetchItems,
  updateQuantityInDatabase,
  handlePortionClick,
  ParentComponent,
};

export default inventoryUtils;
