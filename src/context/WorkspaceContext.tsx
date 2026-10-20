import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * ============================================================================
 * 🔒 INVARIANTE STRICTE CARVANA HOLDING (ANCORE NON-NEGOCIABILE)
 * ============================================================================
 */
export const CARVANA_INVARIANTS = {
  VAT_RATE: 0.21, // Cota legală strictă 21% conform regulilor holding
  GUARANTEE_DEPOSIT_NAME: "Cont de Garanție", // Termen strict autorizat (Banca Transilvania)
  GUARANTEE_DEPOSIT_BANK: "Banca Transilvania (BT iPay / Transfer OP)",
  SPECIAL_MARGIN_ARTICLE: "Art. 312 Cod Fiscal (Regimul Special al Marjei)",
  WARRANTY_MAX_MONTHS: 36,
  DEMO_SHOWROOM_WATERMARK: "RXM AUTOMOBILE SRL"
} as const;

export interface WorkspaceColumnVisibility {
  specs: boolean;
  pricing: boolean;
  status: boolean;
  olx: boolean;
  social: boolean;
  deadlines: boolean;
}

export interface WorkspaceSettings {
  density: 'compact' | 'comfortable';
  currency: 'EUR' | 'RON';
  autoScanDocuments: boolean; // 🚀 Scanare automată CIV / Talon la încărcare document
  visibleColumns: WorkspaceColumnVisibility;
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  density: 'comfortable',
  currency: 'EUR',
  autoScanDocuments: true, // Implicit activat (recomandat dealer)
  visibleColumns: {
    specs: true,
    pricing: true,
    status: true,
    olx: true,
    social: true,
    deadlines: true
  }
};

const STORAGE_KEY = 'carmatik_workspace_settings_v1';

export interface WorkspaceContextType {
  settings: WorkspaceSettings;
  updateSettings: (newSettings: Partial<WorkspaceSettings>) => void;
  setAutoScanDocuments: (enabled: boolean) => void;
  toggleColumn: (columnKey: keyof WorkspaceColumnVisibility) => void;
  setDensity: (density: 'compact' | 'comfortable') => void;
  setCurrency: (currency: 'EUR' | 'RON') => void;
  resetSettings: () => void;
  invariants: typeof CARVANA_INVARIANTS;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WorkspaceSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_WORKSPACE_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          density: parsed.density === 'compact' ? 'compact' : 'comfortable',
          currency: parsed.currency === 'RON' ? 'RON' : 'EUR',
          autoScanDocuments: parsed.autoScanDocuments !== undefined ? Boolean(parsed.autoScanDocuments) : DEFAULT_WORKSPACE_SETTINGS.autoScanDocuments,
          visibleColumns: {
            ...DEFAULT_WORKSPACE_SETTINGS.visibleColumns,
            ...(parsed.visibleColumns || {})
          }
        };
      }
    } catch (e) {
      console.warn('Eroare la citirea setărilor de workspace:', e);
    }
    return DEFAULT_WORKSPACE_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Eroare la salvarea setărilor de workspace:', e);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<WorkspaceSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      visibleColumns: {
        ...prev.visibleColumns,
        ...(newSettings.visibleColumns || {})
      }
    }));
  };

  const setAutoScanDocuments = (enabled: boolean) => {
    updateSettings({ autoScanDocuments: enabled });
  };

  const toggleColumn = (columnKey: keyof WorkspaceColumnVisibility) => {
    setSettings(prev => ({
      ...prev,
      visibleColumns: {
        ...prev.visibleColumns,
        [columnKey]: !prev.visibleColumns[columnKey]
      }
    }));
  };

  const setDensity = (density: 'compact' | 'comfortable') => {
    updateSettings({ density });
  };

  const setCurrency = (currency: 'EUR' | 'RON') => {
    updateSettings({ currency });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_WORKSPACE_SETTINGS);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        settings,
        updateSettings,
        setAutoScanDocuments,
        toggleColumn,
        setDensity,
        setCurrency,
        resetSettings,
        invariants: CARVANA_INVARIANTS
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    return {
      settings: DEFAULT_WORKSPACE_SETTINGS,
      updateSettings: () => {},
      setAutoScanDocuments: () => {},
      toggleColumn: () => {},
      setDensity: () => {},
      setCurrency: () => {},
      resetSettings: () => {},
      invariants: CARVANA_INVARIANTS
    };
  }
  return context;
};

export const EUR_TO_RON_RATE = 4.975;

export const formatPriceWithCurrency = (priceEur: number, currency: 'EUR' | 'RON'): string => {
  if (currency === 'RON') {
    const priceRon = Math.round(priceEur * EUR_TO_RON_RATE);
    return `${priceRon.toLocaleString('ro-RO')} lei`;
  }
  return `${priceEur.toLocaleString('ro-RO')} €`;
};
