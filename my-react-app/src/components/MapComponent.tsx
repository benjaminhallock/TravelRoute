import React, { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

interface MapComponentProps {
    location: { lat: number; lng: number }
    onLocationChange: (newLocation: { lat: number; lng: number }) => void
    address: string
    onAddressChange: (newAddress: string) => void
}

const MapComponent: React.FC<MapComponentProps> = ({
    location,
    onLocationChange,
    address,
    onAddressChange
}) => {
    const mapRef = useRef<HTMLDivElement | null>(null)
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [marker, setMarker] = useState<google.maps.Marker | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string>('')

    const extractSimpleAddress = (fullAddress: string): string => {
        const parts = fullAddress.split(',')
        const simpleParts = parts.slice(0, 2)
        return simpleParts.join(',').trim()
    }

    useEffect(() => {
        console.log("Loading Google Maps...")

        if (!apiKey) {
            setError('Google Maps API key is missing. Please check your environment variables.')
            setIsLoading(false)
            return
        }

        const loader = new Loader({
            apiKey: apiKey,
            version: "weekly",
            libraries: ['places'],
        })

        loader.load().then(() => {
            console.log("Google Maps loaded, initializing map...")

            if (!mapRef.current || !window.google) {
                setError('Failed to initialize map')
                setIsLoading(false)
                return
            }

            try {
                const mapLocation = new google.maps.LatLng(location.lat, location.lng)

                const mapInstance = new google.maps.Map(mapRef.current, {
                    center: mapLocation,
                    zoom: 18,
                    mapTypeId: 'satellite',
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    fullscreenControl: false
                })

                const markerInstance = new google.maps.Marker({
                    position: mapLocation,
                    map: mapInstance,
                    draggable: true,
                    title: 'Tree Location'
                })

                // Handle marker drag
                markerInstance.addListener('dragend', () => {
                    const newPosition = markerInstance.getPosition()
                    if (newPosition) {
                        const newLocation = {
                            lat: newPosition.lat(),
                            lng: newPosition.lng()
                        }

                        console.log('Marker dragged to:', newLocation)
                        onLocationChange(newLocation)

                        // Get new address
                        const geocoder = new google.maps.Geocoder()
                        geocoder.geocode({ location: newLocation }, (results, status) => {
                            if (status === 'OK' && results && results.length > 0) {
                                const simpleAddress = extractSimpleAddress(results[0].formatted_address)
                                onAddressChange(simpleAddress)
                            } else {
                                console.error('Geocoder failed:', status)
                            }
                        })
                    }
                })

                setMap(mapInstance)
                setMarker(markerInstance)
                setIsLoading(false)
                setError('')

                console.log('Map initialized successfully')
            } catch (err) {
                console.error('Map initialization error:', err)
                setError('Failed to initialize map')
                setIsLoading(false)
            }

        }).catch((err) => {
            console.error("Map load error:", err)
            setError('Failed to load Google Maps. Please check your API key and internet connection.')
            setIsLoading(false)
        })
    }, []) // Only run once on mount

    // Update map position when location prop changes
    useEffect(() => {
        if (map && marker && location) {
            console.log('Updating map position to:', location)
            const newPosition = new google.maps.LatLng(location.lat, location.lng)
            marker.setPosition(newPosition)
            map.setCenter(newPosition)
        }
    }, [location, map, marker])

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
                    borderRadius: '8px',
                    border: '2px dashed #ccc'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div>🗺️</div>
                        <div>Loading map...</div>
                        {!apiKey && <div style={{ color: 'red', fontSize: '12px' }}>API key missing</div>}
                    </div>
                </div>
            </div>
        )
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
                    padding: '20px',
                    border: '2px solid #f44336'
                }}>
                    <div>
                        <div>❌</div>
                        <p>{error}</p>
                        <small>
                            API Key: {apiKey ? '✓ Present' : '❌ Missing'}<br />
                            Make sure your .env file contains VITE_GOOGLE_MAPS_API_KEY
                        </small>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="map-container">
            <div
                ref={mapRef}
                className="map"
                style={{
                    width: '100%',
                    height: '300px',
                    borderRadius: '8px',
                    border: '2px solid #ccc'
                }}
            />
            <p className="map-instructions">
                📍 Drag the pin to adjust the exact location
            </p>
        </div>
    )
}

export default MapComponent
