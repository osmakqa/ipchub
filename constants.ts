
export const AREAS = [
  "OBGyne Ward",
  "NICU",
  "PICU",
  "Pedia Ward",
  "Pedia ICU",
  "Cohort",
  "Surgery Ward",
  "6th Floor Ward",
  "7th Floor",
  "Dialysis Unit",
  "Chemotherapy Unit",
  "Medicine Ward",
  "ICU",
  "Ambulatory Care Medicine Complex",
  "Emergency Room Complex",
  "Surgical Care Complex",
  "LRDR",
  "Infectious Ward",
  "Surgery Isolation Room",
  "Medicine Isolation Room",
  "Pediatric Isolation Room",
  "ER Isolation Room",
  "Other (specify)"
];

export const NOTIFIABLE_DISEASES = [
  "Acute Bloody Diarrhea",
  "Acute Encephalitis Syndrome",
  "Acute Flaccid Paralysis (Poliomyelitis)",
  "Acute Hemorrhagic Fever Syndrome",
  "Acute Viral Hepatitis",
  "Adverse Event Following Immunization",
  "Anthrax",
  "Bacterial Meningitis",
  "Chikungunya Viral Disease",
  "Cholera",
  "COVID-19",
  "Dengue",
  "Dengvaxia",
  "Diphtheria",
  "Hand, Foot and Mouth Disease",
  "Human Avian Influenza",
  "Influenza-like Illness",
  "Leptospirosis",
  "Malaria",
  "Measles",
  "Meningococcal Disease",
  "Neonatal Tetanus",
  "Non-neonatal Tetanus",
  "Paralytic Shellfish Poisoning",
  "Pertussis",
  "Rabies",
  "Rotavirus",
  "Severe Acute Respiratory Syndrome",
  "Typhoid and Paratyphoid Fever",
  "Zika Virus",
  "Other (specify)"
];

export const HAI_TYPES = [
  "Healthcare-Associated Pneumonia",
  "Catheter-Associated UTI",
  "Surgical Site Infection",
  "Ventilator Associated Pneumonia",
  "Blood Stream Infection",
  "Sepsis Neonatorum",
  "Catheter-Related Blood Stream Infections",
  "Other (specify)"
];

export const ISOLATION_AREAS = [
  "Infectious Ward",
  "Medicine Isolation Room",
  "Surgery Isolation Room",
  "Pedia Isolation Room",
  "7th Floor (as isolation)",
  "Other (specify)"
];

export const PATIENT_OUTCOMES = [
  "Admitted",
  "Discharged",
  "Expired",
  "Transferred",
  "ER-level"
];

// --- PTB SPECIFIC CONSTANTS ---

export const EMBO_BARANGAYS = [
  "Pembo",
  "Comembo",
  "Cembo",
  "East Rembo",
  "West Rembo",
  "South Cembo",
  "Pitogo",
  "Post Proper Northside",
  "Post Proper Southside",
  "Rizal"
];

export const BARANGAYS = [
  // District 1
  "Bangkal", "Bel-Air", "Carmona", "Dasmarinas", "Forbes Park", 
  "Kasilawan", "La Paz", "Magallanes", "Olympia", "Palanan", 
  "Pio del Pilar", "Poblacion", "San Antonio", "San Isidro", 
  "San Lorenzo", "Santa Cruz", "Singkamas", "Tejeros", "Urdaneta", "Valenzuela",
  // District 2
  "Guadalupe Nuevo", "Guadalupe Viejo", "Pinagkaisahan",
  // Embo Areas
  ...EMBO_BARANGAYS
].sort();

export const CIVIL_STATUS = [
  "Single", "Married", "Widowed", "Separated", "Divorced"
];

export const PTB_OUTCOMES = [
  "Admitted",
  "Discharged",
  "Expired",
  "For Admission"
];

export const COMORBIDITIES = [
  "Diabetes Mellitus",
  "Substance Abuse",
  "Liver Disease",
  "Renal Disease",
  "Autoimmune Disease",
  "Malignancy",
  "Other"
];


// CRBSI Specific Constants
export const CATHETER_TYPES = [
  "Non-tunneled CVC",
  "Tunneled CVC",
  "PICC",
  "Implanted port",
  "Hemodialysis catheter",
  "Other (specify)"
];

export const LUMEN_COUNTS = [
  "Single",
  "Double",
  "Triple",
  "Quad"
];

export const INSERTION_SITES = [
  "Internal jugular",
  "Subclavian",
  "Femoral",
  "Basilic",
  "Cephalic",
  "Radial / Femoral (arterial)",
  "Other (specify)"
];

export const CATHETER_PURPOSES = [
  "Medications",
  "TPN",
  "Hemodynamic monitoring",
  "Hemodialysis",
  "Mixed use",
  "Other (Specify)"
];

export const CLINICAL_SIGNS = [
  "Fever (>38C)",
  "Chills",
  "Hypotension",
  "Infant <1yr: Fever (>38C)",
  "Infant <1yr: Hypothermia (<366C)",
  "Infant <1yr: Apnea",
  "Infant <1yr: Bradycardia"
];

