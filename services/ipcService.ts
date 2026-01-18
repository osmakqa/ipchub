import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Configuration
 */
const SUPABASE_URL = "https://tinxrfvnnmsovrrvldjg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbnhyZnZubm1zb3ZycnZsZGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDM2NDEsImV4cCI6MjA4MzkxOTY0MX0.GtJ-9GcImeQpCLVjbmQVxCKhwpFJilzADveAtepsq-o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * GOOGLE SHEETS BACKUP CONFIGURATION
 */
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbykB9iO_9uU-vo-4rRFjs7VKJLdhsZij3zHY3IlTekmBw694XWHFRlSa493xZyEkH7F/exec"; 

// --- TABLE MAPPING ---

export const TYPE_TO_TABLE: Record<string, string> = {
  'HAI': 'reports_hai',
  'Notifiable Disease': 'report_notif',
  'Needlestick Injury': 'reports_needlestick',
  'Isolation Admission': 'reports_isolation',
  'TB Report': 'reports_tb',
  'Culture Report': 'reports_culture',
  'hai': 'reports_hai',
  'notifiable': 'report_notif',
  'needlestick': 'reports_needlestick',
  'isolation': 'reports_isolation',
  'tb': 'reports_tb',
  'culture': 'reports_culture'
};

// --- UTILS ---

const toTitleCase = (str: string) => {
  if (!str) return str;
  return str.trim().split(/\s+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

/**
 * Clean data for Supabase
 */
const sanitizeData = (data: any) => {
  const sanitized = { ...data };
  const nameFields = ['lastName', 'firstName', 'middleName', 'reporterName', 'hcwName', 'organism', 'barangay', 'city', 'supervisorName', 'ipcName', 'patientName', 'nurseInCharge'];
  
  // CRITICAL: We must NOT delete 'id' if it is a valid ID
  if (sanitized.id && typeof sanitized.id === 'string') {
    if (sanitized.id.includes('temp') || sanitized.id.includes('form') || sanitized.id.length < 5) {
      delete sanitized.id;
    }
  }

  for (const key in sanitized) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === "") {
        sanitized[key] = null;
        continue;
      }
      if (nameFields.includes(key)) {
        sanitized[key] = toTitleCase(trimmed);
      } else {
        sanitized[key] = trimmed;
      }
    }
    // Preserving non-empty arrays for JSONB/Text[] columns
    if (Array.isArray(value) && value.length === 0) {
      sanitized[key] = [];
    }
  }
  return sanitized;
};

// --- ACCESSORS ---

export const getHAIReports = async () => {
  const { data } = await supabase.from('reports_hai').select('*').eq('validationStatus', 'validated');
  return data || [];
};

export const getNotifiableReports = async () => {
  const { data } = await supabase.from('report_notif').select('*').eq('validationStatus', 'validated');
  return data || [];
};

export const getNeedlestickReports = async () => {
  const { data } = await supabase.from('reports_needlestick').select('*').eq('validationStatus', 'validated');
  return data || [];
};

export const getIsolationReports = async () => {
  const { data } = await supabase.from('reports_isolation').select('*').eq('validationStatus', 'validated');
  return data || [];
};

export const getTBReports = async () => {
  const { data } = await supabase.from('reports_tb').select('*').eq('validationStatus', 'validated');
  return data || [];
};

export const getCultureReports = async () => {
  const { data } = await supabase.from('reports_culture').select('*').eq('validationStatus', 'validated');
  return data || [];
};

export const getCensusLogs = async () => {
  const { data } = await supabase.from('census_logs').select('*').order('date', { ascending: false });
  return data || [];
};

export const getActionPlans = async () => {
  const { data } = await supabase.from('action_plans').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const getHandHygieneAudits = async () => {
  const { data } = await supabase.from('audit_hand_hygiene').select('*');
  return data || [];
};

export const getBundleAudits = async () => {
  const { data } = await supabase.from('audit_bundles').select('*');
  return data || [];
};

export const getAreaAudits = async () => {
  const { data } = await supabase.from('audit_area').select('*');
  return data || [];
};

export const getAuditSchedules = async () => {
  const { data } = await supabase.from('audit_schedules').select('*').order('date', { ascending: true });
  return data || [];
};

// --- SUBMISSIONS ---

export const submitCensusLog = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('census_logs').upsert(sanitized);
  return !error;
};

export const submitHHAudit = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('audit_hand_hygiene').insert([sanitized]);
  return !error;
};

export const submitBundleAudit = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('audit_bundles').insert([{ ...sanitized, dateLogged: new Date().toISOString() }]);
  return !error;
};

