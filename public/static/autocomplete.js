/**
 * NexaRide Autocomplete System
 * Sistema di autocompletamento intelligente con Google Maps Places API
 */

class NexaRideAutocomplete {
    constructor() {
this.autocompleteService = null;
this.directionsService = null;
this.geocoder = null;
     this.initialized = false;
        
        // Configuration
        this.config = {
            debounceDelay: 300,
            minCharsForSearch: 2,
            maxSuggestions: 5,
            
            // Airport codes and their base prices (EUR)
            airports: {
                'FCO': { name: 'Roma Fiumicino', basePrice: 45 },
                'CIA': { name: 'Roma Ciampino', basePrice: 40 },
                'LIN': { name: 'Milano Linate', basePrice: 35 },
                'MXP': { name: 'Milano Malpensa', basePrice: 55 },
                'BGY': { name: 'Milano Bergamo', basePrice: 50 },
                'NAP': { name: 'Napoli', basePrice: 25 },
                'CTA': { name: 'Catania', basePrice: 30 },
                'PMO': { name: 'Palermo', basePrice: 35 },
                'BLQ': { name: 'Bologna', basePrice: 30 },
                'FLR': { name: 'Firenze', basePrice: 25 },
                'VCE': { name: 'Venezia Marco Polo', basePrice: 40 },
                'TSF': { name: 'Venezia Treviso', basePrice: 45 },
                'BRI': { name: 'Bari', basePrice: 25 },
                'CRV': { name: 'Crotone', basePrice: 30 },
                'GOA': { name: 'Genova', basePrice: 35 }
            },
            
            // Base pricing per km
            basePricePerKm: 1.8,
            minimumPrice: 25,
            
            // Vehicle multipliers
            vehicleMultipliers: {
                economy: 1.0,
                comfort: 1.3,
                business: 1.8,
                van: 2.2
            }
        };
        
        this.activeInputs = new Map();
        this.debounceTimers = new Map();
        this.lastResults = new Map();
    }
    
    /**
     * Initialize the autocomplete system
     */
    async init() {
        try {
            console.log('Initializing NexaRide Autocomplete...');
            
            // Wait for Google Maps API
            if (typeof google === 'undefined' || !google.maps) {
                console.log('Waiting for Google Maps API...');
                await this.waitForGoogleMaps();
            }
            
// Initialize Google Maps services
this.autocompleteService = new google.maps.places.AutocompleteService(); // ← quello giusto per i suggerimenti
this.directionsService = new google.maps.DirectionsService();
this.geocoder = new google.maps.Geocoder();

console.log('Google Maps services initialized');

            
            // Initialize form inputs
            this.initializeInputs();
            
            this.initialized = true;
            console.log('NexaRide Autocomplete initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize autocomplete:', error);
            this.handleFallback();
        }
    }
    
