// Centralized data store using localStorage
const STORAGE_KEYS = {
  ALERTS: "edu-alerts",
  CALENDAR: "edu-calendar",
  COMUNICADOS: "edu-comunicados",
  PHOTOS: "edu-photos",
  BIRTHDAYS: "edu-birthdays",
  TEACHER_NOTES: "edu-teacher-notes",
  PAYMENTS: "edu-payments",
  STUDENTS: "edu-students",
  THANKS: "edu-thanks",
  MESSAGE_DAY: "edu-message-day",
} as const;

function get<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Types
export interface Alert {
  id: string;
  title: string;
  message: string;
  priority: "urgent" | "warning" | "info";
  active: boolean;
  showBanner: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
}

export interface Comunicado {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export interface Photo {
  id: string;
  url: string;
  description: string;
  date: string;
}

export interface Birthday {
  id: string;
  name: string;
  date: string; // MM-DD
  emoji: string;
  message?: string;
  photo?: string;
}

export interface TeacherNote {
  id: string;
  studentName: string;
  category: "lectura" | "atencion" | "conducta" | "escritura" | "motricidad" | "general";
  note: string;
  teacher: string;
  date: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  monthlyFee: number;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  method: "efectivo" | "transferencia" | "cheque" | "tarjeta";
  date: string;
  receiptNumber: string;
  comprobante?: string;
  month: string;
}

export interface ThankYou {
  id: string;
  message: string;
  author: string;
  date: string;
}

export interface MessageOfDay {
  content: string;
  type: string;
  date: string;
  source: string;
}

// Data accessors
export const dataStore = {
  // Alerts
  getAlerts: (): Alert[] => get(STORAGE_KEYS.ALERTS, []),
  saveAlerts: (alerts: Alert[]) => set(STORAGE_KEYS.ALERTS, alerts),

  // Calendar
  getEvents: (): CalendarEvent[] => get(STORAGE_KEYS.CALENDAR, []),
  saveEvents: (events: CalendarEvent[]) => set(STORAGE_KEYS.CALENDAR, events),

  // Comunicados
  getComunicados: (): Comunicado[] => get(STORAGE_KEYS.COMUNICADOS, []),
  saveComunicados: (c: Comunicado[]) => set(STORAGE_KEYS.COMUNICADOS, c),

  // Photos
  getPhotos: (): Photo[] => get(STORAGE_KEYS.PHOTOS, []),
  savePhotos: (p: Photo[]) => set(STORAGE_KEYS.PHOTOS, p),

  // Birthdays
  getBirthdays: (): Birthday[] => get(STORAGE_KEYS.BIRTHDAYS, []),
  saveBirthdays: (b: Birthday[]) => set(STORAGE_KEYS.BIRTHDAYS, b),

  // Teacher notes
  getTeacherNotes: (): TeacherNote[] => get(STORAGE_KEYS.TEACHER_NOTES, []),
  saveTeacherNotes: (n: TeacherNote[]) => set(STORAGE_KEYS.TEACHER_NOTES, n),

  // Students
  getStudents: (): Student[] => get(STORAGE_KEYS.STUDENTS, []),
  saveStudents: (s: Student[]) => set(STORAGE_KEYS.STUDENTS, s),

  // Payments
  getPayments: (): Payment[] => get(STORAGE_KEYS.PAYMENTS, []),
  savePayments: (p: Payment[]) => set(STORAGE_KEYS.PAYMENTS, p),

  // Thanks
  getThanks: (): ThankYou[] => get(STORAGE_KEYS.THANKS, []),
  saveThanks: (t: ThankYou[]) => set(STORAGE_KEYS.THANKS, t),

  // Message of day
  getMessageOfDay: (): MessageOfDay | null => get(STORAGE_KEYS.MESSAGE_DAY, null),
  saveMessageOfDay: (m: MessageOfDay) => set(STORAGE_KEYS.MESSAGE_DAY, m),
};

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
