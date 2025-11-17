export interface TypeDetectionStats {
  totalColumns: number;
  detectedTypes: {
    numeric: number;
    categorical: number;
    date: number;
    datetime: number;
    time: number;
    boolean: number;
    currency: number;
    percentage: number;
    email: number;
    url: number;
    phone: number;
    zip_code: number;
    ip_address: number;
    uuid: number;
    json: number;
    latitude: number;
    longitude: number;
    text: number;
    empty: number;
    mixed: number;
    unknown: number;
  };
  averageConfidence: number;
  highConfidence: number; // > 0.8
  mediumConfidence: number; // 0.5 - 0.8
  lowConfidence: number; // < 0.5
}

export interface TypeDetectionProgress {
  current: number;
  total: number;
  stage: 'initializing' | 'detecting' | 'analyzing' | 'complete';
  message: string;
}

export type DataTypeCategory = 'numeric' | 'categorical' | 'temporal' | 'identifier' | 'geospatial' | 'special' | 'other';

export interface DataTypeInfo {
  type: string;
  category: DataTypeCategory;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}