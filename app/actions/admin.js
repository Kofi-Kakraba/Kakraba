export async function addVariantAdminAction(productId, size, sku) {
  noStore();
  try {
    const supabase = getAdminClient();
    const newVariant = {
      product_id: productId,
      size: size,
      sku: sku,
      retail_price: 0,
      wholesale_price: 0,
      stock_quantity: 0,
      size_moq_floor: 30,
      moq_floor: 50,
      wholesale_threshold: 50,
      client_discount: 0,
      referrer_earnings: 0,
      is_in_stock: false,
      is_active: false // Starts paused so you can configure prices before making it live
    };
    
    const { error } = await supabase.from('product_variants').insert([newVariant]);
    if (error) throw error;
    
    revalidatePath('/admin', 'layout');
    revalidatePath('/shop', 'layout');
    return { success: true };
  } catch(err) {
    return { success: false, error: err.message };
  }
}

export async function deleteVariantAdminAction(variantId) {
  noStore();
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
    if (error) throw error;
    
    revalidatePath('/admin', 'layout');
    revalidatePath('/shop', 'layout');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
