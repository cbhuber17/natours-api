/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiY2JodWJlciIsImEiOiJjbGc1bGhkdWIwNDJ2M3JxaTlndnd3c3lyIn0.byXfAcSD956iJTLKMcRSgQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/cbhuber/clg5t2ytf000001nwpw6kn2kp',
    scrollZoom: false,
    // center: [-114, 51],
    // zoom: 10,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom', // Bottom of the pin is the location
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30, // Vertical offset of the pin in pixels
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });

  const nav = new mapboxgl.NavigationControl();
  map.addControl(nav, 'top-right');
};
