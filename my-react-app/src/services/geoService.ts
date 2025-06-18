import axios from 'axios';

export const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    
    if (response.data && response.data.display_name) {
      return response.data.display_name;
    }
    return 'Address not found';
  } catch (error) {
    console.error('Error fetching address:', error);
    return 'Address lookup failed';
  }
};
