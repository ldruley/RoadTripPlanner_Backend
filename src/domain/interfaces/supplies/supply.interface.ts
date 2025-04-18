import { SupplyCategory } from '../../../common/enums';

/**
 * Interface for supply response
 */
export interface SupplyResponse {
  supply_id: number;
  name: string;
  category: SupplyCategory;
  created_at: Date;
}

/**
 * Interface for supplies with quantities (for trip or stint)
 */
export interface SupplyWithQuantity extends SupplyResponse {
  quantity: number;
  notes?: string;
}
