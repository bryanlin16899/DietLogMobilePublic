export type UnitType = 'grams' | 'servings';

export interface IntakeFoodsItem {
  food_name: string;
  unit_type: UnitType;
  quantity: number;
}

export interface IntakeFood {
  id: number;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  quantity: number;
  unit_type: string;
  date: string;
  added_by_ai: boolean;
  image_url?: string;
}

export interface DietLog {
  log_date: string;
  intake: number;
  consumption: number;
  intake_foods: IntakeFood[];
}