    /**
     * Wait for Google Maps API to load
     */
    waitForGoogleMaps(maxAttempts = 30) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            
            const checkGoogle = () => {
                attempts++;
                
                if (typeof google !== 'undefined' && google.maps && google.maps.places) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Google Maps API failed to load'));
                } else {
                    setTimeout(checkGoogle, 500);
                }
            };
            
            checkGoogle();
        });
    }
    
    /**
     * Initialize autocomplete for form inputs
     */
    initializeInputs() {
        const inputConfigs = [
            { id: 'pickup', suggestionId: 'pickupSuggestions' },
            { id: 'destination', suggestionId: 'destinationSuggestions' }
        ];
        
        inputConfigs.forEach(config => {
            this.initInput(
                document.getElementById(config.id),
                config.suggestionId
            );
        });
    }
    
    /**
     * Initialize autocomplete for a specific input
     */
    initInput(inputElement, suggestionElementId) {
        if (!inputElement) {
            console.warn(`Input element not found: ${inputElement}`);
            return;
        }
        
        const suggestionElement = document.getElementById(suggestionElementId);
        if (!suggestionElement) {
            console.warn(`Suggestion element not found: ${suggestionElementId}`);
            return;
        }
        
        // Store input configuration
        this.activeInputs.set(inputElement.id, {
            input: inputElement,
            suggestions: suggestionElement,
            lastQuery: '',
            selectedPlace: null
        });
        
        // Add event listeners
        inputElement.addEventListener('input', (e) => {
            this.handleInputChange(inputElement.id, e.target.value);
        });
        
        inputElement.addEventListener('focus', () => {
            this.handleInputFocus(inputElement.id);
        });
        
        inputElement.addEventListener('blur', () => {
            // Delay hiding suggestions to allow click events
            setTimeout(() => this.hideSuggestions(inputElement.id), 150);
        });
        
        console.log(`Autocomplete initialized for: ${inputElement.id}`);
    }
    
    /**
     * Handle input value changes
     */
    handleInputChange(inputId, value) {
        const config = this.activeInputs.get(inputId);
        if (!config) return;
        
        config.lastQuery = value;
        config.selectedPlace = null;
        
        // Clear existing timer
        if (this.debounceTimers.has(inputId)) {
            clearTimeout(this.debounceTimers.get(inputId));
        }
        
        // Hide suggestions if input is too short
        if (value.length < this.config.minCharsForSearch) {
            this.hideSuggestions(inputId);
            return;
        }
        
        // Debounced search
        const timer = setTimeout(() => {
            this.searchPlaces(inputId, value);
        }, this.config.debounceDelay);
        
        this.debounceTimers.set(inputId, timer);
    }
    
    /**
     * Handle input focus
     */
    handleInputFocus(inputId) {
        const config = this.activeInputs.get(inputId);
        if (!config) return;
        
        const value = config.input.value;
        if (value.length >= this.config.minCharsForSearch) {
            this.searchPlaces(inputId, value);
        }
    }
    
    /**
     * Search for places using Google Places API
     */
    async searchPlaces(inputId, query) {
        if (!this.initialized || !query.trim()) {
            return;
        }
        
        try {
            // Check for airport codes first
            const airportResults = this.searchAirports(query);
            
            // Search Google Places
            const placesResults = await this.searchGooglePlaces(query);
            
            // Combine and prioritize results
            const combinedResults = [...airportResults, ...placesResults];
            const finalResults = combinedResults.slice(0, this.config.maxSuggestions);
            
            this.showSuggestions(inputId, finalResults);
            this.lastResults.set(inputId, finalResults);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showFallbackSuggestions(inputId, query);
        }
    }
    
    /**
     * Search airports by code or name
     */
    searchAirports(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        Object.entries(this.config.airports).forEach(([code, info]) => {
            const codeMatch = code.toLowerCase().includes(searchTerm);
            const nameMatch = info.name.toLowerCase().includes(searchTerm);
            const fullText = `${info.name} (${code})`;
            
            if (codeMatch || nameMatch) {
                results.push({
                    description: fullText,
                    place_id: `airport_${code}`,
                    type: 'airport',
                    airportCode: code,
                    airportInfo: info,
                    structured_formatting: {
                        main_text: info.name,
                        secondary_text: `Aeroporto ${code}`
                    }
                });
            }
        });
        
        return results;
    }
    
    /**
     * Search Google Places
     */
    searchGooglePlaces(query) {
  return new Promise((resolve) => {
    if (!this.autocompleteService || !query) {
      resolve([]);
      return;
    }

    const request = {
      input: query,
      componentRestrictions: { country: 'it' }, // limita all’Italia
      // types: ['geocode'], // opzionale: solo indirizzi postali
    };

    this.autocompleteService.getPlacePredictions(
      request,
      (predictions, status) => {
        if (status === google.maps.places.this.placesService.OK && predictions?.length) {
          const results = predictions.map(p => ({
            description: p.description,
            place_id: p.place_id,
            type: 'place',
            structured_formatting: p.structured_formatting || {
              main_text: p.description,
              secondary_text: ''
            }
          }));
          resolve(results);
        } else {
          resolve([]);
        }
      }
    );
  });
}

    
    /**
     * Show suggestions dropdown
     */
    showSuggestions(inputId, suggestions) {
        const config = this.activeInputs.get(inputId);
        if (!config || !suggestions.length) {
            this.hideSuggestions(inputId);
            return;
        }
        
        const html = suggestions.map((suggestion, index) => {
            const iconClass = suggestion.type === 'airport' ? 
                'fas fa-plane text-blue-500' : 
                'fas fa-map-marker-alt text-gray-500';
                
            return `
                <div class="suggestion-item p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                     onclick="autocomplete.selectSuggestion('${inputId}', ${index})">
                    <div class="flex items-center">
                        <i class="${iconClass} mr-3 w-4"></i>
                        <div class="flex-1">
                            <div class="font-medium text-gray-800">
                                ${suggestion.structured_formatting.main_text}
                            </div>
                            <div class="text-sm text-gray-500">
                                ${suggestion.structured_formatting.secondary_text || ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        config.suggestions.innerHTML = html;
        config.suggestions.classList.remove('hidden');
        config.suggestions.style.display = 'block';
    }
    
    /**
     * Hide suggestions dropdown
     */
    hideSuggestions(inputId) {
        const config = this.activeInputs.get(inputId);
        if (!config) return;
        
        config.suggestions.classList.add('hidden');
        config.suggestions.style.display = 'none';
    }
    
    /**
     * Select a suggestion
     */
    selectSuggestion(inputId, index) {
        const config = this.activeInputs.get(inputId);
        const results = this.lastResults.get(inputId);
        
        if (!config || !results || !results[index]) return;
        
        const selected = results[index];
        
        // Update input value
        config.input.value = selected.structured_formatting.main_text;
        config.selectedPlace = selected;
        
        // Hide suggestions
        this.hideSuggestions(inputId);
        
        // Trigger quote update if both pickup and destination are set
        setTimeout(() => {
            this.checkForQuoteUpdate();
        }, 100);
        
        console.log('Selected:', selected);
    }
    
    /**
     * Check if we should update the quote
     */
    checkForQuoteUpdate() {
        const pickup = this.activeInputs.get('pickup');
        const destination = this.activeInputs.get('destination');
        
        if (pickup?.selectedPlace && destination?.selectedPlace) {
            this.updateQuotePreview(pickup.selectedPlace, destination.selectedPlace);
        }
    }
    
    /**
     * Update quote preview
     */
    async updateQuotePreview(pickup, destination) {
        try {
            const passengers = document.getElementById('passengers')?.value || 1;
            const result = await this.calculateRoute(pickup, destination, passengers);
            
            if (result && typeof showQuoteDisplay === 'function') {
                showQuoteDisplay(result.price, result.details);
            }
        } catch (error) {
            console.error('Quote preview error:', error);
        }
    }
    
    /**
     * Calculate route and price
     */
    async calculateRoute(pickup, destination, passengers = 1) {
        try {
            // Check if either location is an airport
            const pickupAirport = pickup.type === 'airport';
            const destinationAirport = destination.type === 'airport';
            
            if (pickupAirport || destinationAirport) {
                return this.calculateAirportTransfer(pickup, destination, passengers);
            }
            
            // Calculate regular route
            return await this.calculateRegularRoute(pickup, destination, passengers);
            
        } catch (error) {
            console.error('Route calculation error:', error);
            return this.getFallbackQuote(passengers);
        }
    }
    
    /**
     * Calculate airport transfer pricing
     */
    calculateAirportTransfer(pickup, destination, passengers) {
        const airportLocation = pickup.type === 'airport' ? pickup : destination;
        const basePrice = airportLocation.airportInfo.basePrice;
        
        // Apply vehicle multiplier based on passenger count
        let vehicleMultiplier = 1.0;
        if (passengers <= 3) vehicleMultiplier = 1.0;      // Economy
        else if (passengers <= 4) vehicleMultiplier = 1.3; // Comfort
        else if (passengers <= 6) vehicleMultiplier = 1.8; // Business
        else vehicleMultiplier = 2.2;                       // Van
        
        const finalPrice = Math.round(basePrice * vehicleMultiplier);
        
        return {
            price: finalPrice,
            details: `Trasferimento aeroportuale ${airportLocation.airportInfo.name}`,
            type: 'airport_transfer',
            distance: null,
            duration: null
        };
    }
    
    /**
     * Calculate regular route using Google Directions
     */
    calculateRegularRoute(pickup, destination, passengers) {
        return new Promise((resolve, reject) => {
            if (!this.directionsService) {
                reject(new Error('Directions service not available'));
                return;
            }
            
            const request = {
                origin: { placeId: pickup.place_id },
                destination: { placeId: destination.place_id },
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false
            };
            
            this.directionsService.route(request, (result, status) => {
                if (status === 'OK' && result.routes.length > 0) {
                    const route = result.routes[0].legs[0];
                    const distanceKm = route.distance.value / 1000;
                    const durationMin = Math.round(route.duration.value / 60);
                    
                    // Calculate price based on distance
                    let basePrice = Math.max(
                        this.config.minimumPrice,
                        distanceKm * this.config.basePricePerKm
                    );
                    
                    // Apply vehicle multiplier
                    let vehicleMultiplier = 1.0;
                    if (passengers <= 3) vehicleMultiplier = 1.0;
                    else if (passengers <= 4) vehicleMultiplier = 1.3;
                    else if (passengers <= 6) vehicleMultiplier = 1.8;
                    else vehicleMultiplier = 2.2;
                    
                    const finalPrice = Math.round(basePrice * vehicleMultiplier);
                    
                    resolve({
                        price: finalPrice,
                        details: `${distanceKm.toFixed(1)}km, ${durationMin} min`,
                        type: 'regular_route',
                        distance: distanceKm,
                        duration: durationMin,
                        route: result
                    });
                } else {
                    reject(new Error(`Route calculation failed: ${status}`));
                }
            });
        });
    }
    
    /**
     * Get fallback quote when APIs fail
     */
    getFallbackQuote(passengers) {
        let basePrice = 35;
        if (passengers <= 3) basePrice = 35;
        else if (passengers <= 4) basePrice = 45;
        else if (passengers <= 6) basePrice = 65;
        else basePrice = 85;
        
        const finalPrice = Math.round(basePrice * (1 + Math.random() * 0.3));
        
        return {
            price: finalPrice,
            details: 'Stima approssimativa',
            type: 'fallback',
            distance: null,
            duration: null
        };
    }
    
    /**
     * Get quick quote for preview
     */
    async getQuickQuote(pickupText, destinationText, passengers) {
        try {
            // Try to find existing selections
            const pickup = this.activeInputs.get('pickup')?.selectedPlace;
            const destination = this.activeInputs.get('destination')?.selectedPlace;
            
            if (pickup && destination) {
                return await this.calculateRoute(pickup, destination, passengers);
            }
            
            // Fallback to text-based estimation
            return this.getFallbackQuote(passengers);
            
        } catch (error) {
            console.error('Quick quote error:', error);
            return this.getFallbackQuote(passengers);
        }
    }
    
    /**
     * Calculate full quote with all stops
     */
    async calculateFullQuote(quoteData) {
        try {
            const pickup = this.activeInputs.get('pickup')?.selectedPlace;
            const destination = this.activeInputs.get('destination')?.selectedPlace;
            
            if (!pickup || !destination) {
                throw new Error('Missing pickup or destination');
            }
            
            // Calculate main route
            const mainRoute = await this.calculateRoute(
                pickup, 
                destination, 
                quoteData.passengers
            );
            
            // Generate vehicle options
            const vehicles = this.generateVehicleOptions(
                mainRoute.price, 
                quoteData.passengers
            );
            
            return {
                estimatedPrice: mainRoute.price,
                vehicles: vehicles,
                route: {
                    pickup: quoteData.pickup,
                    destination: quoteData.destination,
                    stops: quoteData.stops || []
                },
                details: mainRoute.details,
                type: mainRoute.type
            };
            
        } catch (error) {
            console.error('Full quote calculation error:', error);
            return null;
        }
    }
    
    /**
     * Generate vehicle options based on base price
     */
    generateVehicleOptions(basePrice, passengers) {
        const vehicles = [
            {
                type: 'Economy',
                price: Math.round(basePrice * this.config.vehicleMultipliers.economy),
                capacity: '1-3 passeggeri',
                features: ['Aria condizionata', 'WiFi gratuito'],
                available: passengers <= 3
            },
            {
                type: 'Comfort',
                price: Math.round(basePrice * this.config.vehicleMultipliers.comfort),
                capacity: '1-4 passeggeri',
                features: ['Sedili in pelle', 'Acqua gratuita', 'WiFi gratuito'],
                available: passengers <= 4
            },
            {
                type: 'Business',
                price: Math.round(basePrice * this.config.vehicleMultipliers.business),
                capacity: '1-3 passeggeri',
                features: ['Veicolo di lusso', 'Giornali', 'Bevande', 'WiFi Premium'],
                available: passengers <= 3
            },
            {
                type: 'Van',
                price: Math.round(basePrice * this.config.vehicleMultipliers.van),
                capacity: '5-8 passeggeri',
                features: ['Spazio bagagli XL', 'Sedili reclinabili', 'WiFi gratuito'],
                available: passengers >= 5
            }
        ];
        
        return vehicles.filter(v => v.available);
    }
    
    /**
     * Show fallback suggestions when API fails
     */
    showFallbackSuggestions(inputId, query) {
        const suggestions = [
            {
                description: `Cerca "${query}" su mappa`,
                place_id: `fallback_${Date.now()}`,
                type: 'fallback',
                structured_formatting: {
                    main_text: query,
                    secondary_text: 'Ricerca generale'
                }
            }
        ];
        
        this.showSuggestions(inputId, suggestions);
        this.lastResults.set(inputId, suggestions);
    }
    
    /**
     * Handle fallback mode when Google Maps fails
     */
    handleFallback() {
        console.warn('Operating in fallback mode - limited functionality');
        
        // Initialize basic input handlers without Google Maps
        const inputs = ['pickup', 'destination'];
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => {
                    // Simple validation
                    if (input.value.length > 2) {
                        console.log(`Input updated: ${inputId} = ${input.value}`);
                    }
                });
            }
        });
    }
    
    /**
     * Cleanup method
     */
    destroy() {
        // Clear all timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        // Clear maps
        this.activeInputs.clear();
        this.lastResults.clear();
        
        console.log('NexaRide Autocomplete destroyed');
    }
}

// Export for global use
window.NexaRideAutocomplete = NexaRideAutocomplete;

// CSS Styles for autocomplete
const autocompleteCss = `
    .autocomplete-suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-top: none;
        border-radius: 0 0 0.5rem 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        max-height: 300px;
        overflow-y: auto;
        display: none;
    }
    
    .autocomplete-suggestions.show {
        display: block;
    }
    
    .suggestion-item:hover {
        background-color: #eff6ff;
    }
    
    .suggestion-item:last-child {
        border-bottom: none;
    }
    
    /* Loading state for inputs */
    .autocomplete-loading {
        background-image: url("data:image/svg+xml,%3csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M10 3V6M10 14V17M17 10H14M6 10H3M15.364 4.636L13.95 6.05M6.05 13.95L4.636 15.364M15.364 15.364L13.95 13.95M6.05 6.05L4.636 4.636' stroke='%236B7280' stroke-width='2' stroke-linecap='round'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px 16px;
    }
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = autocompleteCss;
document.head.appendChild(style);

console.log('NexaRide Autocomplete module loaded');
