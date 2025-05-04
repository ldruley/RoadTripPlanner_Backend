interface StintVehicleInfo {
  vehicle_id: number;
  name: string;
  year: number;
  driver?: {
    user_id: number;
    username: string;
    fullname: string;
  };
}
