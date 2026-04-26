import React from "react";
import {
  Bell,
  BellRing,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  X,
  Smartphone,
  Download,
  MapPin,
  Map as MapIcon,
  Compass,
  Navigation,
  Satellite,
  Radio,
  Wifi,
  WifiOff,
  Activity,
  HeartPulse,
  Heart,
  Thermometer,
  Droplets,
  Stethoscope,
  ClipboardList,
  FileText,
  FileBadge,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Trash2,
  Search,
  Settings,
  Users,
  User,
  LogOut,
  LogIn,
  Plus,
  Pencil,
  Save,
  RefreshCw,
  Play,
  Pause,
  Square,
  Filter,
  Globe,
  Languages,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Wind,
  Calendar,
  Clock,
  Crown,
  Award,
  Star,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Eye,
  Share2,
  Lock,
  Mail,
  Phone,
  Home,
  LayoutDashboard,
  Layers,
  PieChart,
  BarChart3,
  Target,
  Zap,
  Flame,
  Leaf,
  Mountain,
} from "lucide-react";

// Custom species icons (emoji-free, Saudi heritage themed)
export function CamelIcon({ size = 24, className = "", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 18c0-1 .8-2 2-2h2l1-3c.3-1 1.2-2 2.5-2h3c1 0 1.8.5 2.3 1.3L17 14h2c1.5 0 2 1 2 2v2" />
      <path d="M5 18v2M19 18v2M9 14V8a3 3 0 0 1 6 0c0 2 1 3 1 4" />
      <circle cx="14.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function HorseIcon({ size = 24, className = "", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 21v-5a5 5 0 0 1 5-5h2l3-3 1 1-1 2 2 2c1.5 0 2.5 1 2.5 2.5V21" />
      <path d="M5 21h3M16 21h3M9 11l-2-3 1-2 3 1" />
      <circle cx="16.5" cy="8.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function FalconIcon({ size = 24, className = "", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 12c4-1 7-3 9-7 2 4 5 6 9 7-3 1-6 3-9 9-3-6-6-8-9-9z" />
      <circle cx="12" cy="9" r="0.7" fill="currentColor" />
    </svg>
  );
}

export {
  Bell,
  BellRing,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  X,
  Smartphone,
  Download,
  MapPin,
  MapIcon,
  Compass,
  Navigation,
  Satellite,
  Radio,
  Wifi,
  WifiOff,
  Activity,
  HeartPulse,
  Heart,
  Thermometer,
  Droplets,
  Stethoscope,
  ClipboardList,
  FileText,
  FileBadge,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Trash2,
  Search,
  Settings,
  Users,
  User,
  LogOut,
  LogIn,
  Plus,
  Pencil,
  Save,
  RefreshCw,
  Play,
  Pause,
  Square,
  Filter,
  Globe,
  Languages,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Wind,
  Calendar,
  Clock,
  Crown,
  Award,
  Star,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Eye,
  Share2,
  Lock,
  Mail,
  Phone,
  Home,
  LayoutDashboard,
  Layers,
  PieChart,
  BarChart3,
  Target,
  Zap,
  Flame,
  Leaf,
  Mountain,
};

// Helper to get species icon by name
export function getSpeciesIcon(species) {
  switch (species) {
    case "Camel":
      return CamelIcon;
    case "Horse":
      return HorseIcon;
    case "Falcon":
      return FalconIcon;
    default:
      return CamelIcon;
  }
}
