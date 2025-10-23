import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// Funzione per generare l'HTML principale con API key dinamica
function getMainHTML(googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY') {
  return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexaRide - Servizio Taxi Premium</title>
    <meta name="description" content="NexaRide - Servizio taxi premium con prenotazioni online, trasferimenti aeroportuali e noleggio con conducente. Scopri le nostre tariffe competitive.">
    <meta name="keywords" content="taxi, NCC, noleggio con conducente, trasferimenti aeroportuali, prenotazioni online">
    
    <!-- Open Graph -->
    <meta property="og:title" content="NexaRide - Servizio Taxi Premium">
    <meta property="og:description" content="Servizio taxi premium con prenotazioni online e trasferimenti aeroportuali">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://nexaride.it">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/styles.css" rel="stylesheet">
    
    <!-- Google Maps API con chiave dinamica -->
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initGoogleMaps"></script>
</head>
<body class="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
    <!-- Navigation -->
    <nav class="bg-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-car text-blue-600 text-2xl"></i>
                    <span class="text-2xl font-bold text-gray-800">NexaRide</span>
                </div>
                <div class="hidden md:flex items-center space-x-8">
                    <a href="#home" class="text-gray-600 hover:text-blue-600 transition-colors">Home</a>
                    <a href="#services" class="text-gray-600 hover:text-blue-600 transition-colors">Servizi</a>
                    <a href="#pricing" class="text-gray-600 hover:text-blue-600 transition-colors">Tariffe</a>
                    <a href="#contact" class="text-gray-600 hover:text-blue-600 transition-colors">Contatti</a>
                    <button onclick="openLoginModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-user mr-2"></i>Login
                    </button>
                </div>
                <button class="md:hidden" onclick="toggleMobileMenu()">
                    <i class="fas fa-bars text-gray-600 text-xl"></i>
                </button>
            </div>
        </div>
    </nav>

    <!-- Mobile Menu -->
    <div id="mobileMenu" class="hidden md:hidden bg-white shadow-lg">
        <div class="px-4 py-2 space-y-2">
            <a href="#home" class="block text-gray-600 hover:text-blue-600 py-2">Home</a>
            <a href="#services" class="block text-gray-600 hover:text-blue-600 py-2">Servizi</a>
            <a href="#pricing" class="block text-gray-600 hover:text-blue-600 py-2">Tariffe</a>
            <a href="#contact" class="block text-gray-600 hover:text-blue-600 py-2">Contatti</a>
            <button onclick="openLoginModal()" class="w-full text-left bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <i class="fas fa-user mr-2"></i>Login
            </button>
        </div>
    </div>

    <!-- Hero Section -->
    <section id="home" class="py-20">
        <div class="max-w-7xl mx-auto px-4">
            <div class="text-center mb-12">
                <h1 class="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
                    Viaggia con <span class="text-blue-600">Stile</span>
                </h1>
                <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Servizio taxi premium con conducenti professionali, veicoli di lusso e prenotazioni online 24/7
                </p>
            </div>

            <!-- Quote Form -->
            <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
                    <i class="fas fa-calculator mr-2 text-blue-600"></i>
                    Richiedi un Preventivo
                </h2>
                
                <form id="quoteForm" class="space-y-6">
                    <!-- Pickup Location -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-map-marker-alt mr-2 text-green-600"></i>
                            Punto di Ritiro
                        </label>
                        <div class="relative">
                            <input type="text" 
                                   id="pickupLocation" 
                                   name="pickupLocation"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="Inserisci l'indirizzo di partenza"
                                   required>
                            <div id="pickupSuggestions" class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 hidden max-h-60 overflow-y-auto shadow-lg"></div>
                        </div>
                    </div>

                    <!-- Destination Location -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-flag-checkered mr-2 text-red-600"></i>
                            Destinazione
                        </label>
                        <div class="relative">
                            <input type="text" 
                                   id="destination" 
                                   name="destination"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="Inserisci la destinazione"
                                   required>
                            <div id="destinationSuggestions" class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 hidden max-h-60 overflow-y-auto shadow-lg"></div>
                        </div>
                    </div>

                    <!-- Stops -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-sm font-medium text-gray-700">
                                <i class="fas fa-route mr-2 text-yellow-600"></i>
                                Fermate Intermedie (Opzionale)
                            </label>
                            <button type="button" onclick="addStop()" class="text-blue-600 hover:text-blue-700 text-sm">
                                <i class="fas fa-plus mr-1"></i>Aggiungi Fermata
                            </button>
                        </div>
                        <div id="stopsContainer" class="space-y-3"></div>
                    </div>

                    <!-- Date and Time -->
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-calendar mr-2 text-purple-600"></i>
                                Data
                            </label>
                            <input type="date" 
                                   id="tripDate" 
                                   name="tripDate"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-clock mr-2 text-purple-600"></i>
                                Ora
                            </label>
                            <input type="time" 
                                   id="tripTime" 
                                   name="tripTime"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   required>
                        </div>
                    </div>

                    <!-- Vehicle Selection -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-4">
                            <i class="fas fa-car mr-2 text-blue-600"></i>
                            Scegli il Veicolo
                        </label>
                        <div class="grid md:grid-cols-3 gap-4" id="vehicleOptions">
                            <!-- Vehicle options will be populated by JavaScript -->
                        </div>
                    </div>

                    <!-- Quote Display -->
                    <div id="quoteDisplay" class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 hidden">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-800">Preventivo Stimato</h3>
                                <p class="text-sm text-gray-600" id="quoteDetails">Calcolo in corso...</p>
                            </div>
                            <div class="text-right">
                                <div class="text-3xl font-bold text-blue-600" id="quotePrice">€--</div>
                                <div class="text-sm text-gray-500" id="quoteDuration">-- min</div>
                            </div>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105">
                        <i class="fas fa-paper-plane mr-2"></i>
                        Richiedi Prenotazione
                    </button>
                </form>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">I Nostri Servizi</h2>
                <p class="text-xl text-gray-600">Soluzioni di trasporto per ogni esigenza</p>
            </div>
            
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                    <div class="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-plane text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Trasferimenti Aeroportuali</h3>
                    <p class="text-gray-600 mb-6">Servizio affidabile da/per tutti i principali aeroporti con monitoraggio voli in tempo reale</p>
                    <button onclick="addStopFromHomepage('aeroporto')" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Prenota Ora
                    </button>
                </div>
                
                <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                    <div class="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-building text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Transfer Aziendali</h3>
                    <p class="text-gray-600 mb-6">Soluzioni di trasporto professionali per meeting, eventi e viaggi di lavoro</p>
                    <button onclick="addStopFromHomepage('centro città')" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Prenota Ora
                    </button>
                </div>
                
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                    <div class="bg-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-heart text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Occasioni Speciali</h3>
                    <p class="text-gray-600 mb-6">Matrimoni, eventi e celebrazioni con veicoli luxury e servizio personalizzato</p>
                    <button onclick="addStopFromHomepage('location evento')" class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                        Prenota Ora
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="max-w-7xl mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Tariffe Trasparenti</h2>
                <p class="text-xl text-gray-600">Prezzi competitivi senza sorprese</p>
            </div>
            
            <div class="grid md:grid-cols-4 gap-6">
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <div class="text-center mb-4">
                        <i class="fas fa-car text-3xl text-gray-600 mb-2"></i>
                        <h3 class="font-semibold text-gray-800">Economy</h3>
                    </div>
                    <div class="space-y-2 text-sm text-gray-600">
                        <p>• 4 posti</p>
                        <p>• Bagagli standard</p>
                        <p>• WiFi gratuito</p>
                        <p class="text-blue-600 font-semibold">Da €1.20/km</p>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <div class="text-center mb-4">
                        <i class="fas fa-car text-3xl text-blue-600 mb-2"></i>
                        <h3 class="font-semibold text-gray-800">Comfort</h3>
                    </div>
                    <div class="space-y-2 text-sm text-gray-600">
                        <p>• 4 posti</p>
                        <p>• Aria condizionata</p>
                        <p>• Acqua gratuita</p>
                        <p class="text-blue-600 font-semibold">Da €1.50/km</p>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-600">
                    <div class="text-center mb-4">
                        <i class="fas fa-car text-3xl text-blue-600 mb-2"></i>
                        <h3 class="font-semibold text-gray-800">Business</h3>
                        <span class="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Popolare</span>
                    </div>
                    <div class="space-y-2 text-sm text-gray-600">
                        <p>• 4 posti premium</p>
                        <p>• Servizio premium</p>
                        <p>• Giornali inclusi</p>
                        <p class="text-blue-600 font-semibold">Da €2.00/km</p>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <div class="text-center mb-4">
                        <i class="fas fa-car text-3xl text-yellow-600 mb-2"></i>
                        <h3 class="font-semibold text-gray-800">Luxury</h3>
                    </div>
                    <div class="space-y-2 text-sm text-gray-600">
                        <p>• Veicoli di lusso</p>
                        <p>• Conducente in divisa</p>
                        <p>• Servizio VIP</p>
                        <p class="text-blue-600 font-semibold">Da €3.00/km</p>
                    </div>
                </div>
            </div>
            
            <div class="text-center mt-12">
                <p class="text-gray-600 mb-4">
                    <i class="fas fa-info-circle mr-2"></i>
                    I prezzi includono IVA. Tariffe speciali per aeroporti e corse notturne.
                </p>
                <button onclick="document.getElementById('quoteForm').scrollIntoView({behavior: 'smooth'})" 
                        class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Calcola il Tuo Preventivo
                </button>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Contattaci</h2>
                <p class="text-xl text-gray-600">Siamo sempre disponibili per te</p>
            </div>
            
            <div class="grid md:grid-cols-3 gap-8">
                <div class="text-center">
                    <div class="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-phone text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Telefono</h3>
                    <p class="text-gray-600 mb-2">Disponibile 24/7</p>
                    <a href="tel:+393123456789" class="text-blue-600 hover:text-blue-700 font-semibold">
                        +39 312 345 6789
                    </a>
                </div>
                
                <div class="text-center">
                    <div class="bg-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fab fa-whatsapp text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">WhatsApp</h3>
                    <p class="text-gray-600 mb-2">Messaggi istantanei</p>
                    <a href="https://wa.me/393123456789" class="text-green-600 hover:text-green-700 font-semibold">
                        Scrivici ora
                    </a>
                </div>
                
                <div class="text-center">
                    <div class="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-envelope text-white text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Email</h3>
                    <p class="text-gray-600 mb-2">Risposta garantita</p>
                    <a href="mailto:info@nexaride.it" class="text-red-600 hover:text-red-700 font-semibold">
                        info@nexaride.it
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12">
        <div class="max-w-7xl mx-auto px-4">
            <div class="grid md:grid-cols-4 gap-8">
                <div>
                    <div class="flex items-center space-x-2 mb-6">
                        <i class="fas fa-car text-blue-400 text-2xl"></i>
                        <span class="text-2xl font-bold">NexaRide</span>
                    </div>
                    <p class="text-gray-400">
                        Il servizio taxi premium che trasforma ogni viaggio in un'esperienza di lusso.
                    </p>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold mb-4">Servizi</h3>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white transition-colors">Trasferimenti Aeroportuali</a></li>
                        <li><a href="#" class="hover:text-white transition-colors">Transfer Aziendali</a></li>
                        <li><a href="#" class="hover:text-white transition-colors">Occasioni Speciali</a></li>
                        <li><a href="#" class="hover:text-white transition-colors">Tour Guidati</a></li>
                    </ul>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold mb-4">Informazioni</h3>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#" class="hover:text-white transition-colors">Chi Siamo</a></li>
                        <li><a href="#" class="hover:text-white transition-colors">Termini di Servizio</a></li>
                        <li><a href="#" class="hover:text-white transition-colors">Privacy Policy</a></li>
                        <li><a href="#" class="hover:text-white transition-colors">FAQ</a></li>
                    </ul>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold mb-4">Seguici</h3>
                    <div class="flex space-x-4">
                        <a href="#" class="text-gray-400 hover:text-white transition-colors">
                            <i class="fab fa-facebook text-2xl"></i>
                        </a>
                        <a href="#" class="text-gray-400 hover:text-white transition-colors">
                            <i class="fab fa-instagram text-2xl"></i>
                        </a>
                        <a href="#" class="text-gray-400 hover:text-white transition-colors">
                            <i class="fab fa-twitter text-2xl"></i>
                        </a>
                        <a href="#" class="text-gray-400 hover:text-white transition-colors">
                            <i class="fab fa-linkedin text-2xl"></i>
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2024 NexaRide. Tutti i diritti riservati.</p>
            </div>
        </div>
    </footer>

    <!-- Login Modal -->
    <div id="loginModal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Accesso Amministrazione</h2>
                <button onclick="closeLoginModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input type="text" 
                           id="username" 
                           name="username"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Inserisci username"
                           required>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input type="password" 
                           id="password" 
                           name="password"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Inserisci password"
                           required>
                </div>
                
                <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    <i class="fas fa-sign-in-alt mr-2"></i>
                    Accedi
                </button>
                
                <div class="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p><strong>Account Demo:</strong></p>
                    <p>Admin: admin / test123</p>
                    <p>Operator: operator / operator123</p>
                    <p>Demo: demo / demo123</p>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/autocomplete.js"></script>
    <script src="/static/app.js"></script>
</body>
</html>`
}

// API routes
app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from NexaRide API!' })
})

// Quote calculation endpoint
app.post('/api/calculate-quote', async (c) => {
  try {
    const body = await c.req.json()
    const { pickup, destination, stops = [], vehicle = 'comfort', date, time } = body
    
    // Basic quote calculation (replace with actual logic)
    const basePrice = 15 // Base price
    const vehicleMultipliers = {
      economy: 1.0,
      comfort: 1.2,
      business: 1.5,
      luxury: 2.0
    }
    
    // Estimate distance (this would normally use Google Maps Directions API)
    const estimatedDistance = 10 + (stops.length * 5) // km
    const pricePerKm = 1.50
    
    const distance = estimatedDistance
    const duration = Math.round(distance * 2) // rough estimate: 2 minutes per km
    const price = Math.round((basePrice + (distance * pricePerKm)) * vehicleMultipliers[vehicle])
    
    return c.json({
      price,
      distance,
      duration,
      vehicle,
      breakdown: {
        basePrice,
        distancePrice: Math.round(distance * pricePerKm),
        vehicleMultiplier: vehicleMultipliers[vehicle]
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to calculate quote' }, 500)
  }
})

// Booking endpoint
app.post('/api/booking', async (c) => {
  try {
    const body = await c.req.json()
    
    // Here you would normally save to database
    console.log('New booking received:', body)
    
    // Generate booking ID
    const bookingId = 'NXR' + Date.now().toString().slice(-6)
    
    return c.json({
      success: true,
      bookingId,
      message: 'Prenotazione ricevuta con successo! Ti contatteremo a breve.'
    })
  } catch (error) {
    return c.json({ error: 'Failed to process booking' }, 500)
  }
})

// Authentication endpoint
app.post('/api/login', async (c) => {
  try {
    const body = await c.req.json()
    const { username, password } = body
    
    // Demo authentication (replace with real authentication)
    const users = {
      'admin': { password: 'test123', role: 'admin', name: 'Amministratore' },
      'operator': { password: 'operator123', role: 'operator', name: 'Operatore' },
      'demo': { password: 'demo123', role: 'demo', name: 'Demo User' }
    }
    
    const user = users[username]
    if (user && user.password === password) {
      return c.json({
        success: true,
        user: {
          username,
          role: user.role,
          name: user.name
        },
        token: 'demo-token-' + Date.now()
      })
    } else {
      return c.json({ success: false, message: 'Credenziali non valide' }, 401)
    }
  } catch (error) {
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Default route with Google Maps API key
app.get('/', (c) => {
  const googleMapsApiKey = c.env?.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
  return c.html(getMainHTML(googleMapsApiKey))
})

export default app
