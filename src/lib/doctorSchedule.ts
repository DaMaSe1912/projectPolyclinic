import { Doctor } from '@/types';

export const STANDARD_CLINIC_SLOTS = [
  '08:30 - 09:00',
  '09:00 - 09:30',
  '09:30 - 10:00',
  '10:00 - 10:30',
  '10:30 - 11:00',
  '11:00 - 11:30',
  '11:30 - 12:00',
  '12:00 - 12:30',
  '13:00 - 13:30',
  '13:30 - 14:00',
  '14:00 - 14:30',
  '14:30 - 15:00',
  '15:00 - 15:30',
  '15:30 - 16:00',
  '16:00 - 16:30',
  '16:30 - 17:00',
];

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Returns the Indonesian day name for a YYYY-MM-DD date string.
 * Example: '2026-11-11' -> 'Rabu'
 */
export function getIndonesianDayName(dateStr: string): string {
  if (!dateStr) return 'Senin';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 'Senin';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return INDONESIAN_DAYS[d.getDay()] || 'Senin';
}

/**
 * Parses 'HH:MM' string into minutes from 00:00.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.trim().split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Checks whether a given slot (e.g. '13:30 - 14:00') fits entirely within
 * the doctor's shift hours (e.g. '13:00 - 17:00').
 */
export function isSlotWithinShift(slotTime: string, shiftHours: string): boolean {
  if (!slotTime || !shiftHours) return false;
  const slotParts = slotTime.split('-').map((s) => s.trim());
  const shiftParts = shiftHours.split('-').map((s) => s.trim());
  if (slotParts.length < 1 || shiftParts.length < 2) return false;

  const slotStart = parseTimeToMinutes(slotParts[0]);
  const slotEnd = slotParts.length > 1 ? parseTimeToMinutes(slotParts[1]) : slotStart + 30;

  const shiftStart = parseTimeToMinutes(shiftParts[0]);
  const shiftEnd = parseTimeToMinutes(shiftParts[1]);

  return slotStart >= shiftStart && slotEnd <= shiftEnd;
}

/**
 * Checks whether a doctor has scheduled practice on the given date (based on day of week).
 */
export function isDoctorPracticingOnDate(doctor: Doctor, dateStr: string): boolean {
  if (!doctor || !doctor.scheduleDays) return false;
  const dayName = getIndonesianDayName(dateStr);
  return doctor.scheduleDays.some(
    (d) => d.trim().toLowerCase() === dayName.toLowerCase()
  );
}

/**
 * Finds all doctors scheduled on the date whose shift covers the slotTime.
 */
export function getMatchingDoctorsForSlot(
  doctors: Doctor[],
  slotTime: string,
  dateStr: string
): Doctor[] {
  const dayName = getIndonesianDayName(dateStr);
  return doctors.filter((doc) => {
    const worksOnDay = doc.scheduleDays?.some(
      (d) => d.trim().toLowerCase() === dayName.toLowerCase()
    );
    if (!worksOnDay) return false;
    return isSlotWithinShift(slotTime, doc.shiftHours);
  });
}

/**
 * Resolves the authoritative doctor for a slot and date:
 * 1. If preferredDoctorId is valid for the slot & date and available, keep it.
 * 2. Otherwise pick an available doctor who is on duty.
 * 3. Otherwise pick an available doctor.
 * 4. Fallback to any matching doctor.
 */
export function resolveDoctorForSlot(
  doctors: Doctor[],
  slotTime: string,
  dateStr: string,
  preferredDoctorId?: string
): Doctor | undefined {
  const matching = getMatchingDoctorsForSlot(doctors, slotTime, dateStr);
  if (matching.length === 0) return undefined;

  if (preferredDoctorId) {
    const pref = matching.find((d) => d.id === preferredDoctorId && d.isAvailable);
    if (pref) return pref;
  }

  const availableOnDuty = matching.find((d) => d.isAvailable && d.isOnDuty);
  if (availableOnDuty) return availableOnDuty;

  const available = matching.find((d) => d.isAvailable);
  if (available) return available;

  return matching[0];
}

/**
 * Returns all standard slots that fall within a doctor's shift hours.
 */
export function getValidSlotsForDoctor(
  doctor: Doctor,
  allSlots: string[] = STANDARD_CLINIC_SLOTS
): string[] {
  if (!doctor || !doctor.shiftHours) return [];
  return allSlots.filter((slot) => isSlotWithinShift(slot, doctor.shiftHours));
}

/**
 * Returns the first valid slot for a doctor.
 */
export function getFirstValidSlotForDoctor(
  doctor: Doctor,
  allSlots: string[] = STANDARD_CLINIC_SLOTS
): string | undefined {
  const slots = getValidSlotsForDoctor(doctor, allSlots);
  return slots.length > 0 ? slots[0] : undefined;
}

