import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Button, Icon, IndexPath, Input, Layout, Select, SelectItem, Text } from '@ui-kitten/components';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Ingredient, UnitType } from '../services/api';
import { updateIngredient } from '../services/api';
import { handleImagePick } from '../services/utils';

type RootStackParamList = {
  EditFood: {
    ingredient: Ingredient;
    onSuccess?: () => void;
  };
};

type EditFoodRouteProp = RouteProp<RootStackParamList, 'EditFood'>;

export const EditFoodScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<EditFoodRouteProp>();
  const [isUploadVisible, setIsUploadVisible] = useState(false);
  const [ingredient, setIngredient] = useState({
    ...route.params.ingredient,
    calories: route.params.ingredient.unit_type === 'grams' ? route.params.ingredient.calories.toString() : route.params.ingredient.serving_calories.toString(),
    protein: route.params.ingredient.unit_type === 'grams' ? route.params.ingredient.protein.toString() : route.params.ingredient.serving_protein.toString(),
    fat: route.params.ingredient.unit_type === 'grams' ? route.params.ingredient.fat.toString() : route.params.ingredient.serving_fat.toString(),
    carbohydrates: route.params.ingredient.unit_type === 'grams' ? route.params.ingredient.carbohydrates.toString() : route.params.ingredient.serving_carbohydrates.toString(),
    serving_size_grams: route.params.ingredient.serving_size_grams?.toString() || '',
    image_base64: null,
  });

  const handleUpdateIngredient = async () => {
    try {
      const ingredientData = {
        id: ingredient.id,
        brand: ingredient.brand,
        name: ingredient.name,
        unit_type: ingredient.unit_type,
        calories: parseFloat(ingredient.calories),
        protein: parseFloat(ingredient.protein),
        fat: parseFloat(ingredient.fat),
        carbohydrates: parseFloat(ingredient.carbohydrates),
        serving_size_grams: ingredient.unit_type === 'grams' ? parseFloat(ingredient.serving_size_grams) : null,
        image_base64: ingredient.image_base64 ? ingredient.image_base64 : null,
      };

      await updateIngredient(ingredientData);
      route.params?.onSuccess?.();
      navigation.goBack();
    } catch (error) {
      console.error('Error updating ingredient:', error);
    }
  };

  return (
    <Layout style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="食物品牌"
            placeholder="輸入食物品牌(可留空)"
            value={ingredient.brand}
            onChangeText={value => setIngredient(prev => ({ ...prev, brand: value }))}
            style={styles.input}
          />
          <Input
            label="食材名稱"
            placeholder="輸入食材名稱"
            value={ingredient.name}
            onChangeText={value => setIngredient(prev => ({ ...prev, name: value }))}
            style={styles.input}
          />

          <Select
            label="單位"
            value={ingredient.unit_type === 'grams' ? '公克' : '份'}
            onSelect={(index: IndexPath|IndexPath[]) => {
              // using single selection, we can safely cast to IndexPath
              const selectedIndex = index as IndexPath;
              const value = selectedIndex.row === 0 ? 'grams' : 'servings';
              setIngredient(prev => ({ ...prev, unit_type: value as UnitType }));
            }}
            style={styles.input}
          >
            <SelectItem title="公克(每100g)" />
            <SelectItem title="份" />
          </Select>

          <Input
            label="熱量(大卡)"
            placeholder={`輸入${ingredient.unit_type === 'grams' ? '每100克' : '每份'}熱量`}
            keyboardType="numeric"
            value={ingredient.calories}
            onChangeText={value => setIngredient(prev => ({ ...prev, calories: value }))}
            style={styles.input}
          />

          <Input
            label="蛋白質(g)"
            placeholder={`輸入${ingredient.unit_type === 'grams' ? '每100克' : '每份'}蛋白質`}
            keyboardType="numeric"
            value={ingredient.protein}
            onChangeText={value => setIngredient(prev => ({ ...prev, protein: value }))}
            style={styles.input}
          />

          <Input
            label="脂肪(g)"
            placeholder={`輸入${ingredient.unit_type === 'grams' ? '每100克' : '每份'}脂肪`}
            keyboardType="numeric"
            value={ingredient.fat}
            onChangeText={value => setIngredient(prev => ({ ...prev, fat: value }))}
            style={styles.input}
          />

          <Input
            label="碳水化合物(g)"
            placeholder={`輸入${ingredient.unit_type === 'grams' ? '每100克' : '每份'}碳水化合物`}
            keyboardType="numeric"
            value={ingredient.carbohydrates}
            onChangeText={value => setIngredient(prev => ({ ...prev, carbohydrates: value }))}
            style={styles.input}
          />

          {ingredient.unit_type === 'grams' && (
            <Input
              label="每份克數"
              placeholder="輸入每份克數"
              keyboardType="numeric"
              value={ingredient.serving_size_grams}
              onChangeText={value => setIngredient(prev => ({ ...prev, serving_size_grams: value }))}
              style={styles.input}
            />
          )}

          <Button
            appearance="ghost"
            status="basic"
            accessoryLeft={props => <Icon {...props} name={isUploadVisible ? 'chevron-up-outline' : 'chevron-down-outline'}/>}
            onPress={() => setIsUploadVisible(!isUploadVisible)}
            style={styles.collapseButton}
          >
            {isUploadVisible ? '收起圖片上傳' : '展開圖片上傳'}
          </Button>
          
          {isUploadVisible && (
            <TouchableOpacity 
              onPress={() => handleImagePick(setIngredient)}
              style={styles.imageUploadContainer}
            >
              {ingredient.image_url ? (
                <Image
                  source={{ uri: ingredient.image_url }}
                  style={styles.uploadedImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Icon name="image-outline" style={styles.uploadIcon} fill="#8F9BB3"/>
                  <Text category="s1">點擊上傳圖片</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          <Button
            onPress={handleUpdateIngredient}
          >
            更新
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  input: {
    marginBottom: 8,
  },
  imageUploadContainer: {
    height: 200,
    borderWidth: 1,
    borderColor: '#E4E9F2',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  uploadIcon: {
    width: 32,
    height: 32,
    marginBottom: 8,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  collapseButton: {
    marginBottom: 8,
  },
});
