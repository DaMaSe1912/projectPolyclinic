# DESIGN.md — Medilane Polyclinic & Hospital Platform Design System

> **Document Type:** Production Design System Specification (`DESIGN.md`)  
> **Brand & Product:** Medilane Polyclinic & Diagnostic Network  
> **Visual Reference:** Medilane Hospital Landing Concept (Dribbble shot `27366153`)  
> **Target Devices:** Desktop Web (1440px / 1280px standard container) with fluid mobile-responsive breakpoints (390px, 768px, 1024px, 1440px)  
> **Design Theme Preset:** Clinical Clarity (`#0D9488` Medical Teal & Warm High-Trust Slate)

---

## 1. Brand Essence & Visual Language

Medilane redefines digital healthcare delivery by pairing rigorous clinical authority with calm, approachable, and human-centric aesthetics. Traditional medical websites feel cold, sterile, or anxiety-inducing; Medilane leverages warm porcelain surfaces, high-contrast typography, and restorative teal/emerald accents to communicate immediate safety, clinical precision, and welcoming accessibility.

### Guiding Principles

1. **Clinical Trust Without Sterility:**  
   Avoid harsh institutional blues and stark `#FFFFFF` backgrounds that cause visual fatigue. Use nuanced slate neutrals paired with restorative `#0D9488` teal.
2. **Action-First Triage:**  
   Emergency help and appointment filters take prominent spatial priority so anxious patients can book consultations or find contact numbers in under 15 seconds.
3. **Information Chunking & Micro-Credibility:**  
   Every medical claim is backed by credential tags, doctor board certifications, real-time availability badges, and laboratory accreditation seals (HIPAA, CLIA, Joint Commission).
4. **Accessible WCAG AAA Contrast:**  
   Strict minimum 7:1 contrast on all primary clinical instructions, button labels, and triage selectors.

---

## 2. Color System & Design Tokens

### Primary Palette (Medical Teal & Ocean Accents)
- **`color-brand-primary`**: `#0D9488` (Teal 600) — Primary CTAs, active states, key icons, brand wordmarks.
- **`color-brand-primary-hover`**: `#0F766E` (Teal 700) — Hover/pressed states for primary interactions.
- **`color-brand-primary-light`**: `#CCFBF1` (Teal 100) — Subtle pill badges, active nav underlines, icon containers.
- **`color-brand-primary-surface`**: `#F0FDFA` (Teal 50) — Highlighted card backgrounds, hero accents.
- **`color-brand-secondary`**: `#0284C7` (Sky 600) — Diagnostic and lab indicators, secondary links.
- **`color-brand-secondary-light`**: `#E0F2FE` (Sky 100) — Secondary pill badges and lab tags.

### Neutral & Surface Palette (Clinical Slate & Warm Porcelain)
- **`surface-base`**: `#FAFBFC` — Main page canvas background; warm off-white reducing eye strain.
- **`surface-card`**: `#FFFFFF` — Elevated cards, doctor cards, modals, navigation bar.
- **`surface-subtle`**: `#F1F5F9` (Slate 100) — Input fields, table headers, inactive category pills.
- **`surface-container-high`**: `#E2E8F0` (Slate 200) — Dividers, bordered containers, subtle card strokes.
- **`surface-dark`**: `#0F172A` (Slate 900) — High-contrast footer background, primary headings, emergency strips.

### Text & Typography Colors
- **`text-primary`**: `#0F172A` (Slate 900) — Section headings, doctor names, vital metrics (contrast 15.8:1 against white).
- **`text-secondary`**: `#475569` (Slate 600) — Paragraph body copy, operating hours, descriptions.
- **`text-muted`**: `#94A3B8` (Slate 400) — Micro-copy, metadata labels, review timestamps.
- **`text-inverse`**: `#FFFFFF` — Text on primary buttons, emergency banners, and dark surface containers.

