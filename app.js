// Initialize variables
let map;
let markers = [];
let addresses = [];
let routingControl = null;
let excelData = null;

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Leaflet map focused on Naperville, IL
    map = L.map('map').setView([41.7508, -88.1535], 12);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add event listeners
    document.getElementById('import-excel').addEventListener('click', importExcel);
    document.getElementById('process-addresses').addEventListener('click', () => processAddresses(excelData));
    document.getElementById('optimize-route').addEventListener('click', optimizeRoute);
    
    // Modal handlers
    const modal = document.getElementById('address-modal');
    document.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });
    
    document.getElementById('open-maps').addEventListener('click', openInMaps);
    document.getElementById('take-photo').addEventListener('click', takePhoto);
    document.getElementById('photo-input').addEventListener('change', handlePhotoUpload);
    document.getElementById('save-comments').addEventListener('click', saveComments);
});

// Handle Excel file upload and preview
function importExcel() {
    const fileInput = document.getElementById('excel-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select an Excel file first.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            // Get the first sheet
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 'A'});
            
            // Store the data for later processing
            excelData = XLSX.utils.sheet_to_json(firstSheet);
            
            // Display the Excel data as a table
            displayExcelTable(jsonData);
            
            // Show the Excel table container
            document.querySelector('.excel-table-container').style.display = 'block';
            
        } catch (error) {
            console.error('Error reading Excel file:', error);
            alert('Failed to read the Excel file. Please try again.');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Display Excel data as a table
function displayExcelTable(data) {
    if (!data || data.length === 0) {
        alert('No data found in the Excel file.');
        return;
    }
    
    const tableHead = document.getElementById('excel-table-head');
    const tableBody = document.getElementById('excel-table-body');
    
    // Clear previous data
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    
    // Create header row
    const headerRow = document.createElement('tr');
    const headers = Object.keys(data[0]);
    
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    
    tableHead.appendChild(headerRow);
    
    // Create data rows
    data.forEach((row, index) => {
        // Skip the first row if it's the header
        if (index === 0 && Object.values(row).every(val => typeof val === 'string')) {
            // This might be a header row, check if values match headers
            const possibleHeaderValues = Object.values(row);
            const isHeader = headers.some(header => 
                possibleHeaderValues.includes(header) || 
                header.toUpperCase() === 'A' // First column in Excel
            );
            
            if (isHeader) return;
        }
        
        const tr = document.createElement('tr');
        
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
    });
}

// Process addresses from Excel data
function processAddresses(data) {
    if (!data || data.length === 0) {
        alert('No data to process. Please import an Excel file first.');
        return;
    }
    
    // Clear previous addresses and markers
    addresses = [];
    clearMarkers();
    
    // Process each row from Excel
    data.forEach((row, index) => {
        // Check if row has an address
        if (row.Address) {
            // Create a work order object with all relevant data
            const workOrder = {
                id: index + 1,
                address: row.Address,
                workOrderNumber: row['Work Order #'],
                account: row.Account,
                eu: row.EU,
                address2: row.ADDRESS2,
                topSoilExcav4: row['TOP     SOIL EXCAV. - 4"'],
                topSoilExcav12: row['TOP     SOIL EXCAV. - 12"'],
                topSoil4: row['TOP  SOIL 4"'],
                topSoil12: row['TOP  SOIL 12"'],
                seedingBlanket: row['SEEDING & Blanket'],
                sod: row.SOD,
                water: row.WATER,
                traffic: row.TRAFFIC,
                extraWork: row[' EXTRA WORK '],
                notes: row[' NOTES '],
                minCharge: row['MIN CHARGE'],
                subTotal: row['SUB-TOTAL']
            };

            // Add formatted details for popup
            workOrder.details = `
                <strong>Work Order:</strong> ${workOrder.workOrderNumber}<br>
                <strong>Account:</strong> ${workOrder.account}<br>
                <strong>EU:</strong> ${workOrder.eu || 'N/A'}<br>
                ${workOrder.notes ? `<strong>Notes:</strong> ${workOrder.notes}<br>` : ''}
                <strong>Sub-Total:</strong> ${workOrder.subTotal}
            `;

            // Add to addresses array
            addresses.push({
                id: workOrder.id,
                address: workOrder.address,
                data: workOrder,
                comments: '',
                photos: []
            });
        }
    });
    
    // Display addresses and plot on map
    displayAddressList();
    geocodeAddresses();
    
    if (addresses.length > 0) {
        document.getElementById('optimize-route').style.display = 'block';
    } else {
        document.getElementById('optimize-route').style.display = 'none';
    }
}

// Display addresses in the list
function displayAddressList() {
    const addressList = document.getElementById('address-list');
    addressList.innerHTML = '';
    
    addresses.forEach(item => {
        const addressItem = document.createElement('div');
        addressItem.className = 'address-item';
        
        // Create a more detailed address item
        addressItem.innerHTML = `
            <div class="address-main">${item.id}. ${item.address}</div>
            <div class="address-details">
                WO#: ${item.data.workOrderNumber} | ${item.data.account}
                ${item.data.notes ? `<br>Notes: ${item.data.notes}` : ''}
                <br>Sub-Total: ${item.data.subTotal}
            </div>
        `;
        
        addressItem.dataset.id = item.id;
        
        // Add click event to show on map
        addressItem.addEventListener('click', () => {
            const marker = markers.find(m => m.addressId === item.id);
            if (marker) {
                map.setView(marker.getLatLng(), 16);
                marker.openPopup();
            }
        });
        
        addressList.appendChild(addressItem);
    });
}

// Geocode addresses and add markers to map
function geocodeAddresses() {
    addresses.forEach(item => {
        // Use Nominatim for geocoding (OpenStreetMap's geocoder)
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item.address)}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const result = data[0];
                    const lat = parseFloat(result.lat);
                    const lon = parseFloat(result.lon);
                    
                    // Save coordinates to the address object
                    item.lat = lat;
                    item.lon = lon;
                    
                    // Add marker to map
                    const marker = L.marker([lat, lon]).addTo(map);
                    marker.addressId = item.id;
                    marker.bindPopup(`<b>${item.address}</b>`);
                    
                    // Add click event to marker
                    marker.on('click', () => {
                        openAddressModal(item);
                    });
                    
                    markers.push(marker);
                    
                    // If this is the first address, center map on it
                    if (markers.length === 1) {
                        map.setView([lat, lon], 13);
                    } else if (markers.length === addresses.length) {
                        // Once all markers are added, fit map to show all
                        const group = new L.featureGroup(markers);
                        map.fitBounds(group.getBounds().pad(0.1));
                    }
                }
            })
            .catch(error => {
                console.error(`Error geocoding address ${item.address}:`, error);
            });
    });
}

