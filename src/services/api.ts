import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// import { API_URL } from 'react-native-dotenv';

// Types
export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_in: string;
  user: string;
}

export interface User {
  googleId: string;
  userId: string;
  name: string;
  email: string;
  picture?: string;
}

export interface Ingredient {
  id: number;
  brand: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  serving_size_grams: number;
  serving_calories: number;
  serving_protein: number;
  serving_fat: number;
  serving_carbohydrates: number;
  added_by_image: boolean;
  image_url?: string;
  unit_type: string;
  added_user_id: number | null;
}

export interface IngredientListResponse {
  ingredients: Ingredient[];
  total_count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
}

export interface DietLog {
  log_date: string;
  intake: number;
  consumption: number;
  intake_foods: IntakeFood[];
}

export interface IntakeFood {
  id: number;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  quantity: number;
  unit_type: UnitType;
  date: string;
  added_by_ai: boolean;
  image_url?: string;
}

export type UnitType = 'grams' | 'servings';

export interface SimilarIngredient {
  id: number;
  brand: string;
  name: string;
  calories: number;
  unit_type: UnitType;
}

export interface IntakePromptReponseObj {
  brand?: string;
  food_name: string;
  unit_type: UnitType;
  quantity: number | string;
}

export interface IntakePromptResponse {
  foods: IntakePromptReponseObj[];
  unique_id: string;
}

const API_URL = Platform.select({
  ios: '<backend_url>', // iOS simulator localhost
  android: '<backend_url>', // Android emulator localhost
  default: '<backend_url>', // iOS simulator localhost',
});

