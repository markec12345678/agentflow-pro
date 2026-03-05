"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Calendar, 
  Users, 
  Bed, 
  Wifi, 
  Car, 
  Coffee, 
  Tv, 
  Bath, 
  Wind, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  CreditCard, 
  Shield, 
  Clock, 
  Heart, 
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  User,
  PhoneCall,
  Home,
  Hotel,
  Utensils,
  Waves,
  Trees,
  Mountain,
  Camera,
  Download,
  Edit,
  Trash2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  Languages,
  Euro,
  DollarSign,
  CreditCard as CreditCardIcon,
  FileText,
  Settings,
  LogOut,
  Bell,
  Menu,
  XCircle,
  Plus,
  Minus,
  RefreshCw,
  ExternalLink,
  Printer,
  Share2
} from "lucide-react";

interface BookingDetails {
  id: string;
  bookingNumber: string;
  status: "confirmed" | "pending" | "cancelled" | "checked_in" | "checked_out";
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string;
  roomNumber: string;
  totalPrice: number;
  currency: string;
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  propertyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    checkInTime: string;
    checkOutTime: string;
    amenities: string[];
  };
  paymentInfo: {
    paymentId: string;
    paymentMethod: string;
    status: string;
    amount: number;
    currency: string;
    paidAt: string;
  };
  cancellationPolicy: {
    freeCancellation: boolean;
    cancellationDeadline: string;
    cancellationFee: number;
  };
  specialRequests?: string;
  modifications: {
    canModify: boolean;
    modificationDeadline: string;
    modificationFee: number;
  };
  onlineCheckIn: {
    available: boolean;
    completed: boolean;
    checkInUrl?: string;
  };
  reviews: {
    canLeaveReview: boolean;
    reviewSubmitted: boolean;
    reviewId?: string;
  };
  invoices: {
    id: string;
    number: string;
    amount: number;
    currency: string;
    issuedAt: string;
    status: string;
    downloadUrl: string;
  }[];
}

interface SpecialRequest {
  id: string;
  type: "early_checkin" | "late_checkout" | "room_preference" | "extra_bed" | "other";
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "completed";
  submittedAt: string;
  response?: string;
  respondedAt?: string;
}

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  response?: string;
}

