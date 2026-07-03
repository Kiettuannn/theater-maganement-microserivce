export const DOCUMENT_TYPE_CONFIG = {
  POLICY: { 
    label: "Policy", 
    className: "bg-red-100 text-red-700 border-red-300",
    value: "POLICY"
  },
  HANDBOOK: { 
    label: "Handbook", 
    className: "bg-blue-100 text-blue-700 border-blue-300",
    value: "HANDBOOK"
  },
  GUIDELINE: { 
    label: "Guideline", 
    className: "bg-green-100 text-green-700 border-green-300",
    value: "GUIDELINE"
  },
  FAQ: { 
    label: "FAQ", 
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
    value: "FAQ"
  },
} as const;

export const STATUS_CONFIG = {
  ACTIVE: { 
    label: "Active", 
    className: "bg-emerald-100 text-emerald-700 border-emerald-300" 
  },
  INACTIVE: { 
    label: "Inactive", 
    className: "bg-slate-100 text-slate-700 border-slate-300" 
  },
  PROCESSING: { 
    label: "Processing", 
    className: "bg-blue-100 text-blue-700 border-blue-300" 
  },
  FAILED: { 
    label: "Failed", 
    className: "bg-red-100 text-red-700 border-red-300" 
  },
} as const;

export const DOCUMENT_TYPES = Object.values(DOCUMENT_TYPE_CONFIG);

export type DocumentType = keyof typeof DOCUMENT_TYPE_CONFIG;
export type DocumentStatus = keyof typeof STATUS_CONFIG;
