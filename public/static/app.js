// NexaRide Frontend Application
// Global variables
let stopCounter = 0;
let selectedVehicle = null;

// Initialize quote form
function initQuoteForm() {
    console.log('Initializing quote form...');
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = today;
        dateInput.min = today;
    }
    
    // Set default time to current hour + 2
    const now = new Date();
    now.setHours(now.getHours() + 2);
    const timeString = now.toTimeString().slice(0, 5);
    const timeInput = document.getElementById('time');
    if (timeInput) {
        timeInput.value = timeString;
    }
    
    // Add form submit handler
    const quoteForm = document.getElementById('quoteForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', handleQuoteSubmit);
    }
    
    // Add input change listeners for real-time updates
    const pickupInput = document.getElementById('pickup');
    const destinationInput = document.getElementById('destination');
    const passengersSelect = document.getElementById('passengers');
    
    if (pickupInput) pickupInput.addEventListener('input', debounceQuoteUpdate);
    if (destinationInput) destinationInput.addEventListener('input', debounceQuoteUpdate);
    if (passengersSelect) passengersSelect.addEventListener('change', updateQuote);
    if (dateInput) dateInput.addEventListener('change', updateQuote);
    if (timeInput) timeInput.addEventListener('change', updateQuote);
    
    console.log('Quote form initialized successfully');
}

// Debounce function for quote updates
let quoteUpdateTimeout;
function debounceQuoteUpdate() {
    clearTimeout(quoteUpdateTimeout);
    quoteUpdateTimeout = setTimeout(updateQuote, 500);
}

