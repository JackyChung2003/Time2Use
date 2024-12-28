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
        quantity_unit_id,
        freshness_status_id,
        created_at,
        ingredients (
          name,
          icon_path,
          nutritional_info,
          storage_tips,
          pred_shelf_life,
          ingredients_category (
            category_tag
          )
        ),
        freshness_status (
          status_color
        ),
        unit:unit (unit_tag)
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

      const quantityUnit = item.unit?.unit_tag || 'unit';

      return {
        id: item.id,
        name: item.ingredients?.name || 'Unknown',
        daysLeft: item.daysLeft,
        imageUrl: imageUrl,
        category: categoryTag,
        pred_shelf_life: item.ingredients?.pred_shelf_life || 'No prediction available',
        quantity: item.quantity,
        quantity_unit: quantityUnit,
        statusColor: statusColor, 
        nutritionalInfo: item.ingredients?.nutritional_info || 'No information available',
        storageTips: item.ingredients?.storage_tips || 'No tips available',
        created_at: item.created_at,
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
        updated_at: new Date().toISOString(), 
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
export const handlePortionClick = async (item, portion) => {
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

    return newQuantity; // Return for UI updates
  } catch (err) {
    console.error('Error handling portion click:', err);
    throw err;
  }
};

export const handleQuantityChange = async (item, newQuantity, setItems) => {
  const parsedQuantity = parseFloat(newQuantity);
  if (!isNaN(parsedQuantity) && parsedQuantity >= 0) {
    try {
      // Update the database with the new quantity
      await updateQuantityInDatabase(item.id, parsedQuantity);

      // After database update, update the UI state
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: parsedQuantity } : i
        )
      );
    } catch (err) {
      console.error('Error handling quantity change:', err);
    }
  }
};

const inventoryUtils = {
  fetchItems,
  updateQuantityInDatabase,
  handlePortionClick,
  handleQuantityChange,
};

export default inventoryUtils;
