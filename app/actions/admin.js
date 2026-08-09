export async function getStoreInventoryAdmin() {
  try {
    const supabase = getAdminClient();
    
    // THE FIX: Added 'low_stock_trigger' and 'is_active' to the product_variants select query!
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        description, 
        is_active, 
        product_variants ( 
          id, 
          sku, 
          size, 
          retail_price, 
          wholesale_price, 
          stock_quantity, 
          is_in_stock, 
          size_moq_floor, 
          moq_floor, 
          client_discount, 
          referrer_earnings, 
          image_url,
          low_stock_trigger,
          is_active
        )
      `)
      .order('name', { ascending: true });
      
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) { 
    return { success: false, error: err.message }; 
  }
}
