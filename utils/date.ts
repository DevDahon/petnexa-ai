import { PetSpecies, Reminder, ReminderStatus } from "@/types/domain";

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function formatFriendlyDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export function calculateAge(birthday: string) {
  const birth = new Date(`${birthday}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0) return `${Math.max(months, 0)} month${months === 1 ? "" : "s"} old`;
  if (months === 0) return `${years} year${years === 1 ? "" : "s"} old`;
  return `${years} year${years === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"} old`;
}

export function getAgeYears(birthday: string) {
  const birth = new Date(`${birthday}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years -= 1;
  return years;
}

export function isValidIsoDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

export function getLifeStage(birthday: string, species: PetSpecies) {
  const birth = new Date(`${birthday}T00:00:00`).getTime();
  const ageYears = (Date.now() - birth) / (1000 * 60 * 60 * 24 * 365.25);
  if (ageYears < 1) return species === "Cat" ? "Kitten" : species === "Dog" ? "Puppy" : "Young";
  if (ageYears < 2) return "Junior";
  if (ageYears >= 8) return "Senior";
  return "Adult";
}

export function getReminderStatus(reminder: Reminder): ReminderStatus {
  if (reminder.completedAt) return "Completed";
  const due = reminder.dueDate.slice(0, 10);
  const today = todayIso();
  if (due < today) return "Overdue";
  if (due === today) return "Due Today";
  return "Upcoming";
}

export function currentWeekKey() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - firstDay.getTime()) / 86400000);
  return `${now.getFullYear()}-W${Math.ceil((days + firstDay.getDay() + 1) / 7)}`;
}
