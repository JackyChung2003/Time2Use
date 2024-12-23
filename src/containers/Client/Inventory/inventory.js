import supabase from "../../../config/supabaseClient";

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

    console.log('Fetched Data:', data);

    const SUPABASE_STORAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/`;
    const items = data.map(item => {
      const categoryTag = item.ingredients?.ingredients_category?.category_tag;

      // Construct the full image URL
      const imageUrl = item.ingredients?.icon_path ? `${SUPABASE_STORAGE_URL}${item.ingredients.icon_path}` : '';

      return {
        id: item.id,
        name: item.ingredients?.name || 'Unknown',
        daysLeft: `${item.daysLeft}d`,
        imageUrl: imageUrl, // Full image URL
        category: categoryTag,
        quantity: `${item.quantity}`,
        quantity_unit: item.quantity_unit, // Adding quantity_unit to make use of it in portion selection
      };
    });

    return items;
  } catch (err) {
    console.error('Error fetching items:', err);
    return [];
  }
};

// Function to update the quantity in the database
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

// Function to reduce the quantity based on the portion selected
export const handlePortionClick = async (item, portion) => {
  try {
    // Calculate the new quantity based on the selected portion
    const newQuantity = item.quantity - portion;

    // Update the UI state with the new quantity (in case you're updating items in a state)
    const updatedItems = items.map((i) =>
      i.id === item.id ? { ...i, quantity: newQuantity } : i
    );
    setItems(updatedItems); // Assuming `setItems` is available in your component

    // Call the function to update the quantity in the database
    await updateQuantityInDatabase(item.id, newQuantity);
  } catch (err) {
    console.error('Error handling portion click:', err);
  }
};

