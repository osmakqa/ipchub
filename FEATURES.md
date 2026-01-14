
# OsMak IPC Hub - Feature Documentation

The **Infection Prevention and Control Hub** is a high-performance, multi-tenant platform designed for **Ospital ng Makati**. It streamlines clinical surveillance, institutional auditing, and executive decision-making through a unified "Perspective-Driven" interface.

## 🛡️ Core Institutional Perspectives

### 1. Reporting Mode (Surveillance)
Designed for point-of-care clinicians to log incidents and manage registries.
*   **HAI Registry**: Detailed surveillance for VAP, CAUTI, CLABSI, HAP, and SSI with ward-transfer tracking.
*   **Notifiable Diseases**: Rapid reporting for 30+ epidemiological categories with disease-specific clinical data.
*   **TB Registry**: Specialized management for Pulmonary and Extra-pulmonary TB, including GeneXpert and Smear microscopy history.
*   **Isolation Census**: Real-time tracking of isolation bed occupancy and transmission-based precautions (Droplet, Airborne, Contact).
*   **Sharps & Needlestick Log**: Interactive reporting for occupational exposures using a drill-down Body Map.
*   **Antibiogram (Culture Hub)**: Centralized laboratory result tracking with MDR/XDR/PDR classification logic.

### 2. Auditing Mode (Quality & Compliance)
Designed for IPC Coordinators to conduct facility-wide safety inspections.
*   **Hand Hygiene Audit**: WHO 5 Moments direct observation tool with role-based compliance tracking.
*   **Clinical Care Bundles**: Adherence checklists for critical HAI prevention protocols (VAP/CAUTI/CLABSI).
*   **Area Safety Audit**: Systematic environmental, infrastructure, and waste management inspections.
*   **Action Plan Tracker**: Strategic correction board to assign, monitor, and resolve audit deficiencies.

### 3. Analytics Mode (Executive Briefing)
Designed for Hospital Management and the IPC Committee.
*   **Safety Leaderboard**: Ranking of clinical wards based on aggregate safety and compliance indices.
*   **Outbreak Monitor**: Real-time identification and tracking of suspected infectious clusters.
*   **Trend Analytics**: Visualization of infection rates per 1,000 device-days and organism resistance prevalence.

## 🤖 AI-Powered Intelligence (Gemini 3 Flash)

The system integrates Google GenAI to reduce manual data entry errors and speed up reporting:
*   **Patient ID Scanner**: Extracts demographics (Name, Hosp #, DOB, Sex) from hospital documents or IDs using the camera.
*   **Laboratory OCR**: Parses complex culture and sensitivity tables from photos of lab reports, automatically populating antibiotic MICs and interpretations.

## 🎨 System Highlights & UX

*   **Fluid Perspective Switcher**: A centered, sliding "pill" control in the header that transitions the entire app's logic and theme.
*   **Dynamic Theme Engine**: Visual identity shifts between **IPC Green** (Reporting), **Teal** (Auditing), and **Midnight Slate** (Analytics).
*   **Interactive Body Map**: A hierarchical selection tool for precisely localizing injury sites for occupational health logs.
*   **Coordinator Workflow**: A "Pending Validations" inbox where coordinators review and publish reports submitted by field staff.
*   **Responsive Hybrid Design**: Desktop-grade analytical power optimized for mobile "point-of-care" usage.