export const submitAreaAudit = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('audit_area').insert([{ ...sanitized, dateLogged: new Date().toISOString() }]);
  return !error;
};

export const submitActionPlan = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('action_plans').insert([{ ...sanitized, status: 'pending' }]);
  return !error;
};

export const updateActionPlanStatus = async (id: string, status: string) => {
  const { error } = await supabase.from('action_plans').update({ status }).eq('id', id);
  return !error;
};

export const submitAuditSchedule = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('audit_schedules').insert([sanitized]);
  return !error;
};

// --- DELETION ---

/**
 * Enhanced global delete function
 */
export const deleteRecord = async (table: string, id: string) => {
  if (!id) {
    console.error("deleteRecord called without ID for table:", table);
    throw new Error("Deletion Failed: Missing record ID.");
  }
  
  console.log(`Starting deletion: Table=${table}, ID=${id}`);

  // We use .select() to force Supabase to return the row it deleted.
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .select();
  
  if (error) {
    console.error("Supabase API Error during delete:", error);
    throw new Error(`Database Error: ${error.message} (Code: ${error.code})`);
  }

  if (!data || data.length === 0) {
    console.warn("Delete request returned success but 0 rows were actually removed.");
    throw new Error("Deletion Failed: Record not found or database permissions (RLS) are blocking this action.");
  }

  console.log("Deletion successful:", data[0]);
  return true;
};

export const deleteAuditSchedule = async (id: string) => {
  return deleteRecord('audit_schedules', id);
};

// --- BACKUP / SYNC ---

export const syncToGoogleSheets = async (data: any) => {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) return false;
  try {
    await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return true;
  } catch (error) {
    return false;
  }
};

// --- PENDING / COORDINATOR WORKFLOW ---

export const getPendingReports = async () => {
  const [hai, isolation, tb, culture, notifiable, needlestick] = await Promise.all([
    supabase.from('reports_hai').select('*').eq('validationStatus', 'pending'),
    supabase.from('reports_isolation').select('*').eq('validationStatus', 'pending'),
    supabase.from('reports_tb').select('*').eq('validationStatus', 'pending'),
    supabase.from('reports_culture').select('*').eq('validationStatus', 'pending'),
    supabase.from('report_notif').select('*').eq('validationStatus', 'pending'),
    supabase.from('reports_needlestick').select('*').eq('validationStatus', 'pending'),
  ]);

  return {
    hai: hai.data || [],
    isolation: isolation.data || [],
    tb: tb.data || [],
    culture: culture.data || [],
    notifiable: notifiable.data || [],
    needlestick: needlestick.data || []
  };
};

export const deletePendingReport = async (type: string, id: string) => {
  const table = TYPE_TO_TABLE[type] || `reports_${type}`;
  return deleteRecord(table, id);
};

export const validateReport = async (type: string, id: string, coordinator: string, updatedData?: any) => {
  const table = TYPE_TO_TABLE[type] || `reports_${type}`;
  const sanitized = sanitizeData(updatedData || {});
  const entry = { ...sanitized, validationStatus: 'validated', validatedBy: coordinator };

  const { error } = await supabase.from(table).update(entry).eq('id', id);
  if (error) {
      const msg = error.message || JSON.stringify(error);
      throw new Error(`Validation Failed: ${msg}`);
  }

  // Backup validated reports to sheets
  if (['notifiable', 'Notifiable Disease', 'tb', 'TB Report'].includes(type)) {
    await syncToGoogleSheets({ ...entry, id });
  }

  return true;
};

export const submitReport = async (formType: string, data: any): Promise<boolean> => {
  const table = TYPE_TO_TABLE[formType];
  if (!table) throw new Error(`Invalid form type: ${formType}`);
  
  const sanitizedData = sanitizeData(data);
  const entry = { 
    ...sanitizedData, 
    dateReported: new Date().toISOString().split('T')[0], 
    validationStatus: 'pending' 
  };
  
  const { error } = await supabase.from(table).insert([entry]);
  if (error) {
      const errorDetail = `[Code: ${error.code}] ${error.code.includes('duplicate key') ? 'A record with this identifier already exists (Potential Duplicate Hospital Number).' : error.message}`;
      throw new Error(errorDetail);
  }

  // Initial entry backup to sheets
  if (['Notifiable Disease', 'TB Report'].includes(formType)) {
    await syncToGoogleSheets(entry);
  }

  return true;
};

// --- UPDATE HANDLERS ---

export const updateHAIReport = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('reports_hai').update(sanitized).eq('id', data.id);
  return !error;
};

export const updateNotifiableReport = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('report_notif').update(sanitized).eq('id', data.id);
  return !error;
};