// Clear all markers from map
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Remove routing if exists
    if (routingControl) {
        map.removeControl(routingControl);
        routingControl = null;
    }
}

// Open the address modal
function openAddressModal(address) {
    const modal = document.getElementById('address-modal');
    document.getElementById('modal-address').innerHTML = `
        <div>${address.address}</div>
        <div class="modal-details">
            <small>
                Work Order: ${address.data.workOrderNumber}<br>
                Account: ${address.data.account}<br>
                ${address.data.notes ? `Notes: ${address.data.notes}<br>` : ''}
                Sub-Total: ${address.data.subTotal}
            </small>
        </div>
    `;
    
    // Load existing comments if any
    document.getElementById('comments').value = address.comments || '';
    
    // Load existing photos if any
    const gallery = document.getElementById('photo-gallery');
    gallery.innerHTML = '';
    if (address.photos && address.photos.length > 0) {
        address.photos.forEach(photo => {
            const img = document.createElement('img');
            img.src = photo;
            img.className = 'photo-thumbnail';
            gallery.appendChild(img);
        });
    } else {
        gallery.innerHTML = '<p>No photos yet</p>';
    }
    
    // Set the current address for other functions
    modal.dataset.addressId = address.id;
    
    modal.style.display = 'block';
}

// Open address in Apple Maps
function openInMaps() {
    const addressId = document.getElementById('address-modal').dataset.addressId;
    const address = addresses.find(a => a.id == addressId);
    
    if (address && address.lat && address.lon) {
        // Use Apple Maps URL scheme
        const mapsUrl = `maps://maps.apple.com/?q=${encodeURIComponent(address.address)}&ll=${address.lat},${address.lon}`;
        window.open(mapsUrl);
    } else {
        // Fallback if no coordinates
        const mapsSearchUrl = `maps://maps.apple.com/?q=${encodeURIComponent(address.address)}`;
        window.open(mapsSearchUrl);
    }
}

// Trigger photo taking
function takePhoto() {
    document.getElementById('photo-input').click();
}

// Handle photo upload
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const addressId = document.getElementById('address-modal').dataset.addressId;
    const address = addresses.find(a => a.id == addressId);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoData = e.target.result;
        
        // Initialize photos array if needed
        if (!address.photos) {
            address.photos = [];
        }
        
        // Add the photo
        address.photos.push(photoData);
        
        // Update gallery
        const gallery = document.getElementById('photo-gallery');
        gallery.innerHTML = '';
        
        address.photos.forEach(photo => {
            const img = document.createElement('img');
            img.src = photo;
            img.className = 'photo-thumbnail';
            gallery.appendChild(img);
        });
    };
    
    reader.readAsDataURL(file);
}

// Save comments
function saveComments() {
    const addressId = document.getElementById('address-modal').dataset.addressId;
    const address = addresses.find(a => a.id == addressId);
    
    if (address) {
        address.comments = document.getElementById('comments').value;
        alert('Comments saved!');
    }
}

// Optimize the route
function optimizeRoute() {
    // Clear any existing routing
    if (routingControl) {
        map.removeControl(routingControl);
    }
    
    // Check if we have enough addresses with coordinates
    const validAddresses = addresses.filter(address => address.lat && address.lon);
    if (validAddresses.length < 2) {
        alert('Need at least 2 addresses with valid coordinates to create a route');
        return;
    }
    
    // Create waypoints for routing
    const waypoints = validAddresses.map(address => 
        L.latLng(address.lat, address.lon)
    );
    
    // Create the routing control
    routingControl = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true
    }).addTo(map);
    
    // Display route info when route is calculated
    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        
        // Convert distance from meters to miles
        const distanceInMiles = (summary.totalDistance / 1609.34).toFixed(2);
        
        // Convert time from seconds to minutes
        const timeInMinutes = Math.round(summary.totalTime / 60);
        
        // Update the UI
        document.getElementById('route-distance').textContent = distanceInMiles;
        document.getElementById('route-time').textContent = timeInMinutes;
        document.getElementById('route-info').style.display = 'block';
    });
}
