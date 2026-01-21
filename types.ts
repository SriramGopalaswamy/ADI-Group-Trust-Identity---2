export interface BatchEntry {
  batchCode: string;
  reportUrl: string;
  productName?: string;
  testDate?: string;
  labName?: string;
}

export interface Submission {
  id: string;
  timestamp: string; // ISO string
  fullName: string;
  mobile: string;
  email?: string;
  pinCode: string;
  batchCode: string;
  matchedUrl?: string;
  status: 'SUCCESS' | 'FAILURE';
  deviceType: string;
  packImage?: string; // Base64
}

export interface AdminFilter {
  startDate: string | null;
  endDate: string | null;
  searchQuery: string;
}
