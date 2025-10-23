/**
 * NexaRide Google Maps Autocomplete System
 * Intelligent address suggestion and route calculation system
 */
class NexaRideAutocomplete {
    constructor() {
        this.placesService = null;
        this.directionsService = null;
        this.initialized = false;
        this.activeRequests = new Map();
        this.cache = new Map();
        this.debounceTimers = new Map();
        
        this.init();
    }

    /**
     * Initialize the autocomplete system
     */
    init() {
        if (typeof google === 'undefined' || !google.maps) {
            console.log('Google Maps not loaded yet, waiting...');
            setTimeout(() => this.init(), 500);
            return;
        }

        try {
            // Initialize Google Maps services
            this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
            this.directionsService = new google.maps.DirectionsService();
            
            // Initialize autocomplete for main inputs
            this.initializeInput('pickup');
            this.initializeInput('destination');
            
            this.initialized = true;
            console.log('NexaRide Autocomplete System initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Google Maps services:', error);
        }
    }

    /**
     * Initialize autocomplete for a specific input field
     * @param {string} inputId - The ID of the input field
     */
    initializeInput(inputId) {
        const input = document.getElementById(inputId);
        if (!input) {
            console.warn(`Input field '${inputId}' not found`);
            return;
        }

        // Create suggestions container if it doesn't exist
        let suggestionsContainer = document.getElementById(`${inputId}-suggestions`);
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = `${inputId}-suggestions`;
            suggestionsContainer.className = 'absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 hidden shadow-lg max-h-60 overflow-y-auto suggestions-container';
            input.parentNode.appendChild(suggestionsContainer);
        }

        // Add event listeners
        input.addEventListener('input', (e) => this.handleInputChange(inputId, e.target.value));
        input.addEventListener('focus', (e) => {
            if (e.target.value) {
                this.handleInputChange(inputId, e.target.value);
            }
        });
        input.addEventListener('blur', (e) => {
            // Delay hiding to allow for click on suggestions
            setTimeout(() => this.hideSuggestions(inputId), 150);
        });

