const filteredOrders = orders.filter(order => {
    const textMatch = orderSearchText.trim() === '' || 
      order.customer_name.toLowerCase().includes(orderSearchText.toLowerCase()) ||
      order.id.toLowerCase().includes(orderSearchText.toLowerCase());

    const dateMatch = orderDateText.trim() === '' ||
      new Date(order.created_at).toLocaleDateString('en-GH').includes(orderDateText);

    const locationMatch = orderLocationText.trim() === '' ||
      (order.landmark && order.landmark.toLowerCase().includes(orderLocationText.toLowerCase()));

    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'active' && order.status !== 'completed' && order.status !== 'cancelled') ||
      (filterStatus === 'paid' && order.payment_status === 'paid') ||
      (filterStatus === 'processing' && order.status === 'processing') ||
      (filterStatus === 'completed' && order.status === 'completed') ||
      (filterStatus === 'cancelled' && order.status === 'cancelled');

    // 🚨 NEW: The Delivery vs Pickup Match
    const deliveryMatch = deliveryFilter === 'all' || order.delivery_type === deliveryFilter;

    return textMatch && dateMatch && locationMatch && statusMatch && deliveryMatch;
  });
