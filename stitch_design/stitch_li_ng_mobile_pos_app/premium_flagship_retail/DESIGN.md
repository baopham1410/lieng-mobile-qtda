---
name: Premium Flagship Retail
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#58413f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#8c716e'
  outline-variant: '#dfbfbc'
  surface-tint: '#ab332e'
  primary: '#550005'
  on-primary: '#ffffff'
  primary-container: '#7a0c10'
  on-primary-container: '#ff8076'
  inverse-primary: '#ffb3ac'
  secondary: '#b32446'
  on-secondary: '#ffffff'
  secondary-container: '#fe5e7a'
  on-secondary-container: '#63001e'
  tertiary: '#2a2525'
  on-tertiary: '#ffffff'
  tertiary-container: '#403a3a'
  on-tertiary-container: '#ada4a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb3ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#8a1a1a'
  secondary-fixed: '#ffd9dc'
  secondary-fixed-dim: '#ffb2ba'
  on-secondary-fixed: '#400010'
  on-secondary-fixed-variant: '#910130'
  tertiary-fixed: '#ebe0e0'
  tertiary-fixed-dim: '#cec4c4'
  on-tertiary-fixed: '#1f1a1b'
  on-tertiary-fixed-variant: '#4c4546'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-currency:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  display-currency-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.75rem
  margin: 1rem
  margin-tablet: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

The design system is crafted for high-performing retail sales professionals handling flagship smartphones, high-ticket electronics, and high-velocity point-of-sale transactions. 

### Core Personality
- **Authoritative & Trustworthy:** Anchored by deep, prestigious crimson tones that project institutional reliability during large financial transactions.
- **Tactile Precision & Fluidity:** Optimized for one-thumb speed, instant visual confirmation, and clear numerical readouts under fast-paced showroom environments.
- **Premium Tech Sensibility:** A refined fusion of modern Scandinavian minimalism and high-end luxury retail styling, avoiding cluttered ERP patterns in favor of calm, high-contrast, card-based surfaces.

### Visual Style
The interface employs a **Tactile Modernism** aesthetic:
- Clean off-white and cool slate structural backgrounds.
- Pure white elevated cards with ultra-soft ambient dissipation.
- Precision micro-borders defining interactive boundaries without visual noise.
- Bold, decisive red focal points for primary actions and closing deals.

## Colors

The palette balances authoritative brand prestige with high-contrast functional ergonomics suited for retail lighting conditions.

### Primary Hierarchy
- **Brand Primary (`#7A0C10`):** Reserved for core commitment actions (e.g., "Thanh toán", "Tạo đơn", "Xác nhận"), high-level navigation anchors, and flagship KPI data cards.
- **Accent Red (`#9F1239`):** Interactive hover/active states, active badge fills, and conversion highlights.
- **Soft Blush Tone (`#FDF2F2`):** Used strictly as a tinted substrate for promotional badges, active selection pills, and contextual alert backgrounds.
- **App Canvas Neutral (`#F8FAFC`):** Deep cool neutral base layer ensuring pure white cards possess perceptible physical contrast.

### Functional & Semantic Colors
- **Success (`#16A34A`):** Transaction completed, inventory in-stock, trade-in accepted.
- **Pending/Warning (`#D97706`):** Installment awaiting credit check, processing settlement, low stock threshold.
- **Critical/Error (`#DC2626`):** Transaction declined, out of stock, cancelled contract.
- **Surface Outline (`#E2E8F0`):** Perimeter containment for cards, input containers, and segmented controls.
- **Text Heavy (`#0F172A`):** Core body and numerical data for uncompromised legibility.
- **Text Muted (`#64748B`):** Metadata, SKU codes, secondary spec details.

## Typography

The typographic system relies on **Inter** with tabular figure features (`tnum`) enabled across all monetary and inventory metrics.

### Financial Readability Rule
- All currency readouts must be rendered in bold/semi-bold weight, formatted strictly as: `[Amount] đ` (e.g., `29.490.000 đ`).
- Currency suffix `đ` remains lowercase with an unbreakable space preceding it.
- Device IMEI, barcode tags, and serial numbers must use font tabular lining figures to ensure zero vertical jitter during scrolling lists.

## Layout & Spacing

A compact, thumb-accessible layout designed specifically for hand-held point-of-sale efficiency on smartphones and compact tablets.

