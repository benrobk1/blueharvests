export type OrderStatus = "ordered" | "farm_pickup" | "en_route" | "delivered";

export const mapOrderStatus = (dbStatus: string): OrderStatus => {
  switch (dbStatus) {
    case 'confirmed':
      return 'ordered';
    case 'in_transit':
      return 'farm_pickup';
    case 'out_for_delivery':
      return 'en_route';
    case 'delivered':
      return 'delivered';
    default:
      return 'ordered';
  }
};

export const formatOrderItems = (items: any[]): string => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemNames = items.map(item => item.products.name).slice(0, 2).join(', ');
  return items.length > 2 
    ? `${itemNames}, +${items.length - 2} more (${itemCount} items total)`
    : `${itemNames} (${itemCount} items)`;
};

export const formatEstimatedTime = (minutes?: number): string | undefined => {
  if (!minutes) return undefined;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};
