import React, { useEffect, useRef, useState, useCallback } from 'react';
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface MapComponentProps {
    location: { lat: number; lng: number };
    onLocationChange: (newLocation: { lat: number; lng: number }) => void;
    address: string;
    onAddressChange: (newAddress: string) => void;
}

declare global {
    interface Window {
        google: any;
        initGoogleMaps: () => void;
    }
}

// Global flag to track if Google Maps is loading
let isGoogleMapsLoading = false;
let googleMapsLoadPromise: Promise<void> | null = null;

const MapComponent: React.FC<MapComponentProps> = ({
    location,
    onLocationChange,
    address,
    onAddressChange
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [marker, setMarker] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

    const loadGoogleMaps = useCallback((): Promise<void> => {
        if (window.google) {
            return Promise.resolve();
        }

        if (googleMapsLoadPromise) {
            return googleMapsLoadPromise;
        }

        if (isGoogleMapsLoading) {
            return new Promise((resolve) => {
                const checkGoogle = () => {
                    if (window.google) {
                        resolve();
                    } else {
                        setTimeout(checkGoogle, 100);
                    }
                };
                checkGoogle();
            });
        }

        isGoogleMapsLoading = true;

        googleMapsLoadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
            script.async = true;
            script.defer = true;
            
            window.initGoogleMaps = () => {
                isGoogleMapsLoading = false;
                resolve();
            };

            script.onerror = () => {
                isGoogleMapsLoading = false;
                reject(new Error('Failed to load Google Maps'));
            };

            document.head.appendChild(script);
        });

        return googleMapsLoadPromise;
    }, []);

    const initializeMap = useCallback(() => {
        if (!mapRef.current || !window.google || !location) return;

        try {
            const mapInstance = new window.google.maps.Map(mapRef.current, {
                center: { lat: location.lat, lng: location.lng },
                zoom: 18,
                mapTypeId: 'satellite',
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                fullscreenControl: false
            });

            const markerInstance = new window.google.maps.Marker({
                position: { lat: location.lat, lng: location.lng },
                map: mapInstance,
                draggable: true,
                title: 'Tree Location',
                animation: window.google.maps.Animation.DROP
            });

            // Handle marker drag with debouncing
            let dragTimeout: NodeJS.Timeout;
            markerInstance.addListener('dragend', () => {
                clearTimeout(dragTimeout);
                dragTimeout = setTimeout(async () => {
                    const newPosition = markerInstance.getPosition();
                    const newLocation = {
                        lat: newPosition.lat(),
                        lng: newPosition.lng()
                    };
                    
                    onLocationChange(newLocation);
                    
                    // Get new address
                    try {
                        const geocoder = new window.google.maps.Geocoder();
                        const results = await reverseGeocode(geocoder, newLocation);
                        if (results.length > 0) {
                            const simpleAddress = extractSimpleAddress(results[0].formatted_address);
                            onAddressChange(simpleAddress);
                        }
                    } catch (error) {
                        console.error('Geocoding failed:', error);
                    }
                }, 500); // Debounce for 500ms
            });

            setMap(mapInstance);
            setMarker(markerInstance);
            setIsLoading(false);
        } catch (err) {
            setError('Failed to initialize map');
            setIsLoading(false);
        }
    }, [location, onLocationChange, onAddressChange]);

    useEffect(() => {
        const setupMap = async () => {
            try {
                await loadGoogleMaps();
                initializeMap();
            } catch (err) {
                setError('Failed to load Google Maps. Please check your API key and internet connection.');
                setIsLoading(false);
            }
        };

        setupMap();
    }, [loadGoogleMaps, initializeMap]);

    useEffect(() => {
        if (map && marker && location) {
            const newPosition = new window.google.maps.LatLng(location.lat, location.lng);
            marker.setPosition(newPosition);
            map.setCenter(newPosition);
        }
    }, [location, map, marker]);

    const reverseGeocode = (geocoder: any, location: { lat: number; lng: number }): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            geocoder.geocode(
                { location: { lat: location.lat, lng: location.lng } },
                (results: any[], status: string) => {
                    if (status === 'OK') {
                        resolve(results);
                    } else {
                        reject(new Error(`Geocoding failed: ${status}`));
                    }
                }
            );
        });
    };

    const extractSimpleAddress = (fullAddress: string): string => {
        // Remove county, state, country, zip code info
        const parts = fullAddress.split(',');
        // Keep only street address and city (first 2 parts typically)
        const simpleParts = parts.slice(0, 2);
        return simpleParts.join(',').trim();
    };

    if (isLoading) {
        return (
            <div className="map-container">
                <div className="map-loading" style={{ 
                    width: '100%', 
                    height: '300px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px'
                }}>
                    Loading map...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="map-container">
                <div className="map-error" style={{ 
                    width: '100%', 
                    height: '300px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#ffebee',
                    borderRadius: '8px',
                    color: '#c62828',
                    textAlign: 'center',
                    padding: '20px'
                }}>
                    <div>
                        <p>{error}</p>
                        <small>Make sure your Google Maps API key is valid and ad blockers are disabled</small>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="map-container">
            <div
                ref={mapRef}
                className="map"
                style={{ width: '100%', height: '300px', borderRadius: '8px' }}
            />
            <p className="map-instructions">
                📍 Drag the pin to adjust the exact location
            </p>
        </div>
    );
};

export default MapComponent;
