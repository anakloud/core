export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string | null;
  defaultDurationMins: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServicesResult {
  services: ServiceItem[];
}

export interface ServiceInput {
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  type?: string | null;
  defaultDurationMins?: number | null;
  isActive?: boolean;
}