        console.log(`Autocomplete initialized for input: ${inputId}`);
    }

    /**
     * Handle input change with debouncing
     * @param {string} inputId - The ID of the input field
     * @param {string} query - The search query
     */
    handleInputChange(inputId, query) {
        // Clear previous timer
        if (this.debounceTimers.has(inputId)) {
            clearTimeout(this.debounceTimers.get(inputId));
        }

        // Debounce the search
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                this.searchPlaces(inputId, query);
            } else {
                this.hideSuggestions(inputId);
            }
        }, 300);

        this.debounceTimers.set(inputId, timer);
    }

    /**
     * Search for places using Google Places API
     * @param {string} inputId - The ID of the input field
     * @param {string} query - The search query
     */
    async searchPlaces(inputId, query) {
        if (!this.initialized) {
            console.log('Autocomplete not initialized yet');
            return;
        }

        // Check cache first
        const cacheKey = `${inputId}:${query.toLowerCase()}`;
        if (this.cache.has(cacheKey)) {
            this.displaySuggestions(inputId, this.cache.get(cacheKey));
            return;
        }

        // Cancel previous request for this input
        if (this.activeRequests.has(inputId)) {
            // Note: Google Places API doesn't support request cancellation
            this.activeRequests.delete(inputId);
        }

        // Show loading state
        this.showLoadingSuggestions(inputId);

        try {
            const request = {
                input: query,
                types: ['establishment', 'geocode'],
                componentRestrictions: { country: 'IT' },
                fields: ['place_id', 'name', 'formatted_address', 'types', 'geometry']
            };

            this.activeRequests.set(inputId, true);

            // Use AutocompleteService for better results
            const autocompleteService = new google.maps.places.AutocompleteService();
            
            autocompleteService.getPlacePredictions(request, (predictions, status) => {
                this.activeRequests.delete(inputId);

                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    const suggestions = this.processPredictions(predictions);
                    
                    // Cache results
                    this.cache.set(cacheKey, suggestions);
                    
                    // Clean old cache entries (keep last 50)
                    if (this.cache.size > 50) {
                        const firstKey = this.cache.keys().next().value;
                        this.cache.delete(firstKey);
                    }
                    
                    this.displaySuggestions(inputId, suggestions);
                } else {
                    console.log('Places search failed:', status);
                    this.displaySuggestions(inputId, []);
                }
            });

        } catch (error) {
            console.error('Error searching places:', error);
            this.activeRequests.delete(inputId);
            this.displaySuggestions(inputId, []);
        }
    }

    /**
     * Process Google Places predictions
     * @param {Array} predictions - Raw predictions from Google
     * @returns {Array} Processed suggestions
     */
    processPredictions(predictions) {
        return predictions.slice(0, 8).map(prediction => {
            const types = prediction.types || [];
            
            // Determine icon based on place type
            let icon = 'fas fa-map-marker-alt';
            if (types.includes('airport')) {
                icon = 'fas fa-plane';
            } else if (types.includes('train_station')) {
                icon = 'fas fa-train';
            } else if (types.includes('tourist_attraction')) {
                icon = 'fas fa-camera';
            } else if (types.includes('lodging')) {
                icon = 'fas fa-bed';
            } else if (types.includes('restaurant')) {
                icon = 'fas fa-utensils';
            }

            return {
                placeId: prediction.place_id,
                mainText: prediction.structured_formatting.main_text,
                secondaryText: prediction.structured_formatting.secondary_text || '',
                fullText: prediction.description,
                icon: icon,
                types: types
            };
        });
    }

    /**
     * Display suggestions in the UI
     * @param {string} inputId - The ID of the input field
     * @param {Array} suggestions - Array of suggestion objects
     */
    displaySuggestions(inputId, suggestions) {
        const container = document.getElementById(`${inputId}-suggestions`);
        if (!container) return;

        if (suggestions.length === 0) {
            container.innerHTML = `
                <div class="suggestion-item">
                    <i class="fas fa-info-circle suggestion-icon"></i>
                    <div class="suggestion-text">
                        <div class="suggestion-main">Nessun risultato trovato</div>
                        <div class="suggestion-secondary">Prova con un termine diverso</div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = suggestions.map(suggestion => `
                <div class="suggestion-item" onclick="nexaAutocomplete.selectSuggestion('${inputId}', '${suggestion.placeId}', '${suggestion.fullText.replace(/'/g, "\\'")}')">
                    <i class="${suggestion.icon} suggestion-icon"></i>
                    <div class="suggestion-text">
                        <div class="suggestion-main">${suggestion.mainText}</div>
                        ${suggestion.secondaryText ? `<div class="suggestion-secondary">${suggestion.secondaryText}</div>` : ''}
                    </div>
                </div>
            `).join('');
        }

        container.classList.remove('hidden');
    }

    /**
     * Show loading state in suggestions
     * @param {string} inputId - The ID of the input field
     */
    showLoadingSuggestions(inputId) {
        const container = document.getElementById(`${inputId}-suggestions`);
        if (!container) return;

        container.innerHTML = `
            <div class="suggestion-item">
                <div class="loading-spinner suggestion-icon"></div>
                <div class="suggestion-text">
                    <div class="suggestion-main">Ricerca in corso...</div>
                </div>
            </div>
        `;
        
        container.classList.remove('hidden');
    }

    /**
     * Hide suggestions container
     * @param {string} inputId - The ID of the input field
     */
    hideSuggestions(inputId) {
        const container = document.getElementById(`${inputId}-suggestions`);
        if (container) {
            container.classList.add('hidden');
        }
    }

    /**
     * Handle suggestion selection
     * @param {string} inputId - The ID of the input field
     * @param {string} placeId - The Google Place ID
     * @param {string} displayText - Text to display in the input
     */
    selectSuggestion(inputId, placeId, displayText) {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = displayText;
            input.dataset.placeId = placeId;
            
            // Trigger change event for form validation
            input.dispatchEvent(new Event('change'));
        }
        
        this.hideSuggestions(inputId);
        
        // Auto-calculate quote if both pickup and destination are selected
        setTimeout(() => {
            const pickup = document.getElementById('pickup')?.value;
            const destination = document.getElementById('destination')?.value;
            
            if (pickup && destination && typeof updateQuote === 'function') {
                updateQuote();
            }
        }, 100);
    }

    /**
     * Calculate route using Google Directions API
     * @param {string} origin - Origin address
     * @param {string} destination - Destination address
     * @param {Array} waypoints - Array of waypoint addresses
     * @returns {Promise} Route calculation result
     */
    async calculateRoute(origin, destination, waypoints = []) {
        if (!this.initialized || !this.directionsService) {
            throw new Error('Directions service not initialized');
        }

        return new Promise((resolve, reject) => {
            // Prepare waypoints for Google Directions API
            const waypointsForAPI = waypoints.map(waypoint => ({
                location: waypoint,
                stopover: true
            }));

            const request = {
                origin: origin,
                destination: destination,
                waypoints: waypointsForAPI,
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false
            };

            this.directionsService.route(request, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    const route = result.routes[0];
                    const leg = route.legs[0];
                    
                    // Calculate total distance and duration for all legs
                    let totalDistance = 0;
                    let totalDuration = 0;
                    
                    route.legs.forEach(routeLeg => {
                        totalDistance += routeLeg.distance.value;
                        totalDuration += routeLeg.duration.value;
                    });

                    // Convert to km and minutes
                    const distanceKm = Math.round(totalDistance / 1000);
                    const durationMinutes = Math.round(totalDuration / 60);

                    // Calculate estimated price
                    const estimatedPrice = this.calculatePrice(origin, destination, distanceKm, durationMinutes, waypoints.length);

                    const routeData = {
                        success: true,
                        distance: distanceKm,
                        duration: durationMinutes,
                        estimatedPrice: estimatedPrice,
                        route: route,
                        waypoints: waypoints,
                        isAirportRoute: this.isAirportRoute(origin, destination)
                    };

                    resolve(routeData);
                } else {
                    console.error('Directions request failed:', status);
                    
                    // Fallback calculation
                    const fallbackData = {
                        success: true,
                        distance: this.estimateDistance(origin, destination),
                        duration: this.estimateDuration(origin, destination),
                        estimatedPrice: this.calculateFallbackPrice(origin, destination, waypoints.length),
                        fallback: true,
                        error: status
                    };
                    
                    resolve(fallbackData);
                }
            });
        });
    }

    /**
     * Calculate price based on route data
     * @param {string} origin - Origin address
     * @param {string} destination - Destination address
     * @param {number} distanceKm - Distance in kilometers
     * @param {number} durationMinutes - Duration in minutes
     * @param {number} waypointCount - Number of waypoints
     * @returns {number} Estimated price in euros
     */
    calculatePrice(origin, destination, distanceKm, durationMinutes, waypointCount = 0) {
        // Check for airport routes first (fixed pricing)
        const airportPrice = this.getAirportPrice(origin, destination);
        if (airportPrice) {
            return airportPrice + (waypointCount * 10); // Add €10 per waypoint for airport routes
        }

        // Regular route pricing
        const baseRate = 2.8; // €2.80 per km
        const timeRate = 0.9; // €0.90 per minute
        const baseFare = 15; // Base fare €15
        const waypointFee = 8; // €8 per waypoint
        const minimumFare = 35; // Minimum €35

        const distancePrice = distanceKm * baseRate;
        const timePrice = durationMinutes * timeRate;
        const waypointPrice = waypointCount * waypointFee;
        
        const totalPrice = baseFare + distancePrice + timePrice + waypointPrice;
        
        return Math.max(Math.round(totalPrice), minimumFare);
    }

    /**
     * Get fixed airport pricing if applicable
     * @param {string} origin - Origin address
     * @param {string} destination - Destination address
     * @returns {number|null} Fixed price or null if not airport route
     */
    getAirportPrice(origin, destination) {
        const locations = [origin, destination].join(' ').toLowerCase();
        
        // Airport pricing (base Economy class pricing)
        if (locations.includes('malpensa') || locations.includes('mxp')) {
            return 110;
        }
        if (locations.includes('linate') || locations.includes('lin')) {
            return 55;
        }
        if (locations.includes('orio') || locations.includes('bergamo') || locations.includes('bgy')) {
            return 110;
        }
        
        return null;
    }

    /**
     * Check if route involves airport
     * @param {string} origin - Origin address
     * @param {string} destination - Destination address
     * @returns {boolean} True if airport route
     */
    isAirportRoute(origin, destination) {
        return this.getAirportPrice(origin, destination) !== null;
    }

    /**
     * Estimate distance for fallback calculation
     * @param {string} origin - Origin address
     * @param {string} destination - Destination address
     * @returns {number} Estimated distance in km
     */
    estimateDistance(origin, destination) {
        const locations = [origin, destination].join(' ').toLowerCase();
        
        // Airport distances
        if (locations.includes('malpensa')) return 50;
        if (locations.includes('linate')) return 12;
        if (locations.includes('orio') || locations.includes('bergamo')) return 55;
        
        // Intercity estimates
        if (locations.includes('roma')) return 580;
        if (locations.includes('firenze')) return 300;
        if (locations.includes('bologna')) return 210;
        if (locations.includes('torino')) return 140;
        
        // Default city distance
        return 25;
    }

    /**
     * Estimate duration for fallback calculation
     * @param {string} origin - Origin address
     * @param {string} destination - Destination address
     * @returns {number} Estimated duration in minutes
     */
    estimateDuration(origin, destination) {
        const distance = this.estimateDistance(origin, destination);
        
        // Airport routes (slower due to traffic)
        if (this.isAirportRoute(origin, destination)) {
            return Math.round(distance * 1.5) + 10;
        }
        
        // Highway routes (faster)
        if (distance > 100) {
            return Math.round(distance * 0.8) + 15;
        }
        
        // City routes
        return Math.round(distance * 2) + 5;
    }

    /**
     * Calculate fallback price when Google Directions fails
     * @param {string} origin - Origin address
     * @param {string} destination - Destination address
     * @param {number} waypointCount - Number of waypoints
     * @returns {number} Estimated price
     */
    calculateFallbackPrice(origin, destination, waypointCount = 0) {
        const distance = this.estimateDistance(origin, destination);
        const duration = this.estimateDuration(origin, destination);
        
        return this.calculatePrice(origin, destination, distance, duration, waypointCount);
    }
}

// Initialize when Google Maps is loaded
window.initGoogleMaps = function() {
    console.log('Google Maps API loaded, initializing NexaRide Autocomplete...');
    window.nexaAutocomplete = new NexaRideAutocomplete();
};

// Fallback initialization if Google Maps is already loaded
if (typeof google !== 'undefined' && google.maps) {
    window.nexaAutocomplete = new NexaRideAutocomplete();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NexaRideAutocomplete;
}
