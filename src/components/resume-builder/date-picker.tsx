'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from 'lucide-react'

interface DatePickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  allowCurrent?: boolean
  isCurrent?: boolean
  onCurrentChange?: (current: boolean) => void
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const YEARS = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i)

export function DatePicker({
  label,
  value,
  onChange,
  allowCurrent = false,
  isCurrent = false,
  onCurrentChange
}: DatePickerProps) {
  // Parse existing value (format: "Month YYYY" or "MM/YYYY")
  const parseDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'Present') return { month: '', year: '' }
    
    // Try "Month YYYY" format
    const parts = dateStr.split(' ')
    if (parts.length === 2) {
      return { month: parts[0], year: parts[1] }
    }
    
    // Try "MM/YYYY" format
    const slashParts = dateStr.split('/')
    if (slashParts.length === 2) {
      const monthIndex = parseInt(slashParts[0]) - 1
      return { 
        month: MONTHS[monthIndex] || '', 
        year: slashParts[1] 
      }
    }
    
    return { month: '', year: '' }
  }

  const { month: initialMonth, year: initialYear } = parseDate(value)
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  const [selectedYear, setSelectedYear] = useState(initialYear)

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    if (month && selectedYear) {
      onChange(`${month} ${selectedYear}`)
    }
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    if (selectedMonth && year) {
      onChange(`${selectedMonth} ${year}`)
    }
  }

  const handleCurrentToggle = () => {
    if (onCurrentChange) {
      onCurrentChange(!isCurrent)
      if (!isCurrent) {
        onChange('Present')
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        {label}
      </Label>
      
      {allowCurrent && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={handleCurrentToggle}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-muted-foreground">Current position</span>
        </label>
      )}

      {!isCurrent && (
        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isCurrent && (
        <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          Present
        </div>
      )}
    </div>
  )
}