### Clinical Status & Semantic Alert Colors
- **`status-emergency`**: `#DC2626` (Red 600) — Emergency 24/7 hotline pill, acute triage alerts.
- **`status-emergency-bg`**: `#FEF2F2` (Red 50) — Emergency banner fill and immediate alert outlines.
- **`status-available`**: `#10B981` (Emerald 500) — "Available Today" slot indicators, active clinic dots.
- **`status-available-bg`**: `#ECFDF5` (Emerald 50) — Availability pill background.
- **`status-warning`**: `#F59E0B` (Amber 500) — Star ratings, limited capacity badges.

---

## 3. Typography Scale & Font Metrics

- **Primary Font Family:** `"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace Font (Timestamps/Lab IDs):** `"JetBrains Mono", Menlo, Consolas, monospace`

| Token | Size | Line Height | Weight | Letter Spacing | Intended Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-hero` | 56px (`3.5rem`) | `1.15` | 800 (ExtraBold) | `-0.025em` | Hero landing proposition |
| `display-section`| 40px (`2.5rem`) | `1.20` | 700 (Bold) | `-0.02em` | Major section titles |
| `heading-lg` | 28px (`1.75rem`)| `1.25` | 700 (Bold) | `-0.015em` | Department cards, clinic titles |
| `heading-md` | 20px (`1.25rem`)| `1.30` | 600 (SemiBold) | `-0.01em` | Doctor profile headers, modal titles |
| `heading-sm` | 16px (`1.0rem`) | `1.40` | 600 (SemiBold) | `0em` | Widget field labels, metric headers |
| `body-lg` | 18px (`1.125rem`)| `1.60` | 400 (Regular) | `0em` | Hero subheaders, lead intros |
| `body-md` | 15px (`0.9375rem`)| `1.55` | 400 / 500 | `0em` | Main body copy, doctor credentials |
| `body-sm` | 13px (`0.8125rem`)| `1.45` | 500 (Medium) | `+0.01em` | Appointment slot badges, metadata |
| `caption-bold` | 11px (`0.6875rem`)| `1.30` | 700 (Bold) | `+0.05em` | Micro-badges, triage field uppercase labels |

---

## 4. Spacing, Elevation & Corner Radii

### Spacing Grid (Strict 8px Base Unit)
- `space-1` (4px), `space-2` (8px), `space-3` (12px), `space-4` (16px), `space-6` (24px)
- `space-8` (32px), `space-10` (40px), `space-12` (48px), `space-16` (64px), `space-20` (80px), `space-24` (96px)
- **Standard Desktop Content Width:** `max-w-7xl` (1280px) with `px-6` (`24px`) padding.
- **Section Vertical Rhythm:** `py-16` (64px) to `py-24` (96px) between major thematic blocks.

### Corner Radius System
- `radius-sm` (6px) — Form controls, date picker buttons, small badges.
- `radius-md` (10px) — Action buttons, slot pills, dropdowns.
- `radius-lg` (16px) — Department cards, doctor profile cards, testimonial cards.
- `radius-xl` (24px) — Quick booking triage bar, hero container cards, campus map cards.
- `radius-full` (9999px) — Availability status pills, avatars, floating notification badges.

### Elevation & Shadows
- **`shadow-subtle`**: `0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)`
- **`shadow-card`**: `0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02)`
- **`shadow-floating`**: `0 20px 35px -10px rgba(13, 148, 136, 0.15), 0 10px 15px -5px rgba(15, 23, 42, 0.05)`
- **`shadow-hover`**: `0 20px 30px -8px rgba(15, 23, 42, 0.10)`

---

## 5. Master Component Architecture

### A. Emergency Notice & Utility Header Bar
- **Height:** 40px
- **Styling:** `bg-slate-900 text-white text-xs px-6 flex items-center justify-between`
- **Left Element:** Urgent emergency indicator (`● 24/7 EMERGENCY TRIAGE: Acute Care Available Across All Campuses`).
- **Right Element:** Live campus switchboard (`Campus Switchboard: Ext. 911 | +1 (800) MED-LANE | Open Now`).

