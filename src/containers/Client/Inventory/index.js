import supabase from '../../../config/supabaseClient';

export const fetchItems = async () => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        id:ingredient_id,
        daysLeft:days_left,
        quantity,
        quantity_unit,
        ingredients(
          name,
          icon_path,
          ingredients_category(category_tag)
        )
      `);

    if (error) {
      throw error;
    }

    console.log('Fetched raw data from Supabase:', data);

    const SUPABASE_STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/`;
    const items = data.map((item) => {
      const categoryTag = item.ingredients?.ingredients_category?.category_tag;

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
      .update({ quantity: newQuantity })
      .match({ ingredient_id: itemId });

    if (error) {
      throw error;
    }

    console.log('Quantity updated:', data);
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

    // Update in database
    await updateQuantityInDatabase(item.id, newQuantity);

    return newQuantity; // Return for UI updates
  } catch (err) {
    console.error('Error handling portion click:', err);
    throw err;
  }
};

const inventoryUtils = {
  fetchItems,
  updateQuantityInDatabase,
  handlePortionClick,
};

export default inventoryUtils;
