// تایپ‌های مشترک اپلیکیشن «مدیرمن»

export type UserRole = 'manager' | 'resident'

export type UserStatus = 'unassigned' | 'active' | 'inactive'

export type AppUser = {
  id: string
  name: string
  role: UserRole
  username: string
  unitNumber: string | null
  floor: number | null
  phone: string | null
  status: UserStatus
  createdAt?: string
}

export type Announcement = {
  id: string
  title: string
  content: string
  type: string
  date: string
  time: string
  createdAt: string
}

export type Bill = {
  id: string
  title: string
  amount: number
  unitNumber: string
  dueDate: string
  status: 'pending' | 'paid'
  paidAt: string | null
  createdAt: string
}

export type ServiceRequest = {
  id: string
  title: string
  description: string | null
  unitNumber: string
  category: string
  priority: 'high' | 'medium' | 'low'
  status: 'in_progress' | 'done'
  createdAt: string
}

export type Resident = {
  id: string
  name: string
  username: string
  unitNumber: string | null
  floor: number | null
  phone: string | null
  status: string
  role?: UserRole
  createdAt: string
}

export type ReceiptStatus = 'pending' | 'approved' | 'rejected'

export type Receipt = {
  id: string
  billId: string
  amount: number
  image: string
  note: string | null
  status: ReceiptStatus
  createdAt: string
  uploadedBy: { id: string; name: string; unitNumber: string } | null
  bill: { id: string; title: string; unitNumber: string; amount: number } | null
}

export type BuildingInfo = {
  id: string
  name: string
  address: string
  units: number
  cardNumber: string
  cardHolder: string
  sheba: string
}

export type ReminderType = 'personal' | 'building'

export type Reminder = {
  id: string
  title: string
  description: string | null
  date: string // تاریخ جلالی با فرمت YYYY-MM-DD
  time: string | null // HH:mm
  type: ReminderType
  createdAt: string
  user?: { name: string }
}

export type AppView =
  | 'dashboard'
  | 'calendar'
  | 'announcements'
  | 'bills'
  | 'requests'
  | 'residents'
