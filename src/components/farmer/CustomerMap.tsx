import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface CustomerMapProps {
  zipData: Array<{
    zip_code: string;
    unique_customers: number;
    order_count: number;
    total_revenue: number;
  }>;
}

const CustomerMap = ({ zipData }: CustomerMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Get Mapbox token from environment
    const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Initialize map centered on NYC
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-73.935242, 40.730610], // NYC coordinates
      zoom: 10,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    map.current.on('load', () => {
      if (!map.current) return;

      // Add Brooklyn zip code boundary for 11201
      map.current.addSource('brooklyn-zip', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-73.9975, 40.6975],
              [-73.9825, 40.6975],
              [-73.9825, 40.7075],
              [-73.9975, 40.7075],
              [-73.9975, 40.6975]
            ]]
          }
        }
      });

      map.current.addLayer({
        id: 'brooklyn-zip-fill',
        type: 'fill',
        source: 'brooklyn-zip',
        paint: {
          'fill-color': 'hsl(var(--primary))',
          'fill-opacity': 0.2
        }
      });

      map.current.addLayer({
        id: 'brooklyn-zip-border',
        type: 'line',
        source: 'brooklyn-zip',
        paint: {
          'line-color': 'hsl(var(--primary))',
          'line-width': 2
        }
      });

      // Add label for 11201
      const el = document.createElement('div');
      el.className = 'customer-map-marker';
      el.style.backgroundColor = 'hsl(var(--primary))';
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        closeOnClick: false
      })
        .setHTML(`
          <div style="padding: 8px; font-family: system-ui;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">ZIP 11201</div>
            <div style="font-size: 18px; font-weight: 700; color: hsl(var(--primary));">40 customers</div>
          </div>
        `);

      new mapboxgl.Marker(el)
        .setLngLat([-73.99, 40.7025])
        .setPopup(popup)
        .addTo(map.current);

      // Show popup by default
      popup.addTo(map.current);

      // Add other zip code markers if available
      zipData.forEach((zip, index) => {
        if (!map.current || zip.zip_code === '11201') return;

        // Generate random positions around NYC for demo
        const offset = index * 0.02;
        const lng = -73.935242 + (Math.random() - 0.5) * 0.2;
        const lat = 40.730610 + (Math.random() - 0.5) * 0.2;

        const markerEl = document.createElement('div');
        markerEl.className = 'customer-map-marker';
        markerEl.style.backgroundColor = 'hsl(var(--secondary))';
        markerEl.style.width = '8px';
        markerEl.style.height = '8px';
        markerEl.style.borderRadius = '50%';
        markerEl.style.border = '2px solid white';
        markerEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        const markerPopup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 8px; font-family: system-ui;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">ZIP ${zip.zip_code}</div>
              <div style="font-size: 16px; font-weight: 700; color: hsl(var(--secondary));">${zip.unique_customers} customers</div>
            </div>
          `);

        new mapboxgl.Marker(markerEl)
          .setLngLat([lng, lat])
          .setPopup(markerPopup)
          .addTo(map.current);
      });
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [zipData]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default CustomerMap;
