/**
 * Interface representing a trip
 */
export interface TripResponse {
  trip_id: number;
  title: string;
  description?: string;
  start_date?: Date;
  end_date?: Date;
  total_distance?: number;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
  creator_id: number;
}

/**
 * Interface for trip summary used in trip listing
 */
export interface TripSummary {
  trip_id: number;
  title: string;
  description?: string;
  start_date?: Date;
  end_date?: Date;
  total_distance?: number;
  stint_count: number;
  stop_count: number;
  creator_id: number;
}
