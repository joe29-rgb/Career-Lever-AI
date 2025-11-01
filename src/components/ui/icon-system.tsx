/**
 * ICON SYSTEM
 * Unified icon system to replace emoji logos
 */

import {
  Building2,
  Package,
  Search,
  ShoppingCart,
  Briefcase,
  Code,
  Cpu,
  Heart,
  DollarSign,
  Users,
  Zap,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Award,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Company icon mapping
const companyIcons: Record<string, LucideIcon> = {
  netflix: Building2,
  amazon: Package,
  google: Search,
  microsoft: Building2,
  apple: Building2,
  meta: Users,
  facebook: Users,
  tesla: Zap,
  shopify: ShoppingCart,
  walmart: ShoppingCart,
  target: Target,
  bestbuy: Building2,
  default: Building2
}

// Category icon mapping
const categoryIcons: Record<string, LucideIcon> = {
  technology: Cpu,
  software: Code,
  healthcare: Heart,
  finance: DollarSign,
  retail: ShoppingCart,
  marketing: TrendingUp,
  sales: DollarSign,
  engineering: Code,
  design: Award,
  default: Briefcase
}

// Status icon mapping
const statusIcons: Record<string, LucideIcon> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  pending: Clock,
  completed: CheckCircle,
  default: Info
}

interface IconProps {
  name: string
  type?: 'company' | 'category' | 'status' | 'general'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Icon({ name, type = 'general', size = 'md', className }: IconProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  let IconComponent: LucideIcon

  switch (type) {
    case 'company':
      IconComponent = companyIcons[name.toLowerCase()] || companyIcons.default
      break
    case 'category':
      IconComponent = categoryIcons[name.toLowerCase()] || categoryIcons.default
      break
    case 'status':
      IconComponent = statusIcons[name.toLowerCase()] || statusIcons.default
      break
    default:
      IconComponent = Building2
  }

  return (
    <IconComponent
      className={cn('icon', sizes[size], className)}
      aria-hidden="true"
    />
  )
}

// Specific icon components for common use cases
export function CompanyIcon({ name, size = 'md', className }: Omit<IconProps, 'type'>) {
  return <Icon name={name} type="company" size={size} className={className} />
}

export function CategoryIcon({ name, size = 'md', className }: Omit<IconProps, 'type'>) {
  return <Icon name={name} type="category" size={size} className={className} />
}

export function StatusIcon({ name, size = 'md', className }: Omit<IconProps, 'type'>) {
  return <Icon name={name} type="status" size={size} className={className} />
}

// Export all icons for direct use
export {
  Building2,
  Package,
  Search,
  ShoppingCart,
  Briefcase,
  Code,
  Cpu,
  Heart,
  DollarSign,
  Users,
  Zap,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Award,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle
}
