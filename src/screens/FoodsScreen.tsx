import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Divider, Icon, Input, Layout, Modal, Spinner, Text } from '@ui-kitten/components';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { useFoodList } from '../context/FoodListContext';
import type { Ingredient, IngredientListResponse } from '../services/api';
import { deleteIngredient, fetchIngredientList } from '../services/api';

const TrashIcon = (props: any) => (
  <Icon {...props} name='trash-2-outline'/>
);

type RootStackParamList = {
  CreateFood: {
    onSuccess: () => void;
  };
  EditFood: {
    ingredient: Ingredient;
    onSuccess: () => void;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateFood'>;

export const FoodsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editIngredient, setEditIngredient] = useState<Ingredient | null>(null);
  
  // Debounce search query changes
  const debouncedSearch = React.useCallback(
    React.useMemo(
      () =>
        debounce((query: string) => {
          setCurrentPage(1);
          loadIngredients(query);
        }, 500),
      []
    ),
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  const loadIngredients = async (query: string = searchQuery) => {
    try {
      setLoading(true);
      const response: IngredientListResponse = await fetchIngredientList(query, {
        page: currentPage,
        page_size: 10,
      });

      console.log(response.ingredients,'response.ingredients');
      
      
      setIngredients(prevIngredients => {
        if (currentPage === 1) {
          return response.ingredients;
        }
        const existingMap = new Map(prevIngredients.map(ing => [ing.id, ing]));
        response.ingredients.forEach(ing => {
          existingMap.set(ing.id, ing);
        });
        return Array.from(existingMap.values());
      });
      
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    } finally {
      setLoading(false);
    }
  };

  const { refreshTrigger, refreshFoodList } = useFoodList();

  useEffect(() => {
    loadIngredients();
  }, [currentPage, refreshTrigger]);

  const renderItem = ({ item }: { item: Ingredient }) => {
    const isServings = item.unit_type === 'servings';
    const calories = isServings ? item.serving_calories : item.calories;
    const protein = isServings ? item.serving_protein : item.protein;
    const fat = isServings ? item.serving_fat : item.fat;
    const carbs = isServings ? item.serving_carbohydrates : item.carbohydrates;
    
    return (
      <Card style={styles.card}>
        <View style={styles.headerContainer}>
          <Text style={{ width: 230 }} category='h6'>{item.brand ? `${item.brand} ${item.name}` : `${item.name}`}</Text>
          <Text category='s1'>每 {isServings ? '份' : '100g'}</Text>
        </View>
        
        <View style={styles.nutritionContainer}>
          <View style={styles.nutritionItem}>
            <Text category='s2'>熱量</Text>
            <Text>{calories == 0 ? '-' : calories.toFixed(1)}</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text category='s2'>蛋白質</Text>
            <Text>{protein == 0 ? '-' : `${protein.toFixed(1)}g`}</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text category='s2'>脂肪</Text>
            <Text>{fat == 0 ? '-' : `${fat.toFixed(1)}g`}</Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text category='s2'>碳水</Text>
            <Text>{carbs == 0 ? '-' : `${carbs.toFixed(1)}g`}</Text>
          </View>
        </View>
        <Divider />

        {item.image_url && (
          <View style={styles.footerContainer}>
            <Image
              src={item.image_url}
              style={styles.foodImage}
              resizeMode="contain"
            />
          </View>
        )}
        <Divider />
        <View style={styles.buttonContainer}>
          <Button
            status="info"
            appearance="ghost"
            onPress={() => {
              navigation.navigate('EditFood', {
                ingredient: item,
                onSuccess: () => {
                  setEditModalVisible(false);
                  setEditIngredient(null);
                  refreshFoodList();
                },
              });
            }}
            accessoryLeft={props => <Icon {...props} name='edit-2-outline'/>}
          >
          </Button>
          <Button
            status="danger"
            appearance="ghost"
            onPress={() => {
              setSelectedIngredient(item);
              setDeleteModalVisible(true);
            }}
            accessoryLeft={TrashIcon}
          >
          </Button>
        </View>
      </Card>
    );
  };

  const handleEndReached = () => {
    if (!loading && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleDelete = async () => {
    if (!selectedIngredient) return;

    try {
      await deleteIngredient(selectedIngredient.id);
      setDeleteModalVisible(false);
      setSelectedIngredient(null);
      // Refresh the list
      setCurrentPage(1);
      loadIngredients();
    } catch (error) {
      console.error('Error deleting ingredient:', error);
    }
  };


  return (
    <Layout style={styles.container}>
      <Modal
        visible={deleteModalVisible}
        onBackdropPress={() => setDeleteModalVisible(false)}
      >
        <Card disabled>
          <Text category="h6" style={styles.modalText}>確定要刪除這個食材嗎？</Text>
          <Text category="s1" style={styles.modalSubText}>
            {selectedIngredient?.name}
          </Text>
          <View style={styles.modalButtons}>
            <Button
              status="basic"
              appearance="ghost"
              onPress={() => setDeleteModalVisible(false)}
              style={styles.modalButton}
            >
              取消
            </Button>
            <Button
              status="danger"
              onPress={handleDelete}
              style={styles.modalButton}
            >
              刪除
            </Button>
          </View>
        </Card>
      </Modal>
      <SafeAreaView style={styles.safeArea}>
        <Input
          placeholder="搜尋食材..."
          value={searchQuery}
          onChangeText={nextValue => {
            setSearchQuery(nextValue);
            debouncedSearch(nextValue);
          }}
          style={styles.searchInput}
        />
        <FlatList
          data={ingredients}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${currentPage}-${index}`}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => 
            loading ? <Spinner size="medium" /> : null
          }
          refreshControl={
            <RefreshControl 
              refreshing={loading}
              onRefresh={() => {
                setCurrentPage(1);
                loadIngredients();
              }}
            />
          }
        />
      </SafeAreaView>
      <Button
        style={styles.fab}
        status="primary"
        accessoryLeft={props => <Icon {...props} name="plus-outline"/>}
        onPress={() => navigation.navigate('CreateFood', {
          onSuccess: () => {
            setCurrentPage(1);
            refreshFoodList();
          },
        })}
      />
    </Layout>
  );
};

// Debounce utility function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  
  const debounced = (...args: any) => {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  
  debounced.cancel = () => {
    clearTimeout(timeout);
  };
  
  return debounced;
};

const styles = StyleSheet.create({
  container: {
    paddingTop: StatusBar.currentHeight,
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  card: {
    marginVertical: 5,
    marginHorizontal: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 5
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  searchInput: {
    margin: 16,
  },
  foodImage: {
    width: '60%',
    aspectRatio: 1,
    borderRadius: 10,
    marginVertical: 5
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    // marginTop: 2,
  },
  modalText: {
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubText: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#8F9BB3',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
    width: 56,
    height: 56,
  },
  createModal: {
    width: '95%',
    minWidth: 360,
    borderRadius: 20,
    padding: 10,
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
  scrollViewContent: {
    flexGrow: 1,
  },
  modal: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',   
  }
});
