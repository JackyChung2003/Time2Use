import supabase from '../../../config/supabaseClient';

export const fetchItems = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        id:ingredient_id,
        daysLeft:days_left,
        quantity,
        
        freshness_status_id,
        created_at,
        condition_id,
        expiry_date_id,
        expiry_date:expiry_date (date),
        ingredients (
          name,
          icon_path,
          nutritional_info,
          storage_tips,
          pred_shelf_life,
          quantity_unitInv_id,
          ingredients_category (
            category_tag
          ),
          unitInv:unitInv (unitInv_tag)
        ),
        freshness_status (
          status_color
        ),
        condition:condition (condition)
      `)
      .eq('user_id', userId)

    if (error) {
      throw error;
    }

    console.log('Fetched raw data from Supabase:', data);

    const SUPABASE_STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/`;
    const items = [];

    for (const item of data) {
      const categoryTag = item.ingredients?.ingredients_category?.category_tag;
      const statusColor = item.freshness_status?.status_color || 'green';
      const imageUrl = item.ingredients?.icon_path
        ? `${SUPABASE_STORAGE_URL}${item.ingredients.icon_path}`
        : '';

      // Calculate the daysLeft if necessary
      let calculatedDaysLeft = item.daysLeft;
      if (item.daysLeft === null && item.ingredients?.pred_shelf_life) {
        calculatedDaysLeft = calculatePredictedDaysLeft(item.ingredients.pred_shelf_life);
      }
      // If calculatedDaysLeft is not null, update the database
      if (calculatedDaysLeft !== null && item.daysLeft === null) {
        try {
          console.log(`Item ID: ${item.id}, Original Days Left: ${item.daysLeft}, Calculated Days Left: ${calculatedDaysLeft}`);
    
          const { error: updateError } = await supabase
            .from('inventory')
            .update({ days_left: calculatedDaysLeft })
            .eq('ingredient_id', item.id)
            .eq('user_id', userId);  

          if (updateError) {
            console.error(`Error updating item with id ${item.id}:`, updateError);
          } else {
            console.log(`Successfully updated item with id ${item.id}`);
          }
        } catch (exception) {
          console.error(`Exception while updating item with id ${item.id}:`, exception);
        }
      }

      items.push({
        id: item.id,
        name: item.ingredients?.name || 'Unknown',
        daysLeft: calculatedDaysLeft,
        imageUrl: imageUrl,
        category: categoryTag,
        pred_shelf_life: item.ingredients?.pred_shelf_life || 'No prediction available',
        quantity: item.quantity,
        quantity_unit: item.ingredients?.unitInv?.unitInv_tag,
        statusColor: statusColor, 
        nutritionalInfo: item.ingredients?.nutritional_info || 'No information available',
        storageTips: item.ingredients?.storage_tips || 'No tips available',
        condition_id: item.condition_id,
        created_at: item.created_at,
        expiryDate : item.expiry_date?.date,
      });
    }

    return items;
  } catch (err) {
    console.error('Error fetching items:', err);
    return [];
  }
};



const calculatePredictedDaysLeft = (predShelfLife) => {
  // Match ranges like "2-3 months" or "7-10 days"
  const rangePattern = /(\d+)-(\d+)\s*(months?|days?|years?)/i;
  const match = predShelfLife.match(rangePattern);

  if (match) {
    const minValue = parseInt(match[1]);
    const maxValue = parseInt(match[2]);
    const unit = match[3].toLowerCase();  // 'month', 'day', or 'year'

    // Convert to days for consistency
    let averageDays;
    if (unit.includes('month')) {
      averageDays = ((minValue + maxValue) / 2) * 30; // Assuming an average month length of 30 days
    } else if (unit.includes('year')) {
      averageDays = ((minValue + maxValue) / 2) * 365; // Average year length
    } else {
      averageDays = (minValue + maxValue) / 2; // Average for days
    }

    return Math.round(averageDays);
  }

  // Handle the case where the pred_shelf_life is more complex, such as "7-10 days (refrigerated)"
  // Example: "2-3 years (ground), 4 years (whole)" can be handled by selecting one range (e.g., ground)
  const multipleRangesPattern = /(\d+)-(\d+)\s*(months?|days?|years?)/g;
  let totalDays = 0;
  let count = 0;

  let rangeMatch;
  while ((rangeMatch = multipleRangesPattern.exec(predShelfLife)) !== null) {
    const minValue = parseInt(rangeMatch[1]);
    const maxValue = parseInt(rangeMatch[2]);
    const unit = rangeMatch[3].toLowerCase();  // 'month', 'day', or 'year'

    let averageDays;
    if (unit.includes('month')) {
      averageDays = ((minValue + maxValue) / 2) * 30;
    } else if (unit.includes('year')) {
      averageDays = ((minValue + maxValue) / 2) * 365;
    } else {
      averageDays = (minValue + maxValue) / 2;
    }

    totalDays += averageDays;
    count++;
  }

  // Return the average of all the parsed ranges
  return count > 0 ? Math.round(totalDays / count) : null;
};


