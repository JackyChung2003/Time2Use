import supabase from '../../../config/supabaseClient';

export const fetchItems = async (userId) => {
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
        condition_id,
        expiry_date_id,
        expiry_date:expiry_date (date),
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
        unit:unit (unit_tag),
        condition:condition (condition)
      `)
      .eq('user_id', userId); // filter by user id

    if (error) {
      throw error;
    }

    console.log('Fetched raw data from Supabase:', data);

    const SUPABASE_STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/`;
    const items = [];

    for (const item of data) {
      const categoryTag = item.ingredients?.ingredients_category?.category_tag;
      const statusColor = item.freshness_status?.status_color || 'green'; // Default to 'green' if no status_color

      // Construct the full image URL
      const imageUrl = item.ingredients?.icon_path
        ? `${SUPABASE_STORAGE_URL}${item.ingredients.icon_path}`
        : '';

      // Calculate the daysLeft if necessary
      let calculatedDaysLeft = item.daysLeft;
      if (item.daysLeft === null && item.ingredients?.pred_shelf_life) {
        calculatedDaysLeft = calculatePredictedDaysLeft(item.ingredients.pred_shelf_life);
      }

      // Only update the item in the database if daysLeft is null
      if (calculatedDaysLeft !== null && item.daysLeft === null) {
        try {
          console.log(`Item ID: ${item.id}, Original Days Left: ${item.daysLeft}, Calculated Days Left: ${calculatedDaysLeft}`);
          console.log(`Type of calculatedDaysLeft: ${typeof calculatedDaysLeft}`);
          
          // Step 1: Check if the item exists
          const { data: existingItem, error: checkError } = await supabase
            .from('inventory')
            .select('id')
            .eq('id', item.id)
            .single(); // Ensure we get a single item
      
          if (checkError) {
            console.error(`Error checking if item with id ${item.id} exists:`, checkError);
          } else if (!existingItem) {
            console.warn(`Item with id ${item.id} does not exist.`);
          } else {
            // Step 2: Update the item if it exists
            const { error: updateError } = await supabase
              .from('inventory')
              .update({ days_left: calculatedDaysLeft })
              .eq('id', item.id);
      
            if (updateError) {
              console.error(`Error updating item with id ${item.id}:`, updateError);
            } else {
              console.log(`Successfully updated item with id ${item.id}`);
      
              // Step 3: Fetch the updated item to verify the update
              const { data: updatedItem, error: fetchError } = await supabase
                .from('inventory')
                .select('days_left')
                .eq('id', item.id)
                .single();
      
              if (fetchError) {
                console.error(`Error fetching updated item with id ${item.id}:`, fetchError);
              } else {
                console.log(`Updated item data:`, updatedItem);
              }
            }
          }
        } catch (exception) {
          console.error(`Exception while updating item with id ${item.id}:`, exception);
        }
      } else {
        console.log(`No update needed for item with id ${item.id}`);
      } 
      

      
      items.push({
        id: item.id,
        name: item.ingredients?.name || 'Unknown',
        daysLeft: calculatedDaysLeft,
        imageUrl: imageUrl,
        category: categoryTag,
        pred_shelf_life: item.ingredients?.pred_shelf_life || 'No prediction available',
        quantity: item.quantity,
        quantity_unit: item.unit?.unit_tag || 'unit',
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

export const updateItemCondition = async (itemId, conditionId) => {
  console.log('Attempting to update item condition...');
  console.log('Item ID:', itemId);
  console.log('Condition ID:', conditionId);

  try {
    const response = await supabase
      .from('inventory') // Ensure table name matches
      .update({ condition_id: conditionId })
      .eq('ingredient_id', itemId) // Use the correct column name
      .select('*', { count: 'exact' }); // Include count to verify matched rows

    // Return a standardized structure
    if (response.error) {
      throw new Error(response.error.message);
    }

    return { data: response.data, error: null, count: response.count }; // Return a standard response object
  } catch (error) {
    console.error('Error updating condition:', error.message);
    return { data: null, error: error.message, count: 0 }; // Return error details in a structured format
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
