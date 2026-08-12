export async function createNewProductWithVariantsAdmin(name, description) {
  noStore();
  try {
    const supabase = getAdminClient();
    const { data: newProduct, error: productError } = await supabase.from('products').insert([{ name: name.trim(), description: description.trim(), is_active: true }]).select('*').single();
    if (productError || !newProduct) return { success: false, error: productError.message };

    const skuSlug = name.substring(0, 3).toUpperCase().replace(/\s+/g, '');
    const standardSizes = [
      { size: '300ml', retail: 5.00, wholesale: 4.50, floor: 50 },
      { size: '500ml', retail: 8.00, wholesale: 7.00, floor: 30 },
      { size: '1.5L',  retail: 15.00, wholesale: 13.50, floor: 15 },
      { size: '5L',   retail: 45.00, wholesale: 40.00, floor: 5 }
    ];

    const variantRows = standardSizes.map(item => ({ 
      product_id: newProduct.id, 
      size: item.size, 
      sku: `SPK-${skuSlug}-${item.size}`, 
      retail_price: item.retail, 
      wholesale_price: item.wholesale, 
      stock_quantity: 0, 
      size_moq_floor: 30, 
      moq_floor: item.floor, 
      wholesale_threshold: item.floor, // 🚨 THE FIX: Satisfies the database constraint
      client_discount: 1.00, 
      referrer_earnings: 1.00, 
      is_in_stock: false 
    }));
    
    const { error: variantError } = await supabase.from('product_variants').insert(variantRows);
    if (variantError) return { success: false, error: `Product variant creation failed: ${variantError.message}` };
    
    revalidatePath('/admin', 'layout');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
}
