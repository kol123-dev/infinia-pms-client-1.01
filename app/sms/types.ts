export interface LandlordProfile {
    id: number;
}

export interface AgentProfile {
    id: number;
    managed_landlords: { id: number }[];
}

export interface User {
    id: number;
    email: string;
    full_name: string;
    phone: string;
    role: 'landlord' | 'agent' | 'tenant' | 'admin';
    is_active: boolean;
    landlord_profile?: LandlordProfile;
    agent_profile?: AgentProfile;
}

export interface Tenant {
    id: number;
    tenant_id: string;
    user: User;
    landlord: {
        id: number;
        landlord_id: string;
        business_name: string;
        user: {
            id: number;
            email: string;
            full_name: string;
        };
    };
    phone: string;
}

export interface TenantGroup {
    id: number;
    name: string;
    description: string | null;
    landlord: {
        id: number;
        landlord_id: string;
        business_name: string;
        user: {
            id: number;
            email: string;
            full_name: string;
        };
    };
    tenant_count: number;
    created_at: string;
    updated_at: string;
}

export interface Recipient {
  id: string
  user: User
}

export type SmsStatus = 'delivered' | 'sent' | 'failed' | 'queued'

export interface SmsMessage {
  id: string
  body: string
  sent_at: string
  status: SmsStatus
  recipients: Recipient[]
}

export interface SmsTemplate {
    id: number
    name: string
    content: string
    landlord: number
    created_at: string
    updated_at: string
}