export default function GuestPortalPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params['booking-id'] as string;

  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showSpecialRequestModal, setShowSpecialRequestModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showOnlineCheckIn, setShowOnlineCheckIn] = useState(false);
  const [specialRequests, setSpecialRequests] = useState<SpecialRequest[]>([]);
  const [review, setReview] = useState<Review | null>(null);

  // Form states
  const [modificationForm, setModificationForm] = useState({
    newCheckIn: "",
    newCheckOut: "",
    newGuests: 1,
    reason: ""
  });

  const [specialRequestForm, setSpecialRequestForm] = useState({
    type: "other" as const,
    title: "",
    description: ""
  });

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    content: ""
  });

  useEffect(() => {
    fetchBookingDetails();
    fetchSpecialRequests();
    fetchReview();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      // In real implementation, this would fetch from API
      const mockBookingDetails: BookingDetails = {
        id: bookingId,
        bookingNumber: `BK${Date.now()}`,
        status: "confirmed",
        checkIn: "2024-03-15",
        checkOut: "2024-03-18",
        guests: 2,
        roomType: "Deluxe Room",
        roomNumber: "201",
        totalPrice: 387,
        currency: "EUR",
        guestInfo: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "+386 1 234 5678",
          address: "Main Street 123",
          city: "Ljubljana",
          country: "Slovenia",
          postalCode: "1000"
        },
        propertyInfo: {
          name: "Hotel Alpina",
          address: "Cankarjeva ulica 5, 1000 Ljubljana, Slovenia",
          phone: "+386 1 234 5678",
          email: "info@hotel-alpina.si",
          website: "https://hotel-alpina.si",
          checkInTime: "15:00",
          checkOutTime: "11:00",
          amenities: ["wifi", "tv", "bath", "coffee", "minibar", "balcony", "safe", "spa", "restaurant", "bar", "gym", "parking"]
        },
        paymentInfo: {
          paymentId: `pay_${Date.now()}`,
          paymentMethod: "credit_card",
          status: "completed",
          amount: 387,
          currency: "EUR",
          paidAt: "2024-03-01T10:30:00Z"
        },
        cancellationPolicy: {
          freeCancellation: true,
          cancellationDeadline: "2024-03-13T23:59:59Z",
          cancellationFee: 0.5
        },
        specialRequests: "Late check-in requested",
        modifications: {
          canModify: true,
          modificationDeadline: "2024-03-13T23:59:59Z",
          modificationFee: 25
        },
        onlineCheckIn: {
          available: true,
          completed: false,
          checkInUrl: `/guest/checkin/${bookingId}`
        },
        reviews: {
          canLeaveReview: false,
          reviewSubmitted: false
        },
        invoices: [
          {
            id: "inv_1",
            number: "INV-2024-001",
            amount: 387,
            currency: "EUR",
            issuedAt: "2024-03-01T10:30:00Z",
            status: "paid",
            downloadUrl: `/api/invoices/inv_1/download`
          }
        ]
      };

      setBookingDetails(mockBookingDetails);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialRequests = async () => {
    try {
      // In real implementation, this would fetch from API
      const mockRequests: SpecialRequest[] = [
        {
          id: "req_1",
          type: "late_checkout",
          title: "Late Checkout Request",
          description: "Request for late checkout until 14:00",
          status: "approved",
          submittedAt: "2024-03-10T09:00:00Z",
          response: "Late checkout approved until 14:00",
          respondedAt: "2024-03-10T11:30:00Z"
        }
      ];

      setSpecialRequests(mockRequests);
    } catch (error) {
      console.error('Error fetching special requests:', error);
    }
  };

  const fetchReview = async () => {
    try {
      // In real implementation, this would fetch from API
      // For now, we'll assume no review has been submitted
      setReview(null);
    } catch (error) {
      console.error('Error fetching review:', error);
    }
  };

  const handleModifyBooking = async () => {
    try {
      // In real implementation, this would call the API
      console.log('Modifying booking:', modificationForm);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowModificationModal(false);
      // Refresh booking details
      await fetchBookingDetails();
    } catch (error) {
      console.error('Error modifying booking:', error);
    }
  };

  const handleCancelBooking = async () => {
    try {
      // In real implementation, this would call the API
      console.log('Cancelling booking:', bookingId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowCancellationModal(false);
      // Refresh booking details
      await fetchBookingDetails();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleSubmitSpecialRequest = async () => {
    try {
      // In real implementation, this would call the API
      console.log('Submitting special request:', specialRequestForm);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowSpecialRequestModal(false);
      setSpecialRequestForm({ type: "other", title: "", description: "" });
      // Refresh special requests
      await fetchSpecialRequests();
    } catch (error) {
      console.error('Error submitting special request:', error);
    }
  };

  const handleSubmitReview = async () => {
    try {
      // In real implementation, this would call the API
      console.log('Submitting review:', reviewForm);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowReviewModal(false);
      setReviewForm({ rating: 5, title: "", content: "" });
      // Refresh review
      await fetchReview();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const handleOnlineCheckIn = async () => {
    try {
      // In real implementation, this would call the API
      console.log('Starting online check-in for booking:', bookingId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowOnlineCheckIn(true);
    } catch (error) {
      console.error('Error starting online check-in:', error);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      // In real implementation, this would download the invoice
      console.log('Downloading invoice:', invoiceId);
      
      // Simulate download
      const link = document.createElement('a');
      link.href = `/api/invoices/${invoiceId}/download`;
      link.download = `invoice-${invoiceId}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      case "checked_in": return "bg-blue-100 text-blue-800 border-blue-200";
      case "checked_out": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "wifi": return <Wifi className="w-4 h-4" />;
      case "tv": return <Tv className="w-4 h-4" />;
      case "bath": return <Bath className="w-4 h-4" />;
      case "coffee": return <Coffee className="w-4 h-4" />;
      case "minibar": return <Coffee className="w-4 h-4" />;
      case "balcony": return <Wind className="w-4 h-4" />;
      case "safe": return <Shield className="w-4 h-4" />;
      case "spa": return <Waves className="w-4 h-4" />;
      case "restaurant": return <Utensils className="w-4 h-4" />;
      case "bar": return <Coffee className="w-4 h-4" />;
      case "gym": return <Heart className="w-4 h-4" />;
      case "parking": return <Car className="w-4 h-4" />;
      default: return <Check className="w-4 h-4" />;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-4">The booking you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Return to Home
          </button>
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
                <h1 className="text-xl font-bold text-gray-900">{bookingDetails.propertyInfo.name}</h1>
                <p className="text-sm text-gray-500">Guest Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900">
                <Phone className="w-4 h-4" />
                <span className="hidden md:inline">{bookingDetails.propertyInfo.phone}</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900">
                <Mail className="w-4 h-4" />
                <span className="hidden md:inline">{bookingDetails.propertyInfo.email}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Status Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Booking #{bookingDetails.bookingNumber}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(bookingDetails.checkIn).toLocaleDateString()} - {new Date(bookingDetails.checkOut).toLocaleDateString()}
                </p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(bookingDetails.status)}`}>
                {bookingDetails.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                aria-label="Share booking details"
                title="Share booking details"
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button 
                aria-label="Print booking details"
                title="Print booking details"
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: "overview", name: "Booking Overview", icon: Calendar },
                { id: "details", name: "Details", icon: FileText },
                { id: "requests", name: "Special Requests", icon: MessageSquare },
                { id: "reviews", name: "Reviews", icon: Star },
                { id: "contact", name: "Contact", icon: Phone }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room Type:</span>
                      <span className="font-medium">{bookingDetails.roomType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room Number:</span>
                      <span className="font-medium">{bookingDetails.roomNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Guests:</span>
                      <span className="font-medium">{bookingDetails.guests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium">{new Date(bookingDetails.checkIn).toLocaleDateString()} at {bookingDetails.propertyInfo.checkInTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium">{new Date(bookingDetails.checkOut).toLocaleDateString()} at {bookingDetails.propertyInfo.checkOutTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Price:</span>
                      <span className="font-medium">{bookingDetails.currency} {bookingDetails.totalPrice}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Guest Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{bookingDetails.guestInfo.firstName} {bookingDetails.guestInfo.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{bookingDetails.guestInfo.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{bookingDetails.guestInfo.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium">{bookingDetails.guestInfo.address}, {bookingDetails.guestInfo.city}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-6 border-t">
                {bookingDetails.modifications.canModify && (
                  <button
                    onClick={() => setShowModificationModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Modify Booking</span>
                  </button>
                )}
                
                {bookingDetails.cancellationPolicy.freeCancellation && (
                  <button
                    onClick={() => setShowCancellationModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Cancel Booking</span>
                  </button>
                )}
                
                <button
                  onClick={() => setShowSpecialRequestModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Special Request</span>
                </button>
                
                {bookingDetails.onlineCheckIn.available && !bookingDetails.onlineCheckIn.completed && (
                  <button
                    onClick={handleOnlineCheckIn}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Online Check-in</span>
                  </button>
                )}
                
                {bookingDetails.reviews.canLeaveReview && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    <Star className="w-4 h-4" />
                    <span>Leave Review</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Property Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{bookingDetails.propertyInfo.name}</h4>
                    <p className="text-gray-600 mb-4">{bookingDetails.propertyInfo.address}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{bookingDetails.propertyInfo.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{bookingDetails.propertyInfo.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a href={bookingDetails.propertyInfo.website} className="text-sm text-blue-600 hover:underline">
                          {bookingDetails.propertyInfo.website}
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {bookingDetails.propertyInfo.amenities.map((amenity) => (
                        <div key={amenity} className="flex items-center space-x-2 text-sm">
                          {getAmenityIcon(amenity)}
                          <span className="capitalize">{amenity.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-medium capitalize">{bookingDetails.paymentInfo.paymentMethod.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <p className="font-medium capitalize">{bookingDetails.paymentInfo.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount Paid</p>
                      <p className="font-medium">{bookingDetails.paymentInfo.currency} {bookingDetails.paymentInfo.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Date</p>
                      <p className="font-medium">{new Date(bookingDetails.paymentInfo.paidAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Invoices</h3>
                <div className="space-y-3">
                  {bookingDetails.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.number}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(invoice.issuedAt).toLocaleDateString()} • {invoice.currency} {invoice.amount}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        className="flex items-center space-x-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Special Requests Tab */}
          {activeTab === "requests" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Special Requests</h3>
                <button
                  onClick={() => setShowSpecialRequestModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Request</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {specialRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{request.title}</h4>
                        <p className="text-gray-600 mt-1">{request.description}</p>
                        {request.response && (
                          <div className="mt-2 p-2 bg-blue-50 rounded">
                            <p className="text-sm text-blue-800">{request.response}</p>
                          </div>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        request.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                      {request.respondedAt && ` • Responded: ${new Date(request.respondedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                ))}
                
                {specialRequests.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No special requests submitted yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Reviews</h3>
                {bookingDetails.reviews.canLeaveReview && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    <Star className="w-4 h-4" />
                    <span>Leave Review</span>
                  </button>
                )}
              </div>
              
              {review ? (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {renderStars(review.rating)}
                    <span className="font-medium">{review.title}</span>
                  </div>
                  <p className="text-gray-600 mb-2">{review.content}</p>
                  <p className="text-xs text-gray-500">
                    Submitted: {new Date(review.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {bookingDetails.reviews.canLeaveReview ? 
                      "You haven't submitted a review yet. Share your experience!" : 
                      "Reviews can be submitted after your stay."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === "contact" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Contact Property</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Get in Touch</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{bookingDetails.propertyInfo.phone}</p>
                        <p className="text-sm text-gray-600">Front Desk</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{bookingDetails.propertyInfo.email}</p>
                        <p className="text-sm text-gray-600">General Inquiries</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{bookingDetails.propertyInfo.address}</p>
                        <p className="text-sm text-gray-600">Property Location</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Operating Hours</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Front Desk:</span>
                      <span className="font-medium">24/7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium">From {bookingDetails.propertyInfo.checkInTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium">Until {bookingDetails.propertyInfo.checkOutTime}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Emergency Contact</h4>
                <p className="text-blue-800">For urgent matters during your stay, please call the front desk directly at {bookingDetails.propertyInfo.phone}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showModificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Modify Booking</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Check-in Date</label>
                <input
                  type="date"
                  value={modificationForm.newCheckIn}
                  onChange={(e) => setModificationForm({...modificationForm, newCheckIn: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="New check-in date"
                  title="Select new check-in date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Check-out Date</label>
                <input
                  type="date"
                  value={modificationForm.newCheckOut}
                  onChange={(e) => setModificationForm({...modificationForm, newCheckOut: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="New check-out date"
                  title="Select new check-out date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                <select
                  value={modificationForm.newGuests}
                  onChange={(e) => setModificationForm({...modificationForm, newGuests: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Number of guests"
                  title="Select number of guests"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Modification</label>
                <textarea
                  value={modificationForm.reason}
                  onChange={(e) => setModificationForm({...modificationForm, reason: e.target.value})}
                  rows={3}
                  placeholder="Please provide a reason for your modification request"
                  aria-label="Reason for modification"
                  title="Enter reason for booking modification"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModificationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleModifyBooking}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Submit Modification
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancellationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Booking</h3>
            <div className="space-y-4">
              {bookingDetails.cancellationPolicy.freeCancellation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    Free cancellation available until {new Date(bookingDetails.cancellationPolicy.cancellationDeadline).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    Cancellation fee of {bookingDetails.cancellationPolicy.cancellationFee * 100}% will apply
                  </p>
                </div>
              )}
              <p className="text-gray-600">
                Are you sure you want to cancel your booking? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCancellationModal(false)}
                aria-label="Keep booking"
                title="Keep current booking"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                aria-label="Cancel booking"
                title="Cancel current booking"
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {showSpecialRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Special Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                <select
                  value={specialRequestForm.type}
                  onChange={(e) => setSpecialRequestForm({...specialRequestForm, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Request type"
                  title="Select type of special request"
                >
                  <option value="early_checkin">Early Check-in</option>
                  <option value="late_checkout">Late Check-out</option>
                  <option value="room_preference">Room Preference</option>
                  <option value="extra_bed">Extra Bed</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={specialRequestForm.title}
                  onChange={(e) => setSpecialRequestForm({...specialRequestForm, title: e.target.value})}
                  placeholder="Enter request title"
                  aria-label="Request title"
                  title="Enter title for your special request"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={specialRequestForm.description}
                  onChange={(e) => setSpecialRequestForm({...specialRequestForm, description: e.target.value})}
                  rows={3}
                  placeholder="Describe your special request in detail"
                  aria-label="Request description"
                  title="Enter detailed description of your special request"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSpecialRequestModal(false)}
                aria-label="Cancel special request"
                title="Cancel special request"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSpecialRequest}
                aria-label="Submit special request"
                title="Submit special request"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Leave a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setReviewForm({...reviewForm, rating})}
                      aria-label={`Rate ${rating} stars`}
                      title={`Rate ${rating} stars`}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${rating <= reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({...reviewForm, title: e.target.value})}
                  placeholder="Enter review title"
                  aria-label="Review title"
                  title="Enter title for your review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review</label>
                <textarea
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({...reviewForm, content: e.target.value})}
                  rows={4}
                  placeholder="Share your experience"
                  aria-label="Review content"
                  title="Enter your review content"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReviewModal(false)}
                aria-label="Cancel review"
                title="Cancel review"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                aria-label="Submit review"
                title="Submit review"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {showOnlineCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Online Check-in</h3>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">
                  Your online check-in has been initiated! You will receive further instructions via email.
                </p>
              </div>
              <p className="text-gray-600">
                Check-in time: {bookingDetails.propertyInfo.checkInTime}
              </p>
              <p className="text-gray-600">
                Room: {bookingDetails.roomType} - {bookingDetails.roomNumber}
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowOnlineCheckIn(false)}
                aria-label="Close check-in modal"
                title="Close online check-in modal"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
