"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Check, 
  Wifi,
  Tv,
  Bath,
  Coffee,
  Wind,
  Shield,
  Utensils,
  Waves,
  CheckCircle,
  Hotel,
  Globe,
  Phone,
  ArrowLeft,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from "lucide-react";

interface RoomType {
  id: string;
  name: string;
  description: string;
  maxGuests: number;
  price: number;
  currency: string;
  images: string[];
  amenities: string[];
  available: boolean;
  minNights: number;
  maxNights: number;
  size: string;
  bedType: string;
  view: string;
  smoking: boolean;
  petFriendly: boolean;
}

interface BookingForm {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  city: string;
  postalCode: string;
  specialRequests: string;
  paymentMethod: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
  agreeToTerms: boolean;
  newsletter: boolean;
}

interface BookingConfirmation {
  id: string;
  bookingNumber: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string;
  totalPrice: number;
  currency: string;
  guestName: string;
  guestEmail: string;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: string;
}

export default function BookPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState<BookingConfirmation | null>(null);

  // Multi-language support
  const translations = {
    en: {
      title: "Book Your Stay",
      subtitle: "Experience the perfect blend of comfort and luxury",
      checkIn: "Check-in",
      checkOut: "Check-out",
      guests: "Guests",
      selectDates: "Select your dates",
      selectRoom: "Choose your room",
      guestInfo: "Guest Information",
      payment: "Payment Details",
      confirmation: "Booking Confirmation",
      available: "Available",
      unavailable: "Unavailable",
      perNight: "per night",
      total: "Total",
      bookNow: "Book Now",
      next: "Next",
      previous: "Previous",
      confirm: "Confirm Booking",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone",
      address: "Address",
      city: "City",
      country: "Country",
      postalCode: "Postal Code",
      specialRequests: "Special Requests",
      paymentMethod: "Payment Method",
      cardNumber: "Card Number",
      cardExpiry: "Expiry Date",
      cardCvc: "CVC",
      cardName: "Name on Card",
      agreeToTerms: "I agree to the terms and conditions",
      newsletter: "Send me special offers",
      amenities: "Amenities",
      roomSize: "Room Size",
      bedType: "Bed Type",
      view: "View",
      smoking: "Smoking",
      petFriendly: "Pet Friendly",
      maxGuests: "Max Guests",
      minNights: "Minimum Nights",
      contact: "Contact Us",
      about: "About Us",
      facilities: "Facilities",
      reviews: "Reviews"
    },
    sl: {
      title: "Rezervirajte bivanje",
      subtitle: "Izkusite popolno mešanico udobja in luksuza",
      checkIn: "Prihod",
      checkOut: "Odhod",
      guests: "Gostje",
      selectDates: "Izberite datume",
      selectRoom: "Izberite sobo",
      guestInfo: "Podatki o gostu",
      payment: "Podatki o plačilu",
      confirmation: "Potrditev rezervacije",
      available: "Na voljo",
      unavailable: "Zasedeno",
      perNight: "na noč",
      total: "Skupaj",
      bookNow: "Rezerviraj zdaj",
      next: "Naslednji",
      previous: "Prejšnji",
      confirm: "Potrdi rezervacijo",
      firstName: "Ime",
      lastName: "Priimek",
      email: "E-pošta",
      phone: "Telefon",
      address: "Naslov",
      city: "Mesto",
      country: "Država",
      postalCode: "Poštna številka",
      specialRequests: "Posebne zahteve",
      paymentMethod: "Način plačila",
      cardNumber: "Številka kartice",
      cardExpiry: "Datum poteka",
      cardCvc: "CVC",
      cardName: "Ime na kartici",
      agreeToTerms: "Strinjam se s pogoji in določili",
      newsletter: "Pošlji mi posebne ponudbe",
      amenities: "Oprema",
      roomSize: "Velikost sobe",
      bedType: "Vrsta postelje",
      view: "Razgled",
      smoking: "Kajenje",
      petFriendly: "Dobrodošli hišni ljubljenci",
      maxGuests: "Največ gostov",
      minNights: "Najmanj noči",
      contact: "Kontaktirajte nas",
      about: "O nas",
      facilities: "Storitve",
      reviews: "Mnenja"
    },
    de: {
      title: "Ihren Aufenthalt buchen",
      subtitle: "Erleben Sie die perfekte Mischung aus Komfort und Luxus",
      checkIn: "Anreise",
      checkOut: "Abreise",
      guests: "Gäste",
      selectDates: "Wählen Sie Ihre Daten",
      selectRoom: "Wählen Sie Ihr Zimmer",
      guestInfo: "Gästeinformationen",
      payment: "Zahlungsdetails",
      confirmation: "Buchungsbestätigung",
      available: "Verfügbar",
      unavailable: "Nicht verfügbar",
      perNight: "pro Nacht",
      total: "Gesamt",
      bookNow: "Jetzt buchen",
      next: "Weiter",
      previous: "Zurück",
      confirm: "Buchung bestätigen",
      firstName: "Vorname",
      lastName: "Nachname",
      email: "E-Mail",
      phone: "Telefon",
      address: "Adresse",
      city: "Stadt",
      country: "Land",
      postalCode: "Postleitzahl",
      specialRequests: "Besondere Wünsche",
      paymentMethod: "Zahlungsmethode",
      cardNumber: "Kartennummer",
      cardExpiry: "Verfallsdatum",
      cardCvc: "CVC",
      cardName: "Karteninhaber",
      agreeToTerms: "Ich stimme den Geschäftsbedingungen zu",
      newsletter: "Senden Sie mir spezielle Angebote",
      amenities: "Ausstattung",
      roomSize: "Zimmergröße",
      bedType: "Bettenart",
      view: "Aussicht",
      smoking: "Rauchen",
      petFriendly: "Haustiere willkommen",
      maxGuests: "Max. Gäste",
      minNights: "Min. Nächte",
      contact: "Kontaktieren Sie uns",
      about: "Über uns",
      facilities: "Einrichtungen",
      reviews: "Bewertungen"
    },
    it: {
      title: "Prenota il tuo soggiorno",
      subtitle: "Sperimenta il perfetto mix di comfort e lusso",
      checkIn: "Check-in",
      checkOut: "Check-out",
      guests: "Ospiti",
      selectDates: "Seleziona le date",
      selectRoom: "Scegli la tua camera",
      guestInfo: "Informazioni ospite",
      payment: "Dettagli pagamento",
      confirmation: "Conferma prenotazione",
      available: "Disponibile",
      unavailable: "Non disponibile",
      perNight: "a notte",
      total: "Totale",
      bookNow: "Prenota ora",
      next: "Avanti",
      previous: "Indietro",
      confirm: "Conferma prenotazione",
      firstName: "Nome",
      lastName: "Cognome",
      email: "Email",
      phone: "Telefono",
      address: "Indirizzo",
      city: "Città",
      country: "Paese",
      postalCode: "Codice postale",
      specialRequests: "Richieste speciali",
      paymentMethod: "Metodo di pagamento",
      cardNumber: "Numero carta",
      cardExpiry: "Data scadenza",
      cardCvc: "CVC",
      cardName: "Nome sulla carta",
      agreeToTerms: "Accetto i termini e le condizioni",
      newsletter: "Inviami offerte speciali",
      amenities: "Servizi",
      roomSize: "Dimensioni camera",
      bedType: "Tipo di letto",
      view: "Vista",
      smoking: "Fumatori",
      petFriendly: "Animali ammessi",
      maxGuests: "Max ospiti",
      minNights: "Min. notti",
      contact: "Contattaci",
      about: "Chi siamo",
      facilities: "Servizi",
      reviews: "Recensioni"
    },
    hr: {
      title: "Rezervirajte svoj boravak",
      subtitle: "Doživite savršenu mješavinu udobnosti i luksuza",
      checkIn: "Prijava",
      checkOut: "Odjava",
      guests: "Gosti",
      selectDates: "Odaberite datume",
      selectRoom: "Odaberite sobu",
      guestInfo: "Informacije o gostu",
      payment: "Podatki o plaćanju",
      confirmation: "Potvrda rezervacije",
      available: "Dostupno",
      unavailable: "Zauzeto",
      perNight: "po noći",
      total: "Ukupno",
      bookNow: "Rezervirajte sada",
      next: "Sljedeći",
      previous: "Prethodni",
      confirm: "Potvrdite rezervaciju",
      firstName: "Ime",
      lastName: "Prezime",
      email: "E-pošta",
      phone: "Telefon",
      address: "Adresa",
      city: "Grad",
      country: "Država",
      postalCode: "Poštanski broj",
      specialRequests: "Posebni zahtjevi",
      paymentMethod: "Način plaćanja",
      cardNumber: "Broj kartice",
      cardExpiry: "Datum isteka",
      cardCvc: "CVC",
      cardName: "Ime na kartici",
      agreeToTerms: "Prihvaćam uvjete i odredbe",
      newsletter: "Pošaljite mi posebne ponude",
      amenities: "Pogodnosti",
      roomSize: "Veličina sobe",
      bedType: "Vrsta kreveta",
      view: "Pogled",
      smoking: "Pušenje",
      petFriendly: "Ljubimci dobrodošli",
      maxGuests: "Max gostiju",
      minNights: "Min. noći",
      contact: "Kontaktirajte nas",
      about: "O nama",
      facilities: "Pogodnosti",
      reviews: "Recenzije"
    }
  };

  const t = translations[selectedLanguage as keyof typeof translations];

  // Mock room types
  const [roomTypes] = useState<RoomType[]>([
    {
      id: "standard",
      name: selectedLanguage === "en" ? "Standard Room" : 
            selectedLanguage === "sl" ? "Standardna soba" :
            selectedLanguage === "de" ? "Standardzimmer" :
            selectedLanguage === "it" ? "Camera Standard" :
            selectedLanguage === "hr" ? "Standardna soba" : "Standard Room",
      description: selectedLanguage === "en" ? "Comfortable room with modern amenities" :
                   selectedLanguage === "sl" ? "Udobna soba s sodobno opremo" :
                   selectedLanguage === "de" ? "Bequemes Zimmer mit modernen Annehmlichkeiten" :
                   selectedLanguage === "it" ? "Camera confortevole con servizi moderni" :
                   selectedLanguage === "hr" ? "Udobna soba s modernim sadržajem" : "Comfortable room with modern amenities",
      maxGuests: 2,
      price: 89,
      currency: "EUR",
      images: ["/room1.jpg", "/room1-2.jpg", "/room1-3.jpg"],
      amenities: ["wifi", "tv", "bath", "coffee", "minibar"],
      available: true,
      minNights: 1,
      maxNights: 30,
      size: "25m²",
      bedType: "Queen Bed",
      view: "Garden View",
      smoking: false,
      petFriendly: false
    },
    {
      id: "deluxe",
      name: selectedLanguage === "en" ? "Deluxe Room" : 
            selectedLanguage === "sl" ? "Luksuzna soba" :
            selectedLanguage === "de" ? "Deluxe-Zimmer" :
            selectedLanguage === "it" ? "Camera Deluxe" :
            selectedLanguage === "hr" ? "Deluxe soba" : "Deluxe Room",
      description: selectedLanguage === "en" ? "Spacious room with premium amenities" :
                   selectedLanguage === "sl" ? "Prostrana soba s premium opremo" :
                   selectedLanguage === "de" ? "Geräumiges Zimmer mit Premium-Annehmlichkeiten" :
                   selectedLanguage === "it" ? "Camera spaziosa con servizi premium" :
                   selectedLanguage === "hr" ? "Prostrana soba s premium sadržajem" : "Spacious room with premium amenities",
      maxGuests: 3,
      price: 129,
      currency: "EUR",
      images: ["/room2.jpg", "/room2-2.jpg", "/room2-3.jpg"],
      amenities: ["wifi", "tv", "bath", "coffee", "minibar", "balcony", "safe"],
      available: true,
      minNights: 1,
      maxNights: 30,
      size: "35m²",
      bedType: "King Bed",
      view: "Mountain View",
      smoking: false,
      petFriendly: true
    },
    {
      id: "suite",
      name: selectedLanguage === "en" ? "Executive Suite" : 
            selectedLanguage === "sl" ? "Executive apartma" :
            selectedLanguage === "de" ? "Executive Suite" :
            selectedLanguage === "it" ? "Suite Executive" :
            selectedLanguage === "hr" ? "Executive suite" : "Executive Suite",
      description: selectedLanguage === "en" ? "Luxury suite with separate living area" :
                   selectedLanguage === "sl" ? "Luksuzno apartma s ločenim dnevnim prostorom" :
                   selectedLanguage === "de" ? "Luxus-Suite mit separatem Wohnbereich" :
                   selectedLanguage === "it" ? "Suite di lusso con soggiorno separato" :
                   selectedLanguage === "hr" ? "Luksuzni suite sa odvojenim dnevnim boravkom" : "Luxury suite with separate living area",
      maxGuests: 4,
      price: 189,
      currency: "EUR",
      images: ["/room3.jpg", "/room3-2.jpg", "/room3-3.jpg"],
      amenities: ["wifi", "tv", "bath", "coffee", "minibar", "balcony", "safe", "kitchenette", "jacuzzi"],
      available: true,
      minNights: 2,
      maxNights: 30,
      size: "55m²",
      bedType: "King Bed + Sofa Bed",
      view: "Panoramic View",
      smoking: false,
      petFriendly: true
    }
  ]);

  const [bookingForm, setBookingForm] = useState<BookingForm>({
    checkIn: "",
    checkOut: "",
    guests: 1,
    roomType: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    address: "",
    city: "",
    postalCode: "",
    specialRequests: "",
    paymentMethod: "credit_card",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    cardName: "",
    agreeToTerms: false,
    newsletter: false
  });

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "wifi": return <Wifi className="w-4 h-4" />;
      case "tv": return <Tv className="w-4 h-4" />;
      case "bath": return <Bath className="w-4 h-4" />;
      case "coffee": return <Coffee className="w-4 h-4" />;
      case "minibar": return <Coffee className="w-4 h-4" />;
      case "balcony": return <Wind className="w-4 h-4" />;
      case "safe": return <Shield className="w-4 h-4" />;
      case "kitchenette": return <Utensils className="w-4 h-4" />;
      case "jacuzzi": return <Waves className="w-4 h-4" />;
      default: return <Check className="w-4 h-4" />;
    }
  };

  const calculateTotalPrice = () => {
    if (!bookingForm.checkIn || !bookingForm.checkOut || !bookingForm.roomType) return 0;
    
    const checkIn = new Date(bookingForm.checkIn);
    const checkOut = new Date(bookingForm.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const room = roomTypes.find(r => r.id === bookingForm.roomType);
    return room ? nights * room.price : 0;
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookingSubmit = async () => {
    setLoading(true);
    
    // Simulate booking process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate booking confirmation
    const confirmation: BookingConfirmation = {
      id: `booking_${Date.now()}`,
      bookingNumber: `BK${Date.now()}`,
      checkIn: bookingForm.checkIn,
      checkOut: bookingForm.checkOut,
      guests: bookingForm.guests,
      roomType: bookingForm.roomType,
      totalPrice: calculateTotalPrice(),
      currency: "EUR",
      guestName: `${bookingForm.firstName} ${bookingForm.lastName}`,
      guestEmail: bookingForm.email,
      status: "confirmed",
      createdAt: new Date().toISOString()
    };
    
    setBookingConfirmation(confirmation);
    setBookingConfirmed(true);
    setLoading(false);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === currentStep
                ? "bg-blue-500 text-white"
                : step < currentStep
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-600"
            }`}>
              {step < currentStep ? <Check className="w-4 h-4" /> : step}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              step === currentStep ? "text-blue-600" : step < currentStep ? "text-green-600" : "text-gray-500"
            }`}>
              {step === 1 && t.selectDates}
              {step === 2 && t.selectRoom}
              {step === 3 && t.guestInfo}
              {step === 4 && t.payment}
            </span>
            {step < 4 && <div className="w-8 h-0.5 bg-gray-300 ml-4" />}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.checkIn}
          </label>
          <input
            type="date"
            value={bookingForm.checkIn}
            onChange={(e) => setBookingForm({...bookingForm, checkIn: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={new Date().toISOString().split('T')[0]}
            aria-label="Check-in date"
            title="Select your check-in date"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.checkOut}
          </label>
          <input
            type="date"
            value={bookingForm.checkOut}
            onChange={(e) => setBookingForm({...bookingForm, checkOut: e.target.value})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
            aria-label="Check-out date"
            title="Select your check-out date"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.guests}
        </label>
        <select
          value={bookingForm.guests}
          onChange={(e) => setBookingForm({...bookingForm, guests: parseInt(e.target.value)})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Number of guests"
          title="Select number of guests"
        >
          {[1, 2, 3, 4, 5, 6].map(num => (
            <option key={num} value={num}>
              {num} {num === 1 ? "Guest" : "Guests"}
            </option>
          ))}
        </select>
      </div>

      {bookingForm.checkIn && bookingForm.checkOut && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            {selectedLanguage === "en" ? `Selected: ${new Date(bookingForm.checkIn).toLocaleDateString()} - ${new Date(bookingForm.checkOut).toLocaleDateString()}` :
             selectedLanguage === "sl" ? `Izbrano: ${new Date(bookingForm.checkIn).toLocaleDateString()} - ${new Date(bookingForm.checkOut).toLocaleDateString()}` :
             selectedLanguage === "de" ? `Ausgewählt: ${new Date(bookingForm.checkIn).toLocaleDateString()} - ${new Date(bookingForm.checkOut).toLocaleDateString()}` :
             selectedLanguage === "it" ? `Selezionato: ${new Date(bookingForm.checkIn).toLocaleDateString()} - ${new Date(bookingForm.checkOut).toLocaleDateString()}` :
             selectedLanguage === "hr" ? `Odabrano: ${new Date(bookingForm.checkIn).toLocaleDateString()} - ${new Date(bookingForm.checkOut).toLocaleDateString()}` :
             `Selected: ${new Date(bookingForm.checkIn).toLocaleDateString()} - ${new Date(bookingForm.checkOut).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roomTypes.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="relative">
                <Image
                  src={room.images[0]}
                  alt={room.name}
                  width={400}
                  height={192}
                  className="w-full h-48 object-cover"
                />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  room.available 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {room.available ? t.available : t.unavailable}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{room.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{room.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t.maxGuests}:</span>
                  <span className="font-medium">{room.maxGuests}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t.roomSize}:</span>
                  <span className="font-medium">{room.size}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{t.bedType}:</span>
                  <span className="font-medium">{room.bedType}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {room.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center text-xs text-gray-600">
                    {getAmenityIcon(amenity)}
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900">€{room.price}</span>
                  <span className="text-sm text-gray-500">/{t.perNight}</span>
                </div>
                <button
                  onClick={() => setBookingForm({...bookingForm, roomType: room.id})}
                  disabled={!room.available}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    bookingForm.roomType === room.id
                      ? "bg-blue-500 text-white"
                      : room.available
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {bookingForm.roomType === room.id ? "Selected" : t.bookNow}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t.guestInfo}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.firstName}
                </label>
                <input
                  type="text"
                  value={bookingForm.firstName}
                  onChange={(e) => setBookingForm({...bookingForm, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.firstName}
                  aria-label="First name"
                  title="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.lastName}
                </label>
                <input
                  type="text"
                  value={bookingForm.lastName}
                  onChange={(e) => setBookingForm({...bookingForm, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.lastName}
                  aria-label="Last name"
                  title="Enter your last name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.email}
              </label>
              <input
                type="email"
                value={bookingForm.email}
                onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.email}
                aria-label="Email address"
                title="Enter your email address"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.phone}
              </label>
              <input
                type="tel"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.phone}
                aria-label="Phone number"
                title="Enter your phone number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.address}
              </label>
              <input
                type="text"
                value={bookingForm.address}
                onChange={(e) => setBookingForm({...bookingForm, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t.address}
                aria-label="Address"
                title="Enter your address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.city}
                </label>
                <input
                  type="text"
                  value={bookingForm.city}
                  onChange={(e) => setBookingForm({...bookingForm, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.city}
                  aria-label="City"
                  title="Enter your city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.postalCode}
                </label>
                <input
                  type="text"
                  value={bookingForm.postalCode}
                  onChange={(e) => setBookingForm({...bookingForm, postalCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t.postalCode}
                  aria-label="Postal code"
                  title="Enter your postal code"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.specialRequests}
              </label>
              <textarea
                value={bookingForm.specialRequests}
                onChange={(e) => setBookingForm({...bookingForm, specialRequests: e.target.value})}
                rows={3}
                placeholder={t.specialRequests}
                aria-label="Special requests"
                title="Enter any special requests"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-medium">{new Date(bookingForm.checkIn).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-medium">{new Date(bookingForm.checkOut).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Guests:</span>
              <span className="font-medium">{bookingForm.guests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Room Type:</span>
              <span className="font-medium">{roomTypes.find(r => r.id === bookingForm.roomType)?.name}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-semibold">€{calculateTotalPrice()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t.payment}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.cardNumber}
              </label>
              <input
                type="text"
                value={bookingForm.cardNumber}
                onChange={(e) => setBookingForm({...bookingForm, cardNumber: e.target.value})}
                placeholder="1234 5678 9012 3456"
                aria-label="Card number"
                title="Enter your card number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.cardExpiry}
                </label>
                <input
                  type="text"
                  value={bookingForm.cardExpiry}
                  onChange={(e) => setBookingForm({...bookingForm, cardExpiry: e.target.value})}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Card expiry date"
                  title="Enter card expiry date (MM/YY)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.cardCvc}
                </label>
                <input
                  type="text"
                  value={bookingForm.cardCvc}
                  onChange={(e) => setBookingForm({...bookingForm, cardCvc: e.target.value})}
                  placeholder="123"
                  aria-label="Card CVC"
                  title="Enter your card CVC code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.cardName}
              </label>
              <input
                type="text"
                value={bookingForm.cardName}
                onChange={(e) => setBookingForm({...bookingForm, cardName: e.target.value})}
                placeholder={t.cardName}
                aria-label="Cardholder name"
                title="Enter cardholder name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={bookingForm.agreeToTerms}
                  onChange={(e) => setBookingForm({...bookingForm, agreeToTerms: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{t.agreeToTerms}</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={bookingForm.newsletter}
                  onChange={(e) => setBookingForm({...bookingForm, newsletter: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{t.newsletter}</span>
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Room Rate:</span>
              <span className="font-medium">€{roomTypes.find(r => r.id === bookingForm.roomType)?.price} {t.perNight}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nights:</span>
              <span className="font-medium">
                {Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">€{calculateTotalPrice()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taxes:</span>
              <span className="font-medium">€{(calculateTotalPrice() * 0.21).toFixed(2)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-semibold">€{(calculateTotalPrice() * 1.21).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Secure Payment</p>
                <p className="text-xs text-blue-600">Your payment information is encrypted and secure.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900">
        {selectedLanguage === "en" ? "Booking Confirmed!" :
         selectedLanguage === "sl" ? "Rezervacija potrjena!" :
         selectedLanguage === "de" ? "Buchung bestätigt!" :
         selectedLanguage === "it" ? "Prenotazione confermata!" :
         selectedLanguage === "hr" ? "Rezervacija potvrđena!" : "Booking Confirmed!"}
      </h2>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
        <div className="space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-gray-600">Booking Number:</span>
            <span className="font-medium">{bookingConfirmation?.bookingNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Guest:</span>
            <span className="font-medium">{bookingConfirmation?.guestName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{bookingConfirmation?.guestEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Check-in:</span>
            <span className="font-medium">{bookingConfirmation && new Date(bookingConfirmation.checkIn).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Check-out:</span>
            <span className="font-medium">{bookingConfirmation && new Date(bookingConfirmation.checkOut).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total:</span>
            <span className="font-medium">€{bookingConfirmation?.totalPrice}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          {selectedLanguage === "en" ? "A confirmation email has been sent to your email address." :
           selectedLanguage === "sl" ? "Potrditveno e-poštno sporočilo je bilo poslano na vaš e-naslov." :
           selectedLanguage === "de" ? "Eine Bestätigungs-E-Mail wurde an Ihre E-Mail-Adresse gesendet." :
           selectedLanguage === "it" ? "Un'email di conferma è stata inviata al tuo indirizzo email." :
           selectedLanguage === "hr" ? "Potvrdni email je poslan na vašu email adresu." : "A confirmation email has been sent to your email address."}
        </p>
        
        <button
          onClick={() => {
            setBookingConfirmed(false);
            setCurrentStep(1);
            setBookingForm({
              checkIn: "",
              checkOut: "",
              guests: 1,
              roomType: "",
              firstName: "",
              lastName: "",
              email: "",
              phone: "",
              country: "",
              address: "",
              city: "",
              postalCode: "",
              specialRequests: "",
              paymentMethod: "credit_card",
              cardNumber: "",
              cardExpiry: "",
              cardCvc: "",
              cardName: "",
              agreeToTerms: false,
              newsletter: false
            });
          }}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {selectedLanguage === "en" ? "Make Another Booking" :
           selectedLanguage === "sl" ? "Naredi novo rezervacijo" :
           selectedLanguage === "de" ? "Weitere Buchung vornehmen" :
           selectedLanguage === "it" ? "Fai un'altra prenotazione" :
           selectedLanguage === "hr" ? "Napravi još jednu rezervaciju" : "Make Another Booking"}
        </button>
      </div>
    </div>
  );

  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {renderConfirmation()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Hotel className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hotel Alpina</h1>
                <p className="text-sm text-gray-500">{t.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Select language"
                  title="Select your preferred language"
                >
                  <option value="en">English</option>
                  <option value="sl">Slovenščina</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="hr">Hrvatski</option>
                </select>
                <Globe className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              
              <button 
                aria-label="Call hotel"
                title="Call hotel at +386 1 234 5678"
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden md:inline">+386 1 234 5678</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-lg text-gray-600">{t.subtitle}</p>
        </div>

        {renderStepIndicator()}

        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
              aria-label="Previous step"
              title="Go to previous step"
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.previous}</span>
            </button>

            {currentStep === 4 ? (
              <button
                onClick={handleBookingSubmit}
                disabled={loading || !bookingForm.agreeToTerms}
                aria-label="Confirm booking"
                title="Submit your booking"
                className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{t.confirm}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                disabled={
                  (currentStep === 1 && (!bookingForm.checkIn || !bookingForm.checkOut)) ||
                  (currentStep === 2 && !bookingForm.roomType) ||
                  (currentStep === 3 && (!bookingForm.firstName || !bookingForm.lastName || !bookingForm.email))
                }
                aria-label="Next step"
                title="Go to next step"
                className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{t.next}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Hotel className="w-6 h-6" />
                <span className="text-lg font-bold">Hotel Alpina</span>
              </div>
              <p className="text-gray-400 text-sm">
                {selectedLanguage === "en" ? "Experience luxury and comfort in the heart of the Alps." :
                 selectedLanguage === "sl" ? "Doživite luksuz in udobje v srcu Alp." :
                 selectedLanguage === "de" ? "Erleben Sie Luxus und Komfort im Herzen der Alpen." :
                 selectedLanguage === "it" ? "Sperimentate lusso e comfort nel cuore delle Alpi." :
                 selectedLanguage === "hr" ? "Doživite luksuz i udobnost u srcu Alpa." : "Experience luxury and comfort in the heart of the Alps."}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">{t.contact}</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <p>Cankarjeva ulica 5</p>
                <p>1000 Ljubljana, Slovenia</p>
                <p>+386 1 234 5678</p>
                <p>info@hotel-alpina.si</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">{t.facilities}</h3>
              <div className="space-y-2 text-gray-400 text-sm">
                <p>{selectedLanguage === "en" ? "Free WiFi" : selectedLanguage === "sl" ? "Brezplačen WiFi" : "Free WiFi"}</p>
                <p>{selectedLanguage === "en" ? "Restaurant & Bar" : selectedLanguage === "sl" ? "Restavracija & Bar" : "Restaurant & Bar"}</p>
                <p>{selectedLanguage === "en" ? "Spa & Wellness" : selectedLanguage === "sl" ? "Spa & Wellness" : "Spa & Wellness"}</p>
                <p>{selectedLanguage === "en" ? "Conference Rooms" : selectedLanguage === "sl" ? "Konferenčne sobe" : "Conference Rooms"}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <button 
                  aria-label="Facebook"
                  title="Follow us on Facebook"
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <Facebook className="w-5 h-5" />
                </button>
                <button 
                  aria-label="Twitter"
                  title="Follow us on Twitter"
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button 
                  aria-label="Instagram"
                  title="Follow us on Instagram"
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <Instagram className="w-5 h-5" />
                </button>
                <button 
                  aria-label="YouTube"
                  title="Follow us on YouTube"
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <Youtube className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Hotel Alpina. {selectedLanguage === "en" ? "All rights reserved." : selectedLanguage === "sl" ? "Vse pravice pridržane." : "All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
