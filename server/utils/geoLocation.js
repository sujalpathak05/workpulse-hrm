// Haversine formula - do coordinates ke beech distance calculate karta hai
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

const toRad = (value) => (value * Math.PI) / 180;

const isWithinRadius = (userLat, userLon, officeLat, officeLon, radius) => {
  const distance = calculateDistance(userLat, userLon, officeLat, officeLon);
  return { isValid: distance <= radius, distance: Math.round(distance) };
};

module.exports = { calculateDistance, isWithinRadius };
