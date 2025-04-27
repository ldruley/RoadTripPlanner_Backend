import { LocationCategoryCode } from '../../common/enums';

export const HERE_CATEGORY_MAP: Record<
  LocationCategoryCode,
  { name: string; here_id: string }
> = {
  [LocationCategoryCode.GAS_STATION]: {
    name: 'Gas Station',
    here_id: '700-7600-0116',
  },
  [LocationCategoryCode.CHARGING_STATION]: {
    name: 'Charging Station',
    here_id: '700-7600-0322',
  },
  [LocationCategoryCode.PARKING]: { name: 'Parking', here_id: '800-8500' },
  [LocationCategoryCode.REST_AREA]: { name: 'Rest Area', here_id: '400-4300' },
  [LocationCategoryCode.ATM]: { name: 'ATM', here_id: '700-7010-0108' },
  [LocationCategoryCode.RESTAURANT]: {
    name: 'Restaurant',
    here_id: '100-1000',
  },
  [LocationCategoryCode.CAFE]: { name: 'Cafe', here_id: '100-1100' },
  [LocationCategoryCode.FAST_FOOD]: {
    name: 'Fast Food',
    here_id: '100-1000-0009',
  },
  [LocationCategoryCode.BAR]: { name: 'Bar', here_id: '200-2000-0011' },
  [LocationCategoryCode.CASINO]: { name: 'Casino', here_id: '200-2300-0021' },
  [LocationCategoryCode.THEATER]: { name: 'Theater', here_id: '200-2200' },
  [LocationCategoryCode.HOTEL]: { name: 'Hotel', here_id: '500-5000-0053' },
  [LocationCategoryCode.MOTEL]: { name: 'Motel', here_id: '500-5000-0054' },
  [LocationCategoryCode.CAMPGROUND]: {
    name: 'Campground',
    here_id: '500-5100-0056',
  },
  [LocationCategoryCode.HOSTEL]: { name: 'Hostel', here_id: '500-5100-0055' },
  [LocationCategoryCode.LANDMARK]: { name: 'Landmark', here_id: '300-3000' },
  [LocationCategoryCode.LAKE]: { name: 'Lake', here_id: '350-3500-0304' },
  [LocationCategoryCode.BEACH]: { name: 'Beach', here_id: '550-5510-0205' },
  [LocationCategoryCode.TOURIST_ATTRACTION]: {
    name: 'Tourist Attraction',
    here_id: '300-3000-0023',
  },
  [LocationCategoryCode.HISTORICAL_MONUMENT]: {
    name: 'Historical Monument',
    here_id: '300-3000-0025',
  },
  [LocationCategoryCode.AMUSEMENT_PARK]: {
    name: 'Amusement Park',
    here_id: '550-5520-0207',
  },
  [LocationCategoryCode.ZOO]: { name: 'Zoo', here_id: '550-5520-0208' },
  [LocationCategoryCode.AQUARIUM]: {
    name: 'Aquarium',
    here_id: '550-5520-0207',
  },
  [LocationCategoryCode.SKI_RESORT]: {
    name: 'Ski Resort',
    here_id: '550-5520-0212',
  },
  [LocationCategoryCode.SCENIC_POINT]: {
    name: 'Scenic Point',
    here_id: '550-5510-0242',
  },
  [LocationCategoryCode.PARK]: { name: 'Park', here_id: '550-5510-0202' },
  [LocationCategoryCode.HIKING_TRAIL]: {
    name: 'Hiking Trail',
    here_id: '550-5510-0359',
  },
  [LocationCategoryCode.MUSEUM]: { name: 'Museum', here_id: '300-3100' },
  [LocationCategoryCode.RELIGIOUS_PLACE]: {
    name: 'Religious Place',
    here_id: '300-3200',
  },
  [LocationCategoryCode.HISTORICAL_SITE]: {
    name: 'Historical Site',
    here_id: 'historic-site',
  },
  [LocationCategoryCode.SHOPPING_MALL]: {
    name: 'Shopping Mall',
    here_id: '600-6100-0062',
  },
  [LocationCategoryCode.GROCERY_STORE]: {
    name: 'Grocery Store',
    here_id: '600-6300-0066',
  },
  [LocationCategoryCode.CONVENIENCE_STORE]: {
    name: 'Convenience Store',
    here_id: '600-6000-0061',
  },
  [LocationCategoryCode.PHARMACY]: {
    name: 'Pharmacy',
    here_id: '600-6400-0000',
  },
  [LocationCategoryCode.BUS_STATION]: {
    name: 'Bus Station',
    here_id: '400-4100-0036',
  },
  [LocationCategoryCode.TRAIN_STATION]: {
    name: 'Train Station',
    here_id: '400-4100-0035',
  },
  [LocationCategoryCode.AIRPORT]: { name: 'Airport', here_id: '400-4000' },
  [LocationCategoryCode.FERRY_TERMINAL]: {
    name: 'Ferry Terminal',
    here_id: '400-4100-0044',
  },
  [LocationCategoryCode.OTHER]: {
    name: 'Subway Station',
    here_id: '0000-0000-0000', //placeholder
  },
};
