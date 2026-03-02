"use client";

import { useState, useEffect } from "react";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Menu, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  ArrowRight,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  Bed,
  Star,
  Heart,
  Share2,
  Download,
  Edit,
  Trash2,
  Plus,
  Bell,
  Settings,
  LogOut,
  Home,
  User,
  CreditCard,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  AlertCircle,
  Info,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  Printer,
  Camera,
  Image as ImageIcon
} from "lucide-react";

interface MobileOptimizedProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
  showFilter?: boolean;
  showActions?: boolean;
  actions?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
  }[];
  onBack?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: () => void;
}

export function MobileOptimized({
  children,
  title,
  showBackButton = false,
  showSearch = false,
  showFilter = false,
  showActions = false,
  actions = [],
  onBack,
  onSearch,
  onFilter
}: MobileOptimizedProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      setSwipeDirection('left');
    } else if (isRightSwipe) {
      setSwipeDirection('right');
    }
    
    // Reset swipe direction after animation
    setTimeout(() => setSwipeDirection(null), 300);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleTapToCall = (phoneNumber: string) => {
    if (isMobile) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      navigator.clipboard.writeText(phoneNumber);
    }
  };

  const handleTapToEmail = (email: string) => {
    if (isMobile) {
      window.location.href = `mailto:${email}`;
    } else {
      navigator.clipboard.writeText(email);
    }
  };

  const handleTapToMap = (address: string) => {
    if (isMobile) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
    } else {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const handleShare = async (title: string, url: string) => {
    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title,
          text: title,
          url: url
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for desktop or unsupported browsers
      navigator.clipboard.writeText(url);
    }
  };

  const sendPushNotification = (title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'agentflow-notification',
        requireInteraction: false
      });
    }
  };

  const MobileHeader = () => (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          {title && (
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {showSearch && (
            <button
              onClick={() => setShowSearchBar(!showSearchBar)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          
          {showFilter && (
            <button
              onClick={onFilter}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearchBar && (
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );

  const MobileMenu = () => (
    <div className={`fixed inset-0 z-50 ${showMobileMenu ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)} />
      <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        showMobileMenu ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={() => setShowMobileMenu(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <Calendar className="w-5 h-5" />
              <span>Bookings</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <Users className="w-5 h-5" />
              <span>Guests</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <Bed className="w-5 h-5" />
              <span>Properties</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <FileText className="w-5 h-5" />
              <span>Invoices</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <CreditCard className="w-5 h-5" />
              <span>Payments</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span>Messages</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors text-red-600">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );

  const MobileActions = () => {
    if (!showActions || actions.length === 0) return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="flex items-center justify-around p-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                action.variant === 'primary' ? 'text-blue-600 hover:bg-blue-50' :
                action.variant === 'danger' ? 'text-red-600 hover:bg-red-50' :
                'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {action.icon}
              </div>
              <span className="text-xs">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const SwipeIndicator = () => {
    if (!swipeDirection) return null;

    return (
      <div className={`fixed inset-0 pointer-events-none z-50 flex items-center justify-center ${
        swipeDirection === 'left' ? 'justify-start' : 'justify-end'
      }`}>
        <div className={`bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-transform duration-300 ${
          swipeDirection === 'left' ? 'translate-x-4' : '-translate-x-4'
        }`}>
          {swipeDirection === 'left' ? 'Swipe Left' : 'Swipe Right'}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && <MobileHeader />}
      
      {/* Mobile Menu */}
      <MobileMenu />
      
      {/* Main Content */}
      <main 
        className={`${isMobile ? 'pb-20' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </main>
      
      {/* Mobile Actions */}
      {isMobile && <MobileActions />}
      
      {/* Swipe Indicator */}
      <SwipeIndicator />
    </div>
  );
}

// Mobile-specific components
export function MobileCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function MobileButton({ 
  children, 
  onClick, 
  variant = "primary", 
  size = "medium",
  disabled = false,
  fullWidth = false,
  icon,
  className = ""
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500"
  };
  
  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        fullWidth ? 'w-full' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

export function MobileQuickActions({ 
  phoneNumber, 
  email, 
  address, 
  title, 
  url 
}: {
  phoneNumber?: string;
  email?: string;
  address?: string;
  title?: string;
  url?: string;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <button
        onClick={() => setShowActions(!showActions)}
        className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      >
        {showActions ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
      
      {showActions && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-2 min-w-48">
          {phoneNumber && (
            <button
              onClick={() => handleTapToCall(phoneNumber)}
              className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <Phone className="w-4 h-4 text-green-600" />
              <span className="text-sm">Call {phoneNumber}</span>
            </button>
          )}
          
          {email && (
            <button
              onClick={() => handleTapToEmail(email)}
              className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Email</span>
            </button>
          )}
          
          {address && (
            <button
              onClick={() => handleTapToMap(address)}
              className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <MapPin className="w-4 h-4 text-red-600" />
              <span className="text-sm">Directions</span>
            </button>
          )}
          
          {title && url && (
            <button
              onClick={() => handleShare(title, url)}
              className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <Share2 className="w-4 h-4 text-purple-600" />
              <span className="text-sm">Share</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MobileCalendar({ 
  selectedDate, 
  onDateSelect, 
  availableDates = [],
  blockedDates = []
}: {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  availableDates?: Date[];
  blockedDates?: Date[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    
    if (direction === 'left') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    }
    
    setTimeout(() => setSwipeDirection(null), 300);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => 
      availableDate.toDateString() === date.toDateString()
    );
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.some(blockedDate => 
      blockedDate.toDateString() === date.toDateString()
    );
  };

  const isDateSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const available = isDateAvailable(date);
      const blocked = isDateBlocked(date);
      const selected = isDateSelected(date);

      days.push(
        <button
          key={day}
          onClick={() => !blocked && onDateSelect(date)}
          disabled={blocked}
          className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
            selected 
              ? 'bg-blue-500 text-white' 
              : blocked 
              ? 'text-gray-300 cursor-not-allowed' 
              : available 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => handleSwipe('right')}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ChevronUp className="w-4 h-4 transform rotate-270" />
        </button>
        
        <h3 className="text-lg font-semibold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        
        <button
          onClick={() => handleSwipe('left')}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-100 rounded-full"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <span>Blocked</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}

// Utility functions for mobile interactions
function handleTapToCall(phoneNumber: string) {
  if (typeof window !== 'undefined') {
    window.location.href = `tel:${phoneNumber}`;
  }
}

function handleTapToEmail(email: string) {
  if (typeof window !== 'undefined') {
    window.location.href = `mailto:${email}`;
  }
}

function handleTapToMap(address: string) {
  if (typeof window !== 'undefined') {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  }
}

async function handleShare(title: string, url: string) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text: title,
        url: url
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  } else {
    // Fallback
    navigator.clipboard.writeText(url);
  }
}

export { handleTapToCall, handleTapToEmail, handleTapToMap, handleShare };