### B. Sticky Desktop Navigation (`TopNavBar`)
- **Height:** 80px, sticky top-0, `backdrop-blur-md bg-white/95 border-b border-slate-200 z-50`
- **Logo:** `Medilane Polyclinic` + Branch selector pill (`Downtown Medical Center ▾`).
- **Navigation Links:** Specialties, Doctors, Locations, Patient Portal, Insurance.
- **CTAs:**
  - Ghost link: `Emergency: +1 800 MED-LANE`
  - Solid Primary Button: `Book Appointment` (Teal `#0D9488`, `rounded-xl`, `shadow-sm`)

### C. Hero Section & Quick-Triage Filter Bar
- **Structure:** Split grid (55% narrative + booking bar / 45% clinical photography with floating credential cards).
- **Floating Credential Card 1:** Doctor capacity (`50+ Specialists On Duty`, avatar stack, `● Immediate Triage`).
- **Floating Credential Card 2:** Patient satisfaction (`★ 4.9 / 5.0 (12,400+ Verified Patient Reviews)`).
- **Integrated Triage Filter Bar:**
  - **4 Filter Columns:**
    1. Specialty (`General Medicine`, `Pediatrics`, `Cardiology`, `Dental`, `Dermatology`, `Diagnostics`)
    2. Doctor Preference (`Any Available Specialist` or Specific Doctor)
    3. Appointment Date (`Today, Nov 09`, `Tomorrow`, `Custom Date`)
    4. Insurance Network (`BlueCross`, `Aetna`, `Cigna`, `UnitedHealthcare`, `Self-Pay`)
  - **Submit Button:** `Find Slots →` with immediate visual feedback.

### D. Department Cards & Specialty Grid
- **Card Specs:** `bg-white rounded-2xl p-6 border border-slate-200 hover:border-teal-500 hover:shadow-card transition-all`
- **Contents:**
  - Distinct colored icon container (Teal, Sky, Amber, Rose, Purple)
  - Title: Clinic Name (`General Medicine & Family Health`, etc.)
  - Body: 2-line summary of treatments
  - Attending Specialist Lead: e.g. `Dr. Elena Rostova, MD (Internal Med)`
  - Direct Footer Link: `Book Specialist →`

### E. Doctor Profile Cards
- **Image:** 4:3 ratio photo with real-time slot badge (`● Available Today` in emerald or `Tomorrow Slot` in slate).
- **Rating:** `★ 4.9 (148 reviews)` in warm amber.
- **Specialist Title & Board Accreditations:** e.g., `FAAP Fellow`, `FACC Member`, `14 yrs exp`.
- **Pricing & Time:** `$65 / visit` | `Next Slot: 3:15 PM`.
- **Action Button:** Full-width `Book Consultation` CTA.

### F. Trust, Logistics & Footer System
- **Key Metrics Row:** 4-column counter (`99.2% Diagnostic Accuracy`, `15+ In-House Clinics`, `<15 min Wait Time`, `25+ Insurance Networks`).
- **Location Module:** Campus split card (Downtown vs Westside) with live operating hours, parking reservations, and direction link.
- **Regulatory Accreditations:** Joint Commission International (JCI), HIPAA Tier 4, CLIA Lab Certification badges.

---

## 6. Implementation & Tailwind CSS Token Mapping

```js
// tailwind.config.js snippet
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0D9488',
          'primary-hover': '#0F766E',
          'primary-light': '#CCFBF1',
          'primary-surface': '#F0FDFA',
          secondary: '#0284C7',
          'secondary-light': '#E0F2FE',
        },
        slate: {
          surface: '#FAFBFC',
          card: '#FFFFFF',
          subtle: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(15, 23, 42, 0.05)',
        card: '0 10px 25px -5px rgba(15, 23, 42, 0.05)',
        floating: '0 20px 35px -10px rgba(13, 148, 136, 0.15)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      }
    }
  }
}
```