// Handle quote form submission
async function handleQuoteSubmit(event) {
    event.preventDefault();
    console.log('Quote form submitted');
    
    const pickup = document.getElementById('pickup').value;
    const destination = document.getElementById('destination').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const passengers = parseInt(document.getElementById('passengers').value);
    
    if (!pickup || !destination) {
        showNotification('Per favore inserisci sia il punto di partenza che la destinazione', 'error');
        return;
    }
    
    if (!date || !time) {
        showNotification('Per favore seleziona data e orario', 'error');
        return;
    }
    
    // Collect all stops
    const stops = [];
    const stopInputs = document.querySelectorAll('input[name^="stop_"]');
    stopInputs.forEach(input => {
        if (input.value.trim()) {
            stops.push(input.value.trim());
        }
    });
    
    // Show loading state
    const submitButton = document.querySelector('#quoteForm button[type="submit"]');
    const buttonText = document.getElementById('quote-button-text');
    const originalText = buttonText.textContent;
    buttonText.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Calcolo in corso...';
    submitButton.disabled = true;
    
    try {
        // Use autocomplete system to calculate route if available
        if (window.nexaAutocomplete && typeof window.nexaAutocomplete.calculateRoute === 'function') {
            console.log('Using Google Maps for route calculation...');
            
            const routeData = await window.nexaAutocomplete.calculateRoute(pickup, destination, stops);
            
            if (routeData && routeData.success) {
                // Show vehicle selection
                showVehicleSelection(routeData, passengers);
            } else {
                // Fallback to basic quote calculation
                console.log('Google Maps failed, using fallback calculation');
                showFallbackQuote(pickup, destination, stops, passengers);
            }
        } else {
            // Fallback calculation without Google Maps
            console.log('Google Maps not available, using fallback calculation');
            showFallbackQuote(pickup, destination, stops, passengers);
        }
    } catch (error) {
        console.error('Quote calculation error:', error);
        showFallbackQuote(pickup, destination, stops, passengers);
    } finally {
        // Reset button
        buttonText.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Show vehicle selection based on route data
function showVehicleSelection(routeData, passengers) {
    const vehicleSection = document.getElementById('vehicle-selection');
    const vehicleOptions = document.getElementById('vehicle-options');
    
    if (!vehicleSection || !vehicleOptions) {
        console.log('Vehicle selection elements not found, showing fallback quote');
        showDirectQuote(routeData, passengers);
        return;
    }
    
    // Clear previous options
    vehicleOptions.innerHTML = '';
    
    // Get base price from route data
    const basePrice = routeData.estimatedPrice || calculateFallbackPrice(routeData.distance || 50, routeData.duration || 60);
    
    // Define vehicle types based on passenger count
    const vehicles = getAvailableVehicles(passengers);
    
    vehicles.forEach(vehicle => {
        const price = Math.round(basePrice * vehicle.multiplier);
        
        const vehicleCard = document.createElement('div');
        vehicleCard.className = 'border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors vehicle-option';
        vehicleCard.dataset.vehicle = JSON.stringify({
            ...vehicle,
            price: price,
            routeData: routeData
        });
        
        vehicleCard.innerHTML = `
            <div class="text-center">
                <i class="${vehicle.icon} text-3xl text-blue-600 mb-2"></i>
                <h3 class="font-bold text-gray-800 mb-1">${vehicle.name}</h3>
                <p class="text-sm text-gray-600 mb-2">${vehicle.description}</p>
                <div class="text-lg font-bold text-blue-600">€${price}</div>
                <div class="text-xs text-gray-500 mt-1">
                    <i class="fas fa-users mr-1"></i>${vehicle.capacity} pax
                    <i class="fas fa-suitcase ml-2 mr-1"></i>${vehicle.luggage} bagagli
                </div>
            </div>
        `;
        
        vehicleCard.addEventListener('click', () => selectVehicle(vehicleCard));
        vehicleOptions.appendChild(vehicleCard);
    });
    
    vehicleSection.classList.remove('hidden');
    vehicleSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show direct quote without vehicle selection
function showDirectQuote(routeData, passengers) {
    const basePrice = routeData.estimatedPrice || calculateFallbackPrice(routeData.distance || 50, routeData.duration || 60);
    const defaultVehicle = getAvailableVehicles(passengers)[0]; // Get first available vehicle
    
    if (defaultVehicle) {
        const vehicleData = {
            ...defaultVehicle,
            price: Math.round(basePrice * defaultVehicle.multiplier),
            routeData: routeData
        };
        
        selectedVehicle = vehicleData;
        showQuoteResult(vehicleData);
    }
}

// Show fallback quote without Google Maps
function showFallbackQuote(pickup, destination, stops, passengers) {
    // Estimate distance based on typical routes
    let estimatedKm = 25; // Default city distance
    
    // Check for airport routes (higher distance)
    const locations = [pickup, destination, ...stops].join(' ').toLowerCase();
    if (locations.includes('aeroporto') || locations.includes('airport') || 
        locations.includes('malpensa') || locations.includes('linate') || 
        locations.includes('orio') || locations.includes('bergamo')) {
        estimatedKm = 45;
    }
    
    // Check for intercity routes
    if (locations.includes('milano') && (locations.includes('roma') || locations.includes('firenze'))) {
        estimatedKm = 300;
    }
    
    const basePrice = calculateFallbackPrice(estimatedKm, estimatedKm * 1.2);
    const routeData = {
        success: true,
        distance: estimatedKm,
        duration: estimatedKm * 1.2,
        estimatedPrice: basePrice,
        fallback: true
    };
    
    showVehicleSelection(routeData, passengers);
}

// Calculate fallback price
function calculateFallbackPrice(distanceKm, durationMinutes) {
    const baseRate = 2.5; // €2.50 per km
    const timeRate = 0.8; // €0.80 per minute
    const minimumFare = 35; // Minimum €35
    
    const distancePrice = distanceKm * baseRate;
    const timePrice = durationMinutes * timeRate;
    const totalPrice = Math.max(distancePrice + timePrice, minimumFare);
    
    return Math.round(totalPrice);
}

// Get available vehicles based on passenger count
function getAvailableVehicles(passengers) {
    const allVehicles = [
        {
            name: 'Berlina Executive',
            description: 'Mercedes Classe E, BMW Serie 5',
            capacity: '1-3',
            luggage: '2-3',
            icon: 'fas fa-car',
            multiplier: 1.0,
            maxPassengers: 3
        },
        {
            name: 'SUV Premium', 
            description: 'Mercedes GLE, BMW X5',
            capacity: '1-6',
            luggage: '4-6',
            icon: 'fas fa-truck-pickup',
            multiplier: 1.3,
            maxPassengers: 6
        },
        {
            name: 'Minivan Luxury',
            description: 'Mercedes Vito, VW Multivan', 
            capacity: '6-8',
            luggage: '8+',
            icon: 'fas fa-shuttle-van',
            multiplier: 1.6,
            maxPassengers: 8
        }
    ];
    
    // Filter vehicles that can accommodate the passenger count
    return allVehicles.filter(vehicle => passengers <= vehicle.maxPassengers);
}

// Select a vehicle
function selectVehicle(vehicleCard) {
    // Remove selection from other cards
    document.querySelectorAll('.vehicle-option').forEach(card => {
        card.classList.remove('border-blue-500', 'bg-blue-50');
        card.classList.add('border-gray-200');
    });
    
    // Select this card
    vehicleCard.classList.remove('border-gray-200');
    vehicleCard.classList.add('border-blue-500', 'bg-blue-50');
    
    // Store selected vehicle data
    selectedVehicle = JSON.parse(vehicleCard.dataset.vehicle);
    
    // Show quote result
    showQuoteResult(selectedVehicle);
}

// Show final quote result
function showQuoteResult(vehicle) {
    const quoteResult = document.getElementById('quote-result');
    const quoteDetails = document.getElementById('quote-details');
    
    if (!quoteResult || !quoteDetails) {
        console.log('Quote result elements not found');
        return;
    }
    
    const routeInfo = vehicle.routeData;
    const isAirport = checkAirportRoute();
    
    quoteDetails.innerHTML = `
        <div class="flex justify-between items-center">
            <span><i class="fas fa-car mr-2"></i>Veicolo:</span>
            <span class="font-semibold">${vehicle.name}</span>
        </div>
        <div class="flex justify-between items-center">
            <span><i class="fas fa-route mr-2"></i>Distanza:</span>
            <span class="font-semibold">${routeInfo.distance ? Math.round(routeInfo.distance) + ' km' : 'Stimata'}</span>
        </div>
        <div class="flex justify-between items-center">
            <span><i class="fas fa-clock mr-2"></i>Durata:</span>
            <span class="font-semibold">${routeInfo.duration ? Math.round(routeInfo.duration) + ' min' : 'Stimata'}</span>
        </div>
        ${isAirport ? '<div class="text-sm opacity-90"><i class="fas fa-plane mr-2"></i>Include monitoraggio volo e meet & greet</div>' : ''}
        ${routeInfo.fallback ? '<div class="text-sm opacity-90"><i class="fas fa-info-circle mr-2"></i>Preventivo stimato - confermato alla prenotazione</div>' : ''}
        <div class="border-t border-white border-opacity-30 pt-2 mt-2">
            <div class="flex justify-between items-center text-lg font-bold">
                <span>Prezzo Totale:</span>
                <span>€${vehicle.price}</span>
            </div>
        </div>
    `;
    
    quoteResult.classList.remove('hidden');
    quoteResult.classList.add('scale-in');
    quoteResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Check if route involves airport
function checkAirportRoute() {
    const pickupInput = document.getElementById('pickup');
    const destinationInput = document.getElementById('destination');
    
    if (!pickupInput || !destinationInput) return false;
    
    const pickup = pickupInput.value.toLowerCase();
    const destination = destinationInput.value.toLowerCase();
    const airports = ['aeroporto', 'airport', 'malpensa', 'linate', 'orio', 'bergamo'];
    
    return airports.some(airport => 
        pickup.includes(airport) || destination.includes(airport)
    );
}

// Add stop functionality
function addStop() {
    if (stopCounter >= 3) {
        showNotification('Puoi aggiungere un massimo di 3 fermate intermedie.', 'warning');
        return;
    }
    
    stopCounter++;
    const stopsContainer = document.getElementById('stops-container');
    
    if (!stopsContainer) {
        console.error('Stops container not found');
        return;
    }
    
    const stopDiv = document.createElement('div');
    stopDiv.className = 'relative';
    stopDiv.id = `stop-${stopCounter}`;
    
    stopDiv.innerHTML = `
        <label class="block text-sm font-medium text-nexa-dark mb-2">
            <i class="fas fa-map-pin text-yellow-500 mr-2"></i>
            Tappa ${stopCounter}
        </label>
        <div class="flex gap-2">
            <div class="flex-1 relative">
                <input type="text" id="stop_${stopCounter}" name="stop_${stopCounter}"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nexa-blue focus:border-nexa-blue"
                       placeholder="Inserisci tappa intermedia..."
                       autocomplete="off">
                <div id="stop_${stopCounter}-suggestions" class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 hidden shadow-lg max-h-60 overflow-y-auto suggestions-container"></div>
            </div>
            <button type="button" onclick="removeStop(${stopCounter})"
                    class="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    stopsContainer.appendChild(stopDiv);
    
    // Initialize autocomplete for the new stop if available
    if (window.nexaAutocomplete && typeof window.nexaAutocomplete.initializeInput === 'function') {
        setTimeout(() => {
            window.nexaAutocomplete.initializeInput(`stop_${stopCounter}`);
        }, 100);
    }
    
    // Add event listener for real-time updates
    const newStopInput = document.getElementById(`stop_${stopCounter}`);
    if (newStopInput) {
        newStopInput.addEventListener('input', debounceQuoteUpdate);
    }
}

// Remove stop functionality  
function removeStop(stopId) {
    const stopElement = document.getElementById(`stop-${stopId}`);
    if (stopElement) {
        stopElement.remove();
        stopCounter--;
        updateQuote();
    }
}

// Update quote in real-time
function updateQuote() {
    const pickup = document.getElementById('pickup')?.value || '';
    const destination = document.getElementById('destination')?.value || '';
    const passengers = parseInt(document.getElementById('passengers')?.value || '1');
    
    // Only show vehicle selection if we have both pickup and destination
    if (pickup && destination) {
        // Trigger quote calculation automatically
        setTimeout(() => {
            if (window.nexaAutocomplete && typeof window.nexaAutocomplete.calculateRoute === 'function') {
                const stops = [];
                const stopInputs = document.querySelectorAll('input[name^="stop_"]');
                stopInputs.forEach(input => {
                    if (input.value.trim()) {
                        stops.push(input.value.trim());
                    }
                });
                
                window.nexaAutocomplete.calculateRoute(pickup, destination, stops)
                    .then(routeData => {
                        if (routeData && routeData.success) {
                            showVehicleSelection(routeData, passengers);
                        }
                    })
                    .catch(error => {
                        console.log('Auto-quote calculation failed:', error);
                    });
            }
        }, 1000);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-black' :
        type === 'success' ? 'bg-green-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-lg">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Global scroll function
function scrollToQuote() {
    const quoteSection = document.getElementById('preventivo');
    if (quoteSection) {
        quoteSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing NexaRide app...');
    initQuoteForm();
    
    // Initialize smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Export functions for global use
window.addStop = addStop;
window.removeStop = removeStop; 
window.selectVehicle = selectVehicle;
window.scrollToQuote = scrollToQuote;
window.initQuoteForm = initQuoteForm;
