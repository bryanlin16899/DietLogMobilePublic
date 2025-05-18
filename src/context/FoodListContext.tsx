import React, { createContext, useContext, useState } from 'react';

interface FoodListContextType {
  refreshFoodList: () => void;
  refreshTrigger: number;
}

const FoodListContext = createContext<FoodListContextType | undefined>(undefined);

export function FoodListProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshFoodList = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <FoodListContext.Provider value={{ refreshFoodList, refreshTrigger }}>
      {children}
    </FoodListContext.Provider>
  );
}

export function useFoodList() {
  const context = useContext(FoodListContext);
  if (!context) {
    throw new Error('useFoodList must be used within a FoodListProvider');
  }
  return context;
}
