import { useNavigation } from '@react-navigation/native';
import { Button, Icon, IndexPath, Input, Layout, Select, SelectItem, Text } from '@ui-kitten/components';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFoodList } from '../context/FoodListContext';
import type { UnitType } from '../services/api';
import { createIngredient } from '../services/api';
import { handleImagePick } from '../services/utils';

export const CreateFoodScreen = () => {
  const navigation = useNavigation();
  const { refreshFoodList } = useFoodList();
  const [isUploadVisible, setIsUploadVisible] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    brand: '',
    unit_type: 'grams' as UnitType,
    calories: '',
    protein: '',
    fat: '',
    carbohydrates: '',
    serving_size_grams: '',
    image_base64: null as string | null,
  });

  const handleCreateIngredient = async () => {
    try {
      const ingredientData = {
        name: newIngredient.name,
        brand: newIngredient.brand,
        unit_type: newIngredient.unit_type,
        calories: parseFloat(newIngredient.calories),
        protein: parseFloat(newIngredient.protein),
        fat: parseFloat(newIngredient.fat),
        carbohydrates: parseFloat(newIngredient.carbohydrates),
        serving_size_grams: newIngredient.unit_type === 'grams' ? parseFloat(newIngredient.serving_size_grams) : null,
        image_base64: newIngredient.image_base64,
      };

      await createIngredient(ingredientData);
      refreshFoodList();
      navigation.goBack();
    } catch (error) {
      console.error('Error creating ingredient:', error);
    }
  };

  return (
    <Layout style={styles.container}>
      {/* <View 
        style={styles.header}
      >
        <Button
          appearance="ghost"
          status="basic"
          accessoryLeft={props => <Icon {...props} name='arrow-back-outline'/>}
          onPress={() => navigation.goBack()}
        />
        <Text category="h6">新增食材</Text>
      </View> */}

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
            value={newIngredient.brand}
            onChangeText={value => setNewIngredient(prev => ({ ...prev, brand: value }))}
            style={styles.input}
          />
          <Input
            label="食材名稱"
            placeholder="輸入食材名稱"
            value={newIngredient.name}
            onChangeText={value => setNewIngredient(prev => ({ ...prev, name: value }))}
            style={styles.input}
          />

          <Select
            label="單位"
            value={newIngredient.unit_type === 'grams' ? '公克' : '份'}
            onSelect={(index: IndexPath|IndexPath[]) => {
              // using single selection, we can safely cast to IndexPath
              const selectedIndex = index as IndexPath;
              const value = selectedIndex.row === 0 ? 'grams' : 'servings';
              setNewIngredient(prev => ({ ...prev, unit_type: value as UnitType }));
            }}
            style={styles.input}
          >
            <SelectItem title="公克(每100g)" />
            <SelectItem title="份" />
          </Select>

          <Input
            label="熱量(大卡)"
            placeholder={`輸入${newIngredient.unit_type === 'grams' ? '每100克' : '每份'}熱量`}
            keyboardType="numeric"
            value={newIngredient.calories}
            onChangeText={value => setNewIngredient(prev => ({ ...prev, calories: value }))}
            style={styles.input}
          />

          <Input
            label="蛋白質(g)"
            placeholder={`輸入${newIngredient.unit_type === 'grams' ? '每100克' : '每份'}蛋白質`}
            keyboardType="numeric"
            value={newIngredient.protein}
            onChangeText={value => setNewIngredient(prev => ({ ...prev, protein: value }))}
            style={styles.input}
          />

          <Input
            label="脂肪(g)"
            placeholder={`輸入${newIngredient.unit_type === 'grams' ? '每100克' : '每份'}脂肪`}
            keyboardType="numeric"
            value={newIngredient.fat}
            onChangeText={value => setNewIngredient(prev => ({ ...prev, fat: value }))}
            style={styles.input}
          />

          <Input
            label="碳水化合物(g)"
            placeholder={`輸入${newIngredient.unit_type === 'grams' ? '每100克' : '每份'}碳水化合物`}
            keyboardType="numeric"
            value={newIngredient.carbohydrates}
            onChangeText={value => setNewIngredient(prev => ({ ...prev, carbohydrates: value }))}
            style={styles.input}
          />

          {newIngredient.unit_type === 'grams' && (
            <Input
              label="每份克數"
              placeholder="輸入每份克數"
              keyboardType="numeric"
              value={newIngredient.serving_size_grams}
              onChangeText={value => setNewIngredient(prev => ({ ...prev, serving_size_grams: value }))}
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
              onPress={() => handleImagePick(setNewIngredient)}
              style={styles.imageUploadContainer}
            >
              {newIngredient.image_base64 ? (
                <Image
                  source={{ uri: newIngredient.image_base64 }}
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
            onPress={handleCreateIngredient}
          >
            新增
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