// Helper function for API calls with authentication
const fetchWithAuth = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
  maxRetries = 3,
  retryDelay = 500
): Promise<Response> => {
  try {
    // Try to get token from AsyncStorage
    const tokenStr = await AsyncStorage.getItem('token');
    // If no token and we haven't exceeded max retries, wait and try again
    if ((!tokenStr || tokenStr === '{}') && retryCount < maxRetries) {
      console.log(`Token not found, retrying (${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithAuth(endpoint, options, retryCount + 1, maxRetries, retryDelay);
    }

    const token = tokenStr ? JSON.parse(tokenStr) : {};

    // Check if we have a valid token after retries
    if (!token.access_token && retryCount >= maxRetries) {
      console.error('Failed to get token after maximum retries');
      throw new Error('Authentication required - no token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token.access_token}`
    };

    console.log(`Fetching ${endpoint} with headers:`, headers);
    console.log(options, '---options---');
    
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });


    // If unauthorized, attempt token refresh
    if (response.status === 401) {
      if (!token.refresh_token) {
        triggerLogout();
        throw new Error('No refresh token available');
      }

      try {
        const newToken = await refreshAccessToken(token.refresh_token);

        // Update AsyncStorage with new token
        await AsyncStorage.setItem('token', JSON.stringify(newToken));

        // Retry original request with new token
        const retryHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${newToken.access_token}`
        };

        return fetch(`${API_URL}${endpoint}`, { ...options, headers: retryHeaders });
      } catch (refreshError) {
        triggerLogout();
        throw refreshError;
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'API call failed');
    }

    return response;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
};

// Auth APIs
export const refreshAccessToken = async (refreshToken: string): Promise<TokenInfo> => {
  try {
    const response = await fetch(`${API_URL}/auth/refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

export const validateInviteCode = async (
  googleId: string,
  inviteCode: string
): Promise<boolean> => {
  try {
    const response = await fetchWithAuth('/auth/validate_invite_code', {
      method: 'POST',
      body: JSON.stringify({
        invite_code: inviteCode,
        google_id: googleId,
      }),
    });

    const result = await response.json();
    return result.is_valid === true;
  } catch (error) {
    console.error('Error validating invite code:', error);
    return false;
  }
};

export const generateInviteCode = async (): Promise<string | null> => {
  try {
    const response = await fetchWithAuth('/auth/generate_invite_code', {
      method: 'POST',
    });

    const result = await response.json();
    return result.invite_code;
  } catch (error) {
    console.error('Error generating invite code:', error);
    return null;
  }
};

// Diet Log APIs
export const getDietLog = async (date: string): Promise<DietLog> => {
  try {
    console.log(JSON.stringify({ log_date: date }));
    
    const response = await fetchWithAuth('/diet/get_diet_log', {
      method: 'POST',
      body: JSON.stringify({ log_date: date }),
    });
    return response.json();
  } catch (error) {
    console.error('Error fetching diet log:', error);
    throw error;
  }
};

export const recordIntake = async (
  foods: Array<{
    brand?: string;
    food_name: string;
    unit_type: UnitType;
    quantity: string | number;
  }>,
  logDate: string,
  addedByAi: boolean = false,
  uniqueId: string | null = null,
  isCorrected: boolean | null = null
): Promise<DietLog> => {
  try {
    const processedFoods = foods.map(food => ({
      ...food,
      quantity: typeof food.quantity === 'string' ? parseFloat(food.quantity) : food.quantity
    }));

    const response = await fetchWithAuth('/diet/intake', {
      method: 'POST',
      body: JSON.stringify({
        foods: processedFoods,
        log_date: logDate,
        added_by_ai: addedByAi,
        unique_id: uniqueId,
        is_corrected: isCorrected,
      }),
    });
    return response.json();
  } catch (error) {
    console.error('Error recording intake:', error);
    throw error;
  }
};

export const recordConsumption = async (
  consumption: number,
  logDate: string
): Promise<DietLog> => {
  try {
    const response = await fetchWithAuth('/diet/comsumption', {
      method: 'POST',
      body: JSON.stringify({
        consumption,
        log_date: logDate,
      }),
    });
    return response.json();
  } catch (error) {
    console.error('Error recording consumption:', error);
    throw error;
  }
};

export const removeIntake = async (foodId: number): Promise<void> => {
  try {
    await fetchWithAuth('/diet/remove_intake_by_id', {
      method: 'POST',
      body: JSON.stringify({ id: foodId }),
    });
  } catch (error) {
    console.error('Error removing intake:', error);
    throw error;
  }
};

export const recordIntakeByPrompt = async (
  googleId: string,
  prompts: string,
  logDate: string | null
): Promise<IntakePromptResponse> => {
  try {
    const response = await fetchWithAuth('/diet/intake-prompt', {
      method: 'POST',
      body: JSON.stringify({
        google_id: googleId,
        prompts: prompts,
        log_date: logDate,
      }),
    });
    return response.json();
  } catch (error) {
    console.error('Error recording intake by prompt:', error);
    throw error;
  }
};

// Ingredient APIs
export const fetchIngredientList = async (
  searchTerm: string,
  options: {
    page?: number;
    page_size?: number;
  } = {}
): Promise<IngredientListResponse> => {
  try {
    const { page = 1, page_size = 10 } = options;
    const response = await fetchWithAuth('/ingredient/get_ingredient_list', {
      method: 'POST',
      body: JSON.stringify({
        name: searchTerm,
        page,
        page_size,
      }),
    });
    return response.json();
  } catch (error) {
    console.error('Error fetching ingredient list:', error);
    throw error;
  }
};

export const fetchIngredientById = async (ingredientId: number): Promise<Ingredient> => {
  try {
    const response = await fetchWithAuth(`/ingredient/get_ingredient?id=${ingredientId}`, {
      method: 'GET',
    });
    return response.json();
  } catch (error) {
    console.error('Error fetching ingredient by ID:', error);
    throw error;
  }
};

export const fetchSimilarIngredients = async (name: string): Promise<SimilarIngredient[]> => {
  try {
    const response = await fetchWithAuth('/ingredient/get_similar_ingredients', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return response.json();
  } catch (error) {
    console.error('Error fetching similar ingredients:', error);
    throw error;
  }
};

export const createIngredient = async (ingredientData: {
  unit_type: UnitType;
  brand: string;
  name: string;
  calories: number;
  fat: number;
  protein: number;
  carbohydrates: number;
  serving_size_grams: number | null;
  image_base64?: string | null;
}): Promise<Ingredient> => {
  try {
    const response = await fetchWithAuth('/ingredient/add', {
      method: 'POST',
      body: JSON.stringify(ingredientData),
    });
    return response.json();
  } catch (error) {
    console.error('Error creating ingredient:', error);
    throw error;
  }
};

export const updateIngredient = async (ingredientData: {
  id: number;
  brand: string;
  name: string;
  calories: number;
  fat: number;
  protein: number;
  carbohydrates: number;
  serving_size_grams: number | null;
  image_base64?: string | null;
}): Promise<Ingredient> => {
  try {
    const response = await fetchWithAuth('/ingredient/update', {
      method: 'POST',
      body: JSON.stringify(ingredientData),
    });
    return response.json();
  } catch (error) {
    console.error('Error updating ingredient:', error);
    throw error;
  }
};

export const deleteIngredient = async (ingredientId: number): Promise<void> => {
  try {
    await fetchWithAuth('/ingredient/delete', {
      method: 'POST',
      body: JSON.stringify({ id: ingredientId }),
    });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    throw error;
  }
};

export const recordDietIntakeManually = async (
  manuallyIntakeData: {
    googleId: string; 
    logDate: string; 
    foodName: string; 
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    quantity: number; 
    unitType: UnitType;
    imageBase64: string | null;
  }
): Promise<DietLog> => {
  try {
    const response = await fetchWithAuth(`/diet/intake-manually`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        google_id: manuallyIntakeData.googleId,
        log_date: manuallyIntakeData.logDate,
        food_name: manuallyIntakeData.foodName,
        calories: manuallyIntakeData.calories,
        protein: manuallyIntakeData.protein,
        fat: manuallyIntakeData.fat,
        carbohydrates: manuallyIntakeData.carbohydrates,
        quantity: manuallyIntakeData.quantity,
        unit_type: manuallyIntakeData.unitType,
        image_base64: manuallyIntakeData.imageBase64,
      })
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error recording manual intake:', error);
    throw error;
  }
};

export const UploadIntakeImage = async (
  imageBase64: string,
  id: number
): Promise<{ image_url: string }> => {
  console.log(
    JSON.stringify({
      image_base64: imageBase64,
      id: id,
    }),
  );
  
  try {
    const response = await fetchWithAuth('/diet/upload_image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_base64: imageBase64,
        id: id,
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  }
  catch (error) {
    console.error('Error uploading intake image:', error);
    throw error;
  }
}

export const deleteIntakeImage = async (id: number): Promise<void> => {
  try {
    const response = await fetchWithAuth('/diet/delete_image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
  }
  catch (error) {
    console.error('Error deleting intake image:', error);
    throw error;
  }
}

export const getDateHasIntakeInMonth = async (year: number, month: number): Promise<{dates: string[]}> => {
  try {
    const response = await fetchWithAuth(`/diet/date_has_intake_in_month?year=${year}&month=${month}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  }
  catch (error) {
    console.error('Error fetching dates with intake in month:', error);
    throw error;
  }
}

// Helper functions
const triggerLogout = async () => {
  await AsyncStorage.removeItem('userInfo');
  await AsyncStorage.removeItem('token');
  // Note: Event handling will need to be implemented differently in React Native
  // You might want to use a state management solution or context for this
};
