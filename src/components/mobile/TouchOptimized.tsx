"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown,
  Plus,
  Minus,
  X,
  Check,
  Heart,
  Star,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Upload,
  Edit,
  Trash2,
  Search,
  Filter,
  Menu,
  Bell,
  Settings,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Users,
  Bed,
  CreditCard,
  FileText,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  Printer,
  Camera,
  Image as ImageIcon,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Home,
  Grid,
  List,
  MoreVertical,
  MoreHorizontal
} from "lucide-react";
import "../../styles/progress-bars.css";

interface TouchOptimizedProps {
  children: React.ReactNode;
  enableGestures?: boolean;
  hapticFeedback?: boolean;
}

interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  className?: string;
}

interface TouchSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  label?: string;
}

interface TouchSwipeProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

interface TouchCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  className?: string;
}

export function TouchOptimized({ 
  children, 
  enableGestures = true, 
  hapticFeedback = true 
}: TouchOptimizedProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd(null);

    // Start long press timer
    if (hapticFeedback) {
      const timer = setTimeout(() => {
        triggerHapticFeedback('longPress');
      }, 500);
      setLongPressTimer(timer);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });

    // Clear long press timer on move
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Trigger haptic feedback for significant gestures
    if (hapticFeedback && distance > 50) {
      triggerHapticFeedback('light');
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'longPress') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'longPress':
          navigator.vibrate([10, 50, 10]);
          break;
      }
    }
  };

  return (
    <div 
      className="touch-optimized"
      onTouchStart={enableGestures ? handleTouchStart : undefined}
      onTouchMove={enableGestures ? handleTouchMove : undefined}
      onTouchEnd={enableGestures ? handleTouchEnd : undefined}
    >
      {children}
    </div>
  );
}

export function TouchButton({
  children,
  onClick,
  onLongPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = true,
  className = ''
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    
    // Start long press timer
    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
        triggerHapticFeedback('longPress');
      }, 500);
      setLongPressTimer(timer);
    }
    
    triggerHapticFeedback('light');
  };

  const handlePressEnd = () => {
    if (disabled || loading) return;
    
    setIsPressed(false);
    
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (onClick) {
      onClick();
    }
  };

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'longPress') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'longPress':
          navigator.vibrate([10, 50, 10]);
          break;
      }
    }
  };

  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 transform active:scale-95";
  
  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 shadow-md",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-md",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500"
  };
  
  const sizeClasses = {
    small: "px-3 py-1.5 text-sm min-h-[32px]",
    medium: "px-4 py-2 text-sm min-h-[40px]",
    large: "px-6 py-3 text-base min-h-[48px]"
  };

  const stateClasses = {
    disabled: "opacity-50 cursor-not-allowed",
    loading: "cursor-wait",
    pressed: "scale-95"
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    rounded ? "rounded-lg" : "rounded",
    fullWidth ? "w-full" : "",
    disabled ? stateClasses.disabled : "",
    loading ? stateClasses.loading : "",
    isPressed ? stateClasses.pressed : "",
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="mr-2 flex-shrink-0">{icon}</span>
          )}
          <span className="truncate">{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="ml-2 flex-shrink-0">{icon}</span>
          )}
        </>
      )}
    </button>
  );
}

export function TouchSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = true,
  label
}: TouchSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || disabled) return;
    updateValue(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || disabled) return;
    updateValue(e.touches[0].clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const updateValue = (clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = Math.round((percentage * (max - min) + min) / step) * step;
    
    onChange(newValue);
    
    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="touch-slider">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {showValue && (
            <span className="text-sm text-gray-500">{value}</span>
          )}
        </div>
      )}
      
      <div
        ref={sliderRef}
        className={`relative h-2 bg-gray-200 rounded-full cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className={`absolute h-full bg-blue-500 rounded-full transition-all duration-150 progress-width-${Math.round(percentage / 5) * 5}`}
        />
        
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-md transition-all duration-150 slider-position-${Math.round(percentage / 5) * 5} ${
            isDragging ? 'scale-110' : 'scale-100'
          }`}
        />
      </div>
    </div>
  );
}

export function TouchSwipe({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = ''
}: TouchSwipeProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine swipe direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > threshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div
      className={`touch-swipe ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

export function TouchCard({
  children,
  onPress,
  onLongPress,
  disabled = false,
  className = ''
}: TouchCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    if (disabled) return;
    
    setIsPressed(true);
    
    // Start long press timer
    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
        triggerHapticFeedback('longPress');
      }, 500);
      setLongPressTimer(timer);
    }
    
    triggerHapticFeedback('light');
  };

  const handlePressEnd = () => {
    if (disabled) return;
    
    setIsPressed(false);
    
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (onPress) {
      onPress();
    }
  };

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'longPress') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'longPress':
          navigator.vibrate([10, 50, 10]);
          break;
      }
    }
  };

  return (
    <div
      className={`touch-card bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all duration-150 ${
        isPressed ? 'scale-95 shadow-lg' : 'scale-100 shadow-sm'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      {children}
    </div>
  );
}

// Pre-styled touch-optimized components
export function TouchIconButton({
  icon,
  onClick,
  variant = 'ghost',
  size = 'medium',
  disabled = false,
  label,
  className = ''
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <TouchButton
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      className={className}
    >
      {icon}
      {label && <span className="ml-2">{label}</span>}
    </TouchButton>
  );
}

export function TouchQuickActions({
  actions,
  direction = 'horizontal'
}: {
  actions: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  }[];
  direction?: 'horizontal' | 'vertical';
}) {
  return (
    <div className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} gap-2`}>
      {actions.map((action, index) => (
        <TouchIconButton
          key={index}
          icon={action.icon}
          label={action.label}
          onClick={action.onClick}
          variant={action.variant}
          size="small"
        />
      ))}
    </div>
  );
}

export function TouchToggle({
  checked,
  onChange,
  disabled = false,
  label
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
      
      // Haptic feedback
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      
      <button
        onClick={handleToggle}
        disabled={disabled}
        aria-label={checked ? "Disable toggle" : "Enable toggle"}
        title={checked ? "Disable toggle" : "Enable toggle"}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export function TouchStepper({
  value,
  onChange,
  min = 0,
  max = 10,
  disabled = false,
  label
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
}) {
  const handleIncrement = () => {
    if (!disabled && value < max) {
      onChange(value + 1);
      triggerHapticFeedback('light');
    }
  };

  const handleDecrement = () => {
    if (!disabled && value > min) {
      onChange(value - 1);
      triggerHapticFeedback('light');
    }
  };

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
      }
    }
  };

  return (
    <div className="touch-stepper">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="flex items-center space-x-2">
        <TouchIconButton
          icon={<Minus className="w-4 h-4" />}
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          variant="secondary"
          size="small"
        />
        
        <div className="w-12 text-center font-medium">
          {value}
        </div>
        
        <TouchIconButton
          icon={<Plus className="w-4 h-4" />}
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          variant="secondary"
          size="small"
        />
      </div>
    </div>
  );
}

// Utility functions for touch interactions
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'longPress') {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'longPress':
        navigator.vibrate([10, 50, 10]);
        break;
    }
  }
}

export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

export function getTouchSize() {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}
