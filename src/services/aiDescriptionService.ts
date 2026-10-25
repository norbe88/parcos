// =========================================================================
// PARCOS MULTI-TENANT — AI Description Sanitizer & Generation Service
// Invariante: Zero chei în browser, Backend-as-a-Proxy, TVA 21% Deductibil
// =========================================================================

import { getAdminAuthHeaders } from '../utils/adminAuth';
import { generateVehicleDescription, VehicleDescriptionParams, DescriptionTone } from '../utils/vehicleDescriptionGenerator';

export interface SanitizeDescriptionRequest {
  brand: string;
  model: string;
  versionTrim?: string;
  year: number;
  specs?: string;
  rawDescription?: string;
  tone?: DescriptionTone;
  selectedFeatures?: string[];
  vatDeductible?: boolean;
  warrantyMonths?: 12 | 24 | 36;
  tenantId?: string;
}

export interface SanitizeDescriptionResponse {
  success: boolean;
  description: string;
  tenantId?: string;
  error?: string;
  fallbackUsed?: boolean;
}

/**
 * Trimite cererea de sanitizare și generare descriere AI către backend-ul ParcOS
 * Niciun apel nu targetează Google direct din browser.
 */
export async function sanitizeVehicleDescriptionWithAi(
  params: SanitizeDescriptionRequest
): Promise<SanitizeDescriptionResponse> {
  const resolvedTenant = params.tenantId ||
    (typeof window !== 'undefined' && (localStorage.getItem('rxm_tenant_id') || localStorage.getItem('parcos_tenant_id'))) ||
    'rxm';

  try {
    const res = await fetch('/api/parcos/ai/sanitize-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': resolvedTenant,
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify({
        ...params,
        tenantId: resolvedTenant,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.description) {
        return {
          success: true,
          description: data.description,
          tenantId: data.tenantId || resolvedTenant,
          fallbackUsed: false,
        };
      }
    }
  } catch (networkErr: any) {
    console.warn('[AI Description Service] Proxy indisponibil, se aplică fallback template:', networkErr?.message);
  }

  // Fallback garantat fără erori de UI: generatorul deterministic local
  const fallbackDesc = generateVehicleDescription({
    brand: params.brand,
    model: params.model,
    versionTrim: params.versionTrim,
    year: params.year,
    vatDeductible: params.vatDeductible ?? true,
    warrantyMonths: params.warrantyMonths ?? 12,
    selectedFeatures: params.selectedFeatures,
  }, {
    tone: params.tone || 'editorial',
    includeWarranty: true,
  });

  return {
    success: true,
    description: fallbackDesc,
    tenantId: resolvedTenant,
    fallbackUsed: true,
  };
}
