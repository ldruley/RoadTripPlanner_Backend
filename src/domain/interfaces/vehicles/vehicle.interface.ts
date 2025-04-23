/**
 * Interface for vehicle response
 */
export interface VehicleResponse {
  vehicle_id: number;
  name: string;
  year: number;
  fuel_capacity: number;
  mpg: number;
  created_at: Date;
  updated_at: Date;
  owner_id: number;
  calculated_range?: number;
}
