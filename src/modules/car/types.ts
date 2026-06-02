export type CarExpenseCategory =
  | "gasoline"
  | "taxes"
  | "maintenance"
  | "cleaning"
  | "inspection"
  | "insurance"
  | "soat"
  | "tecnomecanica"
  | "parking"
  | "toll"
  | "fine"
  | "parts"
  | "other";

export type CarReminderStatus = "pending" | "done";

export type CarVehicle = {
  id: string;
  family_id: string;
  name: string;
  plate: string | null;
  brand: string | null;
  model_year: number | null;
  current_km: number | null;
  is_active: boolean;
  created_at: string;
};

export type CarExpense = {
  id: string;
  family_id: string;
  vehicle_id: string | null;
  category: CarExpenseCategory;
  amount: number;
  occurred_on: string;
  monthly_period: string;
  vendor: string | null;
  odometer_km: number | null;
  notes: string | null;
  created_at: string;
  car_vehicles?: Pick<CarVehicle, "name" | "plate"> | null;
};

export type CarReminder = {
  id: string;
  family_id: string;
  vehicle_id: string | null;
  title: string;
  category: CarExpenseCategory;
  due_on: string | null;
  due_km: number | null;
  status: CarReminderStatus;
  notes: string | null;
  created_at: string;
  car_vehicles?: Pick<CarVehicle, "name" | "plate"> | null;
};
