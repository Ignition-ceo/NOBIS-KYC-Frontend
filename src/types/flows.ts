// Flow data types matching the DB schema

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  included_modules_json: string[];
  includes_text: string;
  risk_level_count: number;
  sanctions_level_count: number;
  created_at: string;
}

export interface Flow {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  plan_id: string;
  max_uses: number | null;
  uses_consumed: number;
  status: 'active' | 'inactive';
  fraud_prevention_enabled: boolean;
  aml_pep_enabled: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  plan?: SubscriptionPlan;
  modules?: FlowModule[];
}

export interface FlowModule {
  id: string;
  flow_id: string;
  module_key: string;
  enabled: boolean;
}

export interface ModuleCatalog {
  module_key: string;
  label: string;
  helper: string;
  subtext: string;
}

// Demo data
export const CURRENT_TENANT_ID = 'tenant_demo';

export const MODULE_CATALOG: ModuleCatalog[] = [
  { module_key: 'identity_document', label: 'Identity Document', helper: 'ID card • Passport • Residence permit • Driver\'s license', subtext: '' },
  { module_key: 'selfie', label: 'Selfie', helper: 'Face verification selfie', subtext: '' },
  { module_key: 'email_verification', label: 'Email Verification', helper: 'Email address verification', subtext: '' },
  { module_key: 'phone_verification', label: 'Phone Verification', helper: 'Phone number verification', subtext: '' },
  { module_key: 'poa_verification', label: 'POA Verification', helper: 'Proof of address document', subtext: '' },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_simplekyc',
    name: 'SimpleKYC',
    description: 'Core KYC checks for everyday onboarding',
    included_modules_json: ['identity_document', 'selfie', 'email_verification', 'phone_verification', 'poa_verification'],
    includes_text: 'phone, email, idDocument, selfie, proofOfAddress',
    risk_level_count: 1,
    sanctions_level_count: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'plan_enhancedkyc',
    name: 'EnhancedKYC',
    description: 'Adds deeper risk and sanctions support',
    included_modules_json: ['identity_document', 'selfie', 'email_verification', 'phone_verification', 'poa_verification'],
    includes_text: 'phone, email, idDocument, selfie, proofOfAddress',
    risk_level_count: 2,
    sanctions_level_count: 2,
    created_at: new Date().toISOString(),
  },
];

export const DEMO_FLOWS: Flow[] = [
  {
    id: 'flow_hb_test',
    tenant_id: 'tenant_demo',
    name: 'HB TEST Flow',
    description: 'New update',
    plan_id: 'plan_simplekyc',
    max_uses: 1000,
    uses_consumed: 54,
    status: 'active',
    fraud_prevention_enabled: true,
    aml_pep_enabled: true,
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-02-01T14:22:00Z',
    plan: SUBSCRIPTION_PLANS[0],
    modules: [
      { id: 'fm_hb_1', flow_id: 'flow_hb_test', module_key: 'identity_document', enabled: true },
      { id: 'fm_hb_2', flow_id: 'flow_hb_test', module_key: 'selfie', enabled: true },
      { id: 'fm_hb_3', flow_id: 'flow_hb_test', module_key: 'email_verification', enabled: true },
      { id: 'fm_hb_4', flow_id: 'flow_hb_test', module_key: 'phone_verification', enabled: true },
      { id: 'fm_hb_5', flow_id: 'flow_hb_test', module_key: 'poa_verification', enabled: true },
    ],
  },
  {
    id: 'flow_wipay_test',
    tenant_id: 'tenant_demo',
    name: 'Wipay Test',
    description: 'For wipay testing',
    plan_id: 'plan_simplekyc',
    max_uses: 500,
    uses_consumed: 120,
    status: 'active',
    fraud_prevention_enabled: true,
    aml_pep_enabled: false,
    created_at: '2025-01-10T08:00:00Z',
    updated_at: '2025-01-28T16:45:00Z',
    plan: SUBSCRIPTION_PLANS[0],
    modules: [
      { id: 'fm_wi_1', flow_id: 'flow_wipay_test', module_key: 'identity_document', enabled: true },
      { id: 'fm_wi_2', flow_id: 'flow_wipay_test', module_key: 'selfie', enabled: true },
      { id: 'fm_wi_3', flow_id: 'flow_wipay_test', module_key: 'email_verification', enabled: true },
      { id: 'fm_wi_4', flow_id: 'flow_wipay_test', module_key: 'phone_verification', enabled: true },
      { id: 'fm_wi_5', flow_id: 'flow_wipay_test', module_key: 'poa_verification', enabled: true },
    ],
  },
];
