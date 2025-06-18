export interface PhotoData {
  file: File;
  preview: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  rating: number;
  description: string;
  timestamp?: Date;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}