// Update quantity in the database
export const updateQuantityInDatabase = async (itemId, newQuantity, userId) => {
  try {
    if (!userId) throw new Error("User ID is required.");
    if (!itemId) throw new Error("Item ID is required.");
    if (newQuantity === undefined || newQuantity === null) {
      throw new Error("New quantity is required.");
    }

    const { data, error } = await supabase
      .from('inventory')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .match({ ingredient_id: itemId, user_id: userId }); // Ensure it matches both item ID and user ID

    if (error) {
      throw error;
    }

    console.log('Quantity and updated_at timestamp updated for user:', data);
  } catch (err) {
    console.error('Error updating quantity:', err.message || err);
    throw err; // Re-throw for higher-level handling
  }
};



// Handle portion click
export const handlePortionClick = async (item, portion, userId) => {
  try {
    if (!userId) throw new Error("User ID is required.");
    if (!item) throw new Error("Item is required.");
    if (!portion || portion <= 0) throw new Error("Portion must be greater than 0.");

    console.log("Item before update:", item);
    console.log("Portion to deduct:", portion);

    // Calculate the new quantity
    let newQuantity = item.quantity - portion;

    // Ensure the quantity doesn't go below 0
    newQuantity = Math.max(0, parseFloat(newQuantity.toFixed(2)));

    console.log("New quantity:", newQuantity);

    // Update the quantity in the database
    await updateQuantityInDatabase(item.id, newQuantity, userId);

    return newQuantity; // Return for UI updates
  } catch (err) {
    console.error("Error handling portion click:", err.message || err);
    throw err;
  }
};



export const handleQuantityChange = async (item, newQuantity, setItems, userId) => {
  try {
    if (!userId) throw new Error("User ID is required.");
    if (!item) throw new Error("Item is required.");
    if (newQuantity === undefined || newQuantity === null || newQuantity < 0) {
      throw new Error("New quantity must be a non-negative number.");
    }

    const parsedQuantity = parseFloat(newQuantity);

    if (isNaN(parsedQuantity)) {
      throw new Error("Invalid quantity entered.");
    }

    // Update the database with the new quantity
    await updateQuantityInDatabase(item.id, parsedQuantity, userId);

    // After database update, update the UI state
    setItems((prevItems) =>
      prevItems.map((i) =>
        i.id === item.id ? { ...i, quantity: parsedQuantity } : i
      )
    );
    console.log("Quantity updated successfully in UI.");
  } catch (err) {
    console.error('Error handling quantity change:', err.message || err);
  }
};


export const updateItemCondition = async (itemId, conditionId) => {
  console.log('Attempting to update item condition...');
  console.log('Item ID:', itemId);
  console.log('Condition ID:', conditionId);

  try {
    const response = await supabase
      .from('inventory') 
      .update({ condition_id: conditionId })
      .eq('ingredient_id', itemId) 
      .select('*', { count: 'exact' }); 

    // Return a standardized structure
    if (response.error) {
      throw new Error(response.error.message);
    }

    return { data: response.data, error: null, count: response.count }; 
  } catch (error) {
    console.error('Error updating condition:', error.message);
    return { data: null, error: error.message, count: 0 }; 
  }
};


const inventoryUtils = {
  fetchItems,
  updateQuantityInDatabase,
  handlePortionClick,
  handleQuantityChange,
  updateItemCondition,
};

export default inventoryUtils;
