import React, { useState } from 'react';
import * as exifr from 'exifr';
import { PhotoData } from '../types';
import { getAddressFromCoordinates } from '../services/geoService';

const PhotoUpload: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setLoading(true);
    const newPhotos: PhotoData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      
      try {
        // Extract EXIF data
        const exifData = await exifr.parse(file);
        let photoData: PhotoData = {
          file,
          preview,
          rating: 0,
          description: '',
          timestamp: new Date()
        };

        // Check for GPS coordinates
        if (exifData?.latitude && exifData?.longitude) {
          photoData.latitude = exifData.latitude;
          photoData.longitude = exifData.longitude;
          
          // Get address from coordinates
          const address = await getAddressFromCoordinates(
            exifData.latitude,
            exifData.longitude
          );
          photoData.address = address;
        }

        newPhotos.push(photoData);
      } catch (error) {
        console.error('Error processing photo:', error);
        // Add photo without geolocation data
        newPhotos.push({
          file,
          preview,
          rating: 0,
          description: '',
          timestamp: new Date()
        });
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setLoading(false);
  };

  const updatePhotoData = (index: number, field: keyof PhotoData, value: any) => {
    setPhotos(prev => prev.map((photo, i) => 
      i === index ? { ...photo, [field]: value } : photo
    ));
  };

  const StarRating: React.FC<{ rating: number; onChange: (rating: number) => void }> = ({ rating, onChange }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => onChange(star)}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="photo-upload">
      <div className="upload-section">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          disabled={loading}
        />
        {loading && <p>Processing photos...</p>}
      </div>

      <div className="photos-grid">
        {photos.map((photo, index) => (
          <div key={index} className="photo-card">
            <img src={photo.preview} alt="Uploaded" className="photo-preview" />
            
            <div className="photo-info">
              {photo.address && (
                <p className="address">📍 {photo.address}</p>
              )}
              
              {photo.latitude && photo.longitude && (
                <p className="coordinates">
                  Coordinates: {photo.latitude.toFixed(6)}, {photo.longitude.toFixed(6)}
                </p>
              )}
              
              <div className="rating-section">
                <label>Rating:</label>
                <StarRating
                  rating={photo.rating}
                  onChange={(rating) => updatePhotoData(index, 'rating', rating)}
                />
                <span>{photo.rating}/5 stars</span>
              </div>
              
              <div className="description-section">
                <label>Description:</label>
                <textarea
                  value={photo.description}
                  onChange={(e) => updatePhotoData(index, 'description', e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoUpload;
