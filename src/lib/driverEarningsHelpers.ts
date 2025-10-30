export interface ExpenseBreakdown {
  fuel: number;
  tolls: number;
  total: number;
}

export function calculateEstimatedExpenses(
  deliveryCount: number,
  totalDistance?: number
): ExpenseBreakdown {
  // Demo assumptions:
  // - 30 miles average route (or use actual distance)
  // - $3.50/gallon gas
  // - 20 MPG vehicle efficiency
  // - $5 tolls per day for NYC bridges (only if significant route)
  
  const miles = totalDistance || (deliveryCount * 3); // ~3mi per stop avg
  const fuelCost = (miles / 20) * 3.50;
  const tollsCost = deliveryCount > 5 ? 5.00 : 0; // Only charge tolls for larger routes
  
  return {
    fuel: Number(fuelCost.toFixed(2)),
    tolls: Number(tollsCost.toFixed(2)),
    total: Number((fuelCost + tollsCost).toFixed(2))
  };
}
