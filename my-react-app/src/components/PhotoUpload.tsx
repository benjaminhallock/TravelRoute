import React, { useState } from 'react';
import * as exifr from 'exifr';
import MapComponent from './MapComponent';

interface PhotoData {
  photo: string;
  choice: 'A' | 'B' | 'C' | 'D';
  category: number;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
}

interface PhotoUploadProps {
  onSave: (data: PhotoData) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onSave }) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [choice, setChoice] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [category, setCategory] = useState<number>(1);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractingLocation, setExtractingLocation] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setPhotos(fileArray);
      
      // Create URLs for display
      const urls = fileArray.map(file => URL.createObjectURL(file));
      setPhotoUrls(urls);
      
      // Extract location from first photo
      if (fileArray.length > 0) {
        await extractLocationFromPhoto(fileArray[0]);
      }
    }
  };

  const handlePhotoChange = async (newIndex: number) => {
    setCurrentPhotoIndex(newIndex);
    if (photos[newIndex]) {
      await extractLocationFromPhoto(photos[newIndex]);
    }
  };

  const extractLocationFromPhoto = async (file: File) => {
    setExtractingLocation(true);
    try {
      const exifData = await exifr.parse(file);
      
      if (exifData && exifData.latitude && exifData.longitude) {
        const coords = {
          lat: exifData.latitude,
          lng: exifData.longitude
        };
        setLocation(coords);
        
        // Get address automatically
        const fetchedAddress = await getClosestAddress(coords.lat, coords.lng);
        setAddress(fetchedAddress);
      } else {
        setLocation(null);
        setAddress('');
        alert('No GPS data found in this photo. Make sure location services were enabled when the photo was taken.');
      }
    } catch (error) {
      console.error('Error extracting EXIF data:', error);
      setLocation(null);
      setAddress('');
      alert('Could not read photo metadata. Please try a different photo.');
    } finally {
      setExtractingLocation(false);
    }
  };

  const getClosestAddress = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      const fullAddress = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      // Extract simple address (street + city only)
      const parts = fullAddress.split(',');
      const simpleAddress = parts.slice(0, 2).join(',').trim();
      
      return simpleAddress;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const handleLocationChange = (newLocation: { lat: number; lng: number }) => {
    setLocation(newLocation);
  };

  const handleAddressClick = () => {
    setIsEditingAddress(true);
  };

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    setIsEditingAddress(false);
  };

  const handleSave = async () => {
    if (!photoUrls[currentPhotoIndex] || !location) return;

    setIsLoading(true);
    try {
      const photoData: PhotoData = {
        photo: photoUrls[currentPhotoIndex],
        choice,
        category,
        location,
        address: address || await getClosestAddress(location.lat, location.lng),
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(photoData);

      // Move to next photo or reset
      if (currentPhotoIndex < photos.length - 1) {
        const nextIndex = currentPhotoIndex + 1;
        await handlePhotoChange(nextIndex);
      } else {
        // Clean up URLs
        photoUrls.forEach(url => URL.revokeObjectURL(url));
        setPhotos([]);
        setPhotoUrls([]);
        setCurrentPhotoIndex(0);
        setLocation(null);
        setAddress('');
      }

      // Reset form
      setChoice('A');
      setCategory(1);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save tree data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="photo-upload">
      <div className="upload-section">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
        />
        {extractingLocation && <p>Extracting GPS data from photo...</p>}
      </div>

      {photoUrls.length > 0 && (
        <div className="photo-review">
          <div className="photo-navigation">
            <h3>
              Photo {currentPhotoIndex + 1} of {photoUrls.length}
            </h3>
            <div className="nav-buttons">
              <button
                onClick={() => handlePhotoChange(Math.max(0, currentPhotoIndex - 1))}
                disabled={currentPhotoIndex === 0 || extractingLocation}
              >
                Previous
              </button>
              <button
                onClick={() => handlePhotoChange(Math.min(photoUrls.length - 1, currentPhotoIndex + 1))}
                disabled={currentPhotoIndex === photoUrls.length - 1 || extractingLocation}
              >
                Next
              </button>
            </div>
          </div>

          <div className="photo-display">
            <img
              src={photoUrls[currentPhotoIndex]}
              alt={`Photo ${currentPhotoIndex + 1}`}
              style={{ maxWidth: '400px', maxHeight: '400px' }}
            />
          </div>

          {location && (
            <div className="map-section">
              <h4>Location on Map:</h4>
              <MapComponent
                location={location}
                onLocationChange={handleLocationChange}
                address={address}
                onAddressChange={setAddress}
              />
            </div>
          )}

          <div className="photo-controls">
            <div className="side-selector">
              <h4>Choose Side:</h4>
              <div className="rectangle-selector">
                <button
                  className={`side-button top ${choice === 'D' ? 'active' : ''}`}
                  onClick={() => setChoice('D')}
                >
                  D
                </button>
                
                <button
                  className={`side-button right ${choice === 'A' ? 'active' : ''}`}
                  onClick={() => setChoice('A')}
                >
                  A
                </button>
                
                <button
                  className={`side-button bottom ${choice === 'B' ? 'active' : ''}`}
                  onClick={() => setChoice('B')}
                >
                  B
                </button>
                
                <button
                  className={`side-button left ${choice === 'C' ? 'active' : ''}`}
                  onClick={() => setChoice('C')}
                >
                  C
                </button>

                <div className="address-center" onClick={handleAddressClick}>
                  {isEditingAddress ? (
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      onBlur={() => setIsEditingAddress(false)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          setIsEditingAddress(false);
                        }
                      }}
                      autoFocus
                      className="address-input"
                    />
                  ) : (
                    <div className="address-display">
                      {extractingLocation ? (
                        <span>Loading address...</span>
                      ) : address ? (
                        <span>{address}</span>
                      ) : location ? (
                        <span>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                      ) : (
                        <span>No location data</span>
                      )}
                      <small>Click to edit</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="category-input">
              <label>
                Tree Number:
                <input
                  type="number"
                  min="1"
                  value={category}
                  onChange={(e) => setCategory(parseInt(e.target.value) || 1)}
                />
              </label>
            </div>

            <div className="tree-id-preview">
              <strong>Tree ID: {choice}{category}</strong>
            </div>

            <button
              className="save-button"
              onClick={handleSave}
              disabled={!location || isLoading || extractingLocation}
            >
              {isLoading ? 'Saving...' : 'Save Tree Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