// SSI Specific Constants
export const SURGICAL_PROCEDURES = [
  // General / Abdominal / Soft Tissue (30-day)
  "APPY – Appendectomy",
  "BILI – Biliary tract surgery",
  "CHOL – Cholecystectomy",
  "COLO – Colon surgery",
  "REC – Rectal surgery",
  "SB – Small bowel surgery",
  "GAST – Gastric surgery",
  "HYST – Abdominal hysterectomy",
  "VHYS – Vaginal hysterectomy",
  "HER – Herniorrhaphy",
  "VENT – Ventral hernia repair (no mesh left)",
  "SPLE – Splenectomy",
  "LIVER – Liver surgery",
  "PAN – Pancreatic surgery",
  // Obstetric / Gynecologic (30-day)
  "CSEC – Cesarean section",
  "OVRY – Ovarian surgery",
  // ENT / Minor (30-day)
  "NECK – Neck surgery",
  "THYR – Thyroid surgery",
  "LAM – Laminectomy (no implant)",
  // Orthopedic (90-day)
  "HPRO – Hip prosthesis",
  "KPRO – Knee prosthesis",
  "FX – Fracture repair",
  "FUSN – Spinal fusion",
  "LAM – Laminectomy with implant",
  // Cardiothoracic (90-day)
  "CABG – Coronary artery bypass graft",
  "CARD – Cardiac surgery",
  "VASC – Vascular surgery",
  "AAA – Abdominal aortic aneurysm repair",
  "THOR – Thoracic surgery",
  // Neurosurgery (90-day)
  "CRAN – Craniotomy",
  "VSHN – Ventricular shunt",
  // Breast / Reconstructive (90-day)
  "BRST – Breast surgery with implant or expander"
];

export const SSI_TISSUE_LEVELS = [
  "Skin and subcutaneous tissue only",
  "Deep soft tissue (fascia and/or muscle)",
  "Organ/space deeper than fascia or muscle"
];

export const SSI_FINDINGS = [
  "Purulent drainage present",
  "Spontaneous wound dehiscence",
  "Incision deliberately opened by surgeon/physician",
  "Abscess seen on gross examination",
  "Abscess or collection seen on imaging",
  "Other evidence of infection (specify)",
  "None of the above"
];

export const SSI_SPECIMEN_SOURCES = [
  "Superficial incision / subcutaneous tissue",
  "Deep soft tissue",
  "Organ/space",
  "Drain fluid",
  "Other (specify)"
];

export const SSI_CLINICAL_SIGNS = [
  "Localized pain or tenderness",
  "Localized swelling",
  "Erythema",
  "Heat",
  "Fever",
  "None documented"
];

export const SSI_ORGAN_SPACES = [
  "Intra-abdominal",
  "Endometritis",
  "Mediastinitis",
  "Joint / prosthetic space",
  "Central nervous system",
  "Cardiovascular space",
  "Other (specify)"
];

export const SSI_EVIDENCE = [
  "Purulent drainage from drain placed into organ/space",
  "Organism identified from organ/space specimen",
  "Abscess or infection on imaging",
  "Gross anatomic or histopathologic evidence",
  "None of the above"
];

// EPINet Constants
export const JOB_CATEGORIES = [
  "Doctor (VMO/HMO)",
  "Doctor (MO/intern/resident)",
  "Medical Student",
  "Nurse (RN, APN, etc)",
  "Nursing Student",
  "Nursing Assistant",
  "Community health staff",
  "Orderly/ward/trolley person",
  "Blood collector",
  "Laboratory/pathology staff",
  "Technologist (non-lab)",
  "Dentist",
  "Dental therapist/nurse",
  "Housekeeping",
  "Ambulance staff/paramedic",
  "Other Student",
  "Other"
];

export const INJURY_LOCATIONS = [
  "Ward/nursery/patient's room",
  "Dental cubicle",
  "Outside patient room (hallway, station)",
  "Emergency department",
  "Intensive/critical care",
  "Operating room/anaesthetic/recovery",
  "Community clinic/outpatient clinic",
  "Blood collection room",
  "Dialysis facility",
  "Procedure areas (imaging, cath lab)",
  "Pathology/clinical labs",
  "Autopsy",
  "Nonclinical-service/utility",
  "Delivery/labour ward",
  "Patient's home",
  "Other"
];

export const DEVICES_NEEDLE = [
  "Disposable syringe needle - Insulin",
  "Disposable syringe needle - Tuberculin",
  "Disposable syringe needle - 24/25-gauge",
  "Disposable syringe needle - 23-gauge",
  "Disposable syringe needle - 22-gauge",
  "Disposable syringe needle - 21-gauge",
  "Disposable syringe needle - 20-gauge",
  "Disposable syringe needle - Other",
  "Pre-filled/cartridge syringe",
  "Blood gas syringe",
  "Needle on IV line (includes piggbacks & IV line connectors)",
  "Butterfly/winged steel needle",
  "Venous or arterial cannula/ stylet",
  "Vacuum tube blood collection holder/needle",
  "Spinal/epidural needle",
  "Unattached hypodermic needle",
  "Biopsy needle",
  "Bone marrow needle",
  "Needle, not sure what kind",
  "Other needle"
];

export const DEVICES_SURGICAL = [
  "Lancet (finger or heel sticks)",
  "Suture needle",
  "Scalpel, reusable",
  "Scalpel, disposable",
  "Razor",
  "Pipette (plastic)",
  "Scissors",
  "Electrocautery device",
  "Bone cutter",
  "Bone chip",
  "Towel clip",
  "Microtome blade",
  "Trocar",
  "Vacuum tube (plastic)",
  "Test tube (plastic)",
  "Fingernails/Teeth",
  "Retractors, skin/bone hooks",
  "Staples/steel sutures",
  "Wire (suture/fixation/guide wire)",
  "Pin (fixation, guide pin)",
  "Drill bits/burr",
  "Haemostat/artery forceps/clamps",
  "Sharp item, not sure what kind",
  "Other sharp item"
];

export const DEVICES_GLASS = [
  "Medication ampoule",
  "Medication vial (small volume with rubber stopper)",
  "Medication/IV bottle (large volume)",
  "Pipette (glass)",
  "Vacuum tube (glass)",
  "Test tube (glass)",
  "Capillary tube",
  "Glass slide",
  "Glass item, not sure what kind",
  "Other glass item"
];