### Layout Mechanics
- **Device Philosophy:** Mobile-first, single-column stacked architecture with persistent bottom dock action modules for closing sales.
- **Touch Targets:** Minimum 48px height on all primary tap surfaces (buttons, quantity pickers, category pills).
- **Safe Areas:** Hard bottom-padding protection for iOS Home Indicator and Android gesture bars, ensuring the POS bottom bar floats seamlessly above system controls.
- **Rhythm:** Built on an intentional 4px/8px micro-scale to maintain crisp border alignment on high-density Retina and OLED screens.

## Elevation & Depth

Visual hierarchy uses a refined 3-tier elevation strategy combining clean physical separation with diffused ambient warmth.

### Elevation Levels
- **Base Canvas (Level 0):** Pure `#F8FAFC`. Completely flat; houses non-interactive structural separators and empty states.
- **Surface Cards (Level 1):** `#FFFFFF` surface container with a 1px perimeter stroke of `#E2E8F0` and an ambient shadow: `box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)`.
- **Floating Modals & POS Bottom Trays (Level 2):** `#FFFFFF` surface accompanied by a strong upward diffusion: `box-shadow: 0 -8px 24px -4px rgba(15, 23, 42, 0.08), 0 0 1px rgba(15, 23, 42, 0.05)`.
- **Active Selection Tiers:** Outlines transition from `#E2E8F0` to `#7A0C10` (or `#9F1239`) with an inner 1px glow or `#FDF2F2` tinted wash, eliminating heavy dark drop-shadows.

## Shapes

The design uses generous, organic modern curvatures (`rounded-2xl`, 16px–20px) to balance the high-density technical data of specs, pricing, and serial numbers.

### Geometry Rules
- **Standard Surfaces & Cards:** `16px` (`rounded-2xl`) outer corners with nested content retaining a 4px smaller internal radius (`12px`).
- **Primary Bottom Trays & Modal Sheets:** `20px` radius on top-left and top-right apexes.
- **Interactive Controls (Inputs, Buttons):** `12px` to `14px` for structural stability.
- **Badges, Tags, and Status Chips:** Full pill (`9999px`) rounding to visually separate metadata from tap targets.

## Components

### Buttons
- **Primary POS Action:** Background `#7A0C10`, text `#FFFFFF`, radius 14px, minimum height 52px. Active press scales down slightly (`0.98`) with background shifting to `#9F1239`.
- **Secondary (Trade-in / Installment):** Background `#FDF2F2`, border 1px solid `#9F1239`, text `#7A0C10`, radius 14px.
- **Ghost Utility (Barcode / Print):** Background transparent, text `#64748B`, 1px solid `#E2E8F0`.

### Cards & Retail Line Items
- Pure `#FFFFFF` background, 16px corner radius, framed by a delicate 1px `#E2E8F0` border.
- **Product Card Layout:** Device thumbnail at top or left (80x80px inside a `#F8FAFC` enclosure), device title in `headline-sm`, storage/color in `body-sm` (`#64748B`), and final retail price highlighted using `display-currency-mobile` in `#7A0C10`.

### Status Badges & Chips
- **Success (Stocked / Paid):** Fill `#DCFCE7`, text `#16A34A`, border 1px solid `rgba(22, 163, 74, 0.2)`.
- **Pending (Checking Credit / Reserved):** Fill `#FEF3C7`, text `#D97706`, border 1px solid `rgba(217, 119, 6, 0.2)`.
- **Error (Out of Stock / Refused):** Fill `#FEE2E2`, text `#DC2626`, border 1px solid `rgba(220, 38, 38, 0.2)`.

### Form Fields & Search Bars
- Background `#FFFFFF`, border 1px solid `#E2E8F0`, corner radius 12px, vertical height 48px.
- **Focused State:** Border transitions to `#7A0C10` with a subtle 3px ring of `#FDF2F2`.
- Integrated barcode scanner icon docked inside the trailing edge of search inputs for rapid warehouse and retail lookup.

### POS Sticky Order Footer
- Docked flush to the display base with top border 1px solid `#E2E8F0` and Level 2 elevation.
- Contains total cart sum on the left (`display-currency`) and a wide primary "Thanh toán" action button on the right for ergonomic checkout.