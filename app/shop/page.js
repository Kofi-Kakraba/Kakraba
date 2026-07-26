// 🚨 NEW: Clear cart after successful Paystack checkout return
  useEffect(() => {
    const paymentReference = searchParams.get('reference');
    const paymentTrxRef = searchParams.get('trxref');
    
    if (paymentReference || paymentTrxRef) {
      // 1. Wipe the cart memory!
      setCart([]);
      sessionStorage.removeItem('sparkle_cart');
      
      // 2. Show a nice success message using our custom modal!
      setCheckoutAlert("Payment Successful! 🎉\n\nYour drop has been securely logged. You will receive an SMS with your dispatch details shortly.");
      
      // 3. Clean up the URL so the long reference code disappears
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams]);