export const updateNeedlestickReport = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('reports_needlestick').update(sanitized).eq('id', data.id);
  return !error;
};

export const updateIsolationReport = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('reports_isolation').update(sanitized).eq('id', data.id);
  return !error;
};

export const updateTBReport = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('reports_tb').update(sanitized).eq('id', data.id);
  return !error;
};

export const updateCultureReport = async (data: any) => {
  const sanitized = sanitizeData(data);
  const { error } = await supabase.from('reports_culture').update(sanitized).eq('id', data.id);
  return !error;
};

// --- CALCULATIONS ---

export const calculateInfectionRates = (censusLogs: any[], infections: any[]) => {
  const sum = (arr: any[], key: string) => arr.reduce((a, b) => a + (Number(b[key]) || 0), 0);
  const count = (type: string, area?: string) => 
    infections.filter(inf => inf.haiType === type && (area ? inf.area === area : true)).length;

  const getRatesForArea = (areaLabel: string, areaKeyPrefix: string) => {
    const isOverall = areaLabel === "Overall";
    const patientDays = isOverall ? sum(censusLogs, 'overall') : sum(censusLogs, areaKeyPrefix);
    const ventDaysKey = isOverall ? 'overallVent' : `${areaKeyPrefix}Vent`;
    const ifcDaysKey = isOverall ? 'overallIfc' : `${areaKeyPrefix}Ifc`;
    const centralLineDaysKey = isOverall ? 'overallCentral' : `${areaKeyPrefix}Central`;
    const ventDays = sum(censusLogs, ventDaysKey) || 1;
    const ifcDays = sum(censusLogs, ifcDaysKey) || 1;
    const centralDays = sum(censusLogs, centralLineDaysKey) || 1;
    const pDays = patientDays || 1;

    const vap = count("Ventilator Associated Pneumonia", isOverall ? undefined : areaLabel);
    const hap = count("Healthcare-Associated Pneumonia", isOverall ? undefined : areaLabel);
    const cauti = count("Catheter-Associated UTI", isOverall ? undefined : areaLabel);
    const clabsi = count("Catheter-Related Blood Stream Infections", isOverall ? undefined : areaLabel);

    return {
      overall: parseFloat(((vap + hap + cauti + clabsi) / pDays * 1000).toFixed(2)),
      vap: parseFloat((vap / ventDays * 1000).toFixed(2)),
      hap: parseFloat((hap / pDays * 1000).toFixed(2)),
      cauti: parseFloat((cauti / ifcDays * 1000).toFixed(2)),
      clabsi: parseFloat((clabsi / centralDays * 1000).toFixed(2))
    };
  };

  return {
    overall: getRatesForArea("Overall", "overall"),
    icu: getRatesForArea("ICU", "icu"),
    picu: getRatesForArea("PICU", "picu"),
    nicu: getRatesForArea("NICU", "nicu"),
    medicine: getRatesForArea("Medicine Ward", "medicine"),
    cohort: getRatesForArea("Cohort", "cohort")
  };
};

export const calculateAge = (dobString: string): string => {
  if (!dobString) return "";
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
  return age.toString();
};

// --- AI SERVICES ---

export const extractPatientInfoFromImage = async (base64Image: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanBase64 = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }, { text: `Extract patient info from the document image.` }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lastName: { type: Type.STRING },
            firstName: { type: Type.STRING },
            middleName: { type: Type.STRING },
            hospitalNumber: { type: Type.STRING },
            dob: { type: Type.STRING, description: "Date of birth in YYYY-MM-DD format" },
            sex: { type: Type.STRING, enum: ["Male", "Female"] }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return null; }
};

export const extractCombinedCultureReport = async (base64Image: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanBase64 = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }, { text: `Extract all culture and sensitivity results from the lab report image.` }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lastName: { type: Type.STRING },
            firstName: { type: Type.STRING },
            middleName: { type: Type.STRING },
            age: { type: Type.INTEGER },
            sex: { type: Type.STRING, enum: ["Male", "Female"] },
            organism: { type: Type.STRING },
            specimen: { type: Type.STRING },
            colonyCount: { type: Type.STRING },
            antibiotics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  mic: { type: Type.STRING },
                  interpretation: { type: Type.STRING, enum: ["S", "I", "R"] }
                },
                required: ["name", "interpretation"]
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return null; }
};

export const queryIPCAssistant = async (query: string, history: any[]): Promise<string> => {
  try {
    return "AI Assistant: This feature is currently under construction. Please check back later!";
  } catch (error) {
    return "AI Assistant offline. Please check connection.";
  }
};