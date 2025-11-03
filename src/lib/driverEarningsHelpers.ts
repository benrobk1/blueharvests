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
  // - $50 tolls per day for NYC bridges
  
  const miles = totalDistance || (deliveryCount * 3); // ~3mi per stop avg
  const fuelCost = (miles / 20) * 3.50;
  const tollsCost = 50.00; // Flat rate for NYC area tolls
  
  return {
    fuel: Number(fuelCost.toFixed(2)),
    tolls: Number(tollsCost.toFixed(2)),
    total: Number((fuelCost + tollsCost).toFixed(2))
  };
}
