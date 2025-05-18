import { Input, Text } from '@ui-kitten/components';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { fetchIngredientList, Ingredient } from '../services/api';

interface CustomAutoCompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (ingredient: Ingredient) => void;
  placeholder?: string;
  style?: any;
}

export const CustomAutoComplete = ({
  value,
  onChangeText,
  onSelect,
  placeholder,
  style
}: CustomAutoCompleteProps) => {
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSelect = (ingredient: Ingredient) => {
    onSelect(ingredient);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTextChange = (text: string) => {
    onChangeText(text);
    
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (text.length >= 1) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetchIngredientList(text);
          setSuggestions(response.ingredients);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
        setDebounceTimer(null);
      }, 400);
      setDebounceTimer(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  return (
    <View style={styles.container}>
      <Input
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        style={style}
      />
      {showSuggestions && suggestions?.length > 0 && (
        <View style={styles.suggestionsWrapper}>
          <ScrollView 
            style={styles.suggestionsContainer}
            keyboardShouldPersistTaps="handled"
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion.id}-${index}`}
                style={styles.suggestionItem}
                onPress={() => handleSelect(suggestion)}
              >
                <Text>{suggestion.brand ? `${suggestion.brand} ${suggestion.name}` : suggestion.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
  },
  suggestionsWrapper: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E4E9F2',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  suggestionsContainer: {
    maxHeight: 230,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9F2',
  },
});
