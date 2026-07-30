'use server';

import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});
// Make sure this matches your exact HQ location on Google Maps!
const STORE_LOCATION = "Sparkle Bevelyn Limited, Accra, Ghana"; 

export async function calculateDeliveryFee(customerLocation) {
  try {
    const response = await client.distancematrix({
      params: {
        origins: [STORE_LOCATION],
        destinations: [customerLocation],
        key: process.env.GOOGLE_MAPS_BACKEND_API_KEY,
      }
    });

    const data = response.data;
    
    if (data.rows[0].elements[0].status === 'OK') {
      // 1. Get exact distance in kilometers
      const distanceInMeters = data.rows[0].elements[0].distance.value;
      const distanceInKm = distanceInMeters / 1000;

      // ---------------------------------------------------------
      // 🚨 YOUR NEW COMPETITIVE PRICING ALGORITHM
      // ---------------------------------------------------------
      
      const BASE_FARE = 20.00;     // Base charge for close deliveries
      const INCLUDED_KM = 5.0;     // How many kilometers that base fare covers
      const RATE_PER_EXTRA_KM = 2.20; // Charge per km AFTER the first 5km
      
      let fee = BASE_FARE;
      
      // If they live further than 5km, calculate the extra distance
      if (distanceInKm > INCLUDED_KM) {
        const extraDistance = distanceInKm - INCLUDED_KM;
        fee += (extraDistance * RATE_PER_EXTRA_KM);
      }

      // Round the final fee to the nearest whole Cedi for a cleaner checkout
      const finalCleanFee = Math.ceil(fee);

      return { success: true, fee: finalCleanFee, distance: distanceInKm };
      
    } else {
      return { success: false, error: "Could not calculate distance." };
    }
  } catch (error) {
    console.error("Delivery calculation failed:", error);
    return { success: false, error: "API connection failed." };
  }
}