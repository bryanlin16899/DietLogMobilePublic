import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import { Button, Icon, Input, Spinner, Tab, TabBar, Text } from '@ui-kitten/components';
import React, { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, PermissionsAndroid, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { CustomAutoComplete } from '../components/CustomAutoComplete';
import { useUser } from '../context/UserContext';
import { IntakePromptReponseObj, recordDietIntakeManually, recordIntake, recordIntakeByPrompt, UnitType } from '../services/api';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { handleImagePick } from '../services/utils';

type RootStackParamList = {
  IntakePrompt: {
    date: string;
    onSuccess: () => void;
  };
};

type IntakePromptRouteProp = RouteProp<RootStackParamList, 'IntakePrompt'>;
type IntakePromptNavigationProp = NativeStackNavigationProp<RootStackParamList, 'IntakePrompt'>;

export const IntakePromptScreen = () => {
  const navigation = useNavigation<IntakePromptNavigationProp>();
  const route = useRoute<IntakePromptRouteProp>();
  const { date, onSuccess } = route.params;

  const { userInfo } = useUser();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [manualInput, setManualInput] = useState({
    foodName: '',
    calories: '',
    protein: '',
    fat: '',
    carbohydrates: '',
    quantity: '',
    unitType: 'servings' as UnitType,
    image_base64: null as string | null,
  });
  const [detectedFoods, setDetectedFoods] = useState<IntakePromptReponseObj[]>([]);
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const [isUploadVisible, setIsUploadVisible] = useState(false);

  const handleSubmitPrompt = async () => {
    if (!userInfo?.googleId || !prompt.trim()) return;
    
    setLoading(true);
    try {
      const response = await recordIntakeByPrompt(userInfo.googleId, prompt, date);
      
      setDetectedFoods(response.foods);
      setUniqueId(response.unique_id);
    } catch (error) {
      console.error('Error detecting foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordIntake = async () => {
    if (!detectedFoods.length || !uniqueId) return;
    
    try {
      await recordIntake(detectedFoods, date, true, uniqueId, false);
      onSuccess();
      resetAllInputs();
      navigation.goBack();
    } catch (error) {
      console.error('Error recording intake:', error);
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updatedFoods = [...detectedFoods];
      updatedFoods[index] = {
        ...updatedFoods[index],
        quantity: value,
      };
      setDetectedFoods(updatedFoods);
  };

  const handleFoodNameChange = (index: number, value: string) => {
    const updatedFoods = [...detectedFoods];
    updatedFoods[index] = {
      ...updatedFoods[index],
      brand: '',
      food_name: value
    };
    setDetectedFoods(updatedFoods);
  };

  const handleUnitTypeChange = (index: number, newUnitType: string) => {
    const updatedFoods = [...detectedFoods];
    updatedFoods[index] = {
      ...updatedFoods[index],
      unit_type: newUnitType as UnitType
    };
    setDetectedFoods(updatedFoods);
  };

  const renderFoodItem = ({ item, index }: { item: IntakePromptReponseObj; index: number }) => {
    return (
      <View style={styles.foodItemContainer}>
        <Text>食物名稱</Text>
        <CustomAutoComplete
          value={item.brand ? `${item.brand} ${item.food_name}` : item.food_name}
          onChangeText={(value) => handleFoodNameChange(index, value)}
          onSelect={(ingredient) => {
            const updatedFoods = [...detectedFoods];
            updatedFoods[index] = {
              ...updatedFoods[index],
              brand: ingredient.brand,
              food_name: ingredient.name,
              unit_type: ingredient.unit_type as UnitType,
            };
            setDetectedFoods(updatedFoods);
          }}
          placeholder="輸入食物名稱"
        />
        
        <Text>數量</Text>
        <View style={styles.quantityContainer}>
          <Input
            value={`${item.quantity}`}
            onChangeText={(value) => handleQuantityChange(index, value)}
            style={styles.quantityInput}
          />
          <View style={styles.unitButtonContainer}>
            <Button
              size="small"
              appearance={item.unit_type === 'grams' ? 'filled' : 'outline'}
              onPress={() => handleUnitTypeChange(index, 'grams')}
            >
              克
            </Button>
            <Button
              size="small"
              appearance={item.unit_type === 'servings' ? 'filled' : 'outline'}
              onPress={() => handleUnitTypeChange(index, 'servings')}
            >
              份
            </Button>
          </View>
        </View>
      </View>
    );
  };

  const resetAllInputs = () => {
    setSelectedIndex(0);
    setPrompt('');
    setDetectedFoods([]);
    setUniqueId(null);
    setManualInput({
      foodName: '',
      calories: '',
      protein: '',
      fat: '',
      carbohydrates: '',
      quantity: '',
      unitType: 'servings',
      image_base64: null,
    });
  };

  const handleManualSubmit = async () => {
    if (!userInfo?.googleId) return;
    
    try {
      await recordDietIntakeManually({
        googleId: userInfo.googleId,
        logDate: date,
        foodName: manualInput.foodName,
        calories: parseFloat(manualInput.calories),
        protein: manualInput.protein ? parseFloat(manualInput.protein) : 0,
        fat: manualInput.fat ? parseFloat(manualInput.fat) : 0,
        carbohydrates: manualInput.carbohydrates ? parseFloat(manualInput.carbohydrates) : 0,
        quantity: manualInput.quantity ? parseFloat(manualInput.quantity) : 1,
        unitType: manualInput.unitType,
        imageBase64: manualInput.image_base64,
      });
      onSuccess();
      resetAllInputs();
      navigation.goBack();
    } catch (error) {
      console.error('Error recording manual intake:', error);
    }
  };

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value[0]) {
      setPrompt(e.value[0]);
    }
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  const onSpeechError = (e: any) => {
    console.error(e);
    setIsListening(false);
  };

  const requestAudioPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "錄音權限",
            message: "需要錄音權限來使用語音輸入功能",
            buttonNeutral: "稍後詢問",
            buttonNegative: "取消",
            buttonPositive: "確定"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS handles permissions differently
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const startListening = async () => {
    try {
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        Alert.alert('權限錯誤', '需要錄音權限才能使用語音輸入功能');
        return;
      }

      setDetectedFoods([]);
      await Voice.start('zh-TW');
      setIsListening(true);
    } catch (e) {
      console.error(e);
      Alert.alert('錯誤', '無法啟動語音輸入');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error(e);
    }
  };

  const renderPromptInput = () => (
    <>
      <View style={styles.inputContainer}>
        <Input
          value={prompt}
          onChangeText={setPrompt}
          placeholder="午餐吃了一份燕麥跟豆漿大概300ml"
          multiline
          textStyle={styles.input}
          disabled={loading || isListening}
          style={{ flex: 1 }}
        />
        <Button
          style={styles.micButton}
          status={isListening ? 'danger' : 'primary'}
          disabled={Platform.OS === 'android'}
          size='medium'
          accessoryLeft={props => 
            isListening ? 
            <Spinner {...props} /> : 
            <Icon {...props} name='mic-outline'/>
          }
          onPress={isListening ? stopListening : startListening}
        />
      </View>
      
      <Button
        onPress={handleSubmitPrompt}
        style={styles.button}
        disabled={!prompt.trim() || loading || detectedFoods?.length > 0}
      >
        {loading ? '翻箱倒櫃...' : '偵測食物'}
      </Button>

      {detectedFoods?.length > 0 && (
        <View> 
          <Text category="h6" style={styles.subtitle}>食物清單:</Text>
          {detectedFoods.map((item, index) => (
            <View key={index}>
              {renderFoodItem({ item, index })}
            </View>
          ))}
        </View>
      )}
    </>
  );

  const renderManualInput = () => (
      <>
      <Input
        label="食物名稱"
        placeholder="輸入食物名稱"
        multiline
        value={manualInput.foodName}
        onChangeText={value => setManualInput(prev => ({ ...prev, foodName: value }))}
        style={styles.input}
      />
      <Input
        label="熱量(大卡)"
        placeholder="輸入每份熱量"
        keyboardType="numbers-and-punctuation"
        value={manualInput.calories}
        onChangeText={value => {
          const numericValue = value.replace(/[^0-9.-]/g, '');
          if (numericValue === '' || /^-?\d*\.?\d*$/.test(numericValue)) {
            setManualInput(prev => ({ ...prev, calories: numericValue }))
          }
        }}
        style={styles.input}
      />
      <Input
        label="蛋白質(g)"
        placeholder="輸入每份蛋白質 (預設為0)"
        keyboardType="decimal-pad"
        value={manualInput.protein}
        onChangeText={value => {
          const numericValue = value.replace(/[^0-9.]/g, '');
          if (numericValue === '' || /^\d*\.?\d*$/.test(numericValue)) {
            setManualInput(prev => ({ ...prev, protein: numericValue }));
          }
        }}
        style={styles.input}
      />
      <Input
        label="脂肪(g)"
        placeholder="輸入每份脂肪 (預設為0)"
        keyboardType="decimal-pad"
        value={manualInput.fat}
        onChangeText={value => {
          const numericValue = value.replace(/[^0-9.]/g, '');
          if (numericValue === '' || /^\d*\.?\d*$/.test(numericValue)) {
            setManualInput(prev => ({ ...prev, fat: numericValue }));
          }
        }}
        style={styles.input}
      />
      <Input
        label="碳水化合物(g)"
        placeholder="輸入每份碳水化合物 (預設為0)"
        keyboardType="decimal-pad"
        value={manualInput.carbohydrates}
        onChangeText={value => {
          const numericValue = value.replace(/[^0-9.]/g, '');
          if (numericValue === '' || /^\d*\.?\d*$/.test(numericValue)) {
            setManualInput(prev => ({ ...prev, carbohydrates: numericValue }));
          }
        }}
        style={styles.input}
      />
      <View style={styles.quantityContainer}>
        <Input
          label="數量"
          placeholder="輸入數量 (預設為1)"
          keyboardType="decimal-pad"
          value={manualInput.quantity}
          onChangeText={value => {
            const numericValue = value.replace(/[^0-9.]/g, '');
            if (numericValue === '' || /^\d*\.?\d*$/.test(numericValue)) {
              setManualInput(prev => ({ ...prev, quantity: numericValue }));
            }
          }}
          style={styles.quantityInput}
        />
        <View style={styles.unitButtonContainer}>
          <Button
            size="medium"
            style={{ marginTop: 14 }}
            appearance={manualInput.unitType === 'servings' ? 'filled' : 'outline'}
            onPress={() => setManualInput(prev => ({ ...prev, unitType: 'servings' }))}
          >
            份
          </Button>
        </View>
      </View>
      <Button
        appearance="ghost"
        status="basic"
        accessoryLeft={props => <Icon {...props} name={isUploadVisible ? 'chevron-up-outline' : 'chevron-down-outline'}/>}
        onPress={() => setIsUploadVisible(!isUploadVisible)}
      >
        {isUploadVisible ? '收起圖片上傳' : '展開圖片上傳'}
      </Button>
      
      {isUploadVisible && (
        <TouchableOpacity 
          onPress={() => handleImagePick(setManualInput)}
          style={styles.imageUploadContainer}
        >
          {manualInput.image_base64 ? (
            <Image
              source={{ uri: manualInput.image_base64 }}
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
      </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 72 : 32}
    >
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.headerContainer}>
            <Text category="h6" style={styles.title}>
              {selectedIndex === 0 ? '🪄✨ 剛才吃了...' : '📝 手動紀錄'}
            </Text>
          </View>
          
          <TabBar
            selectedIndex={selectedIndex}
            onSelect={index => setSelectedIndex(index)}
            style={styles.tabBar}
          >
            <Tab title='AI 偵測' />
            <Tab title='手動輸入' />
          </TabBar>
          
          <View style={{ marginTop: 10}}>
          {selectedIndex === 0 ? renderPromptInput() : (
            renderManualInput()
          )}
          </View>

          </ScrollView>
        </View>
        {selectedIndex === 0 ? (
          <View style={styles.bottomButtonContainer}>
            <Button 
              onPress={handleRecordIntake} 
              style={styles.bottomButton}
              disabled={!detectedFoods?.length || detectedFoods.some(food => !food.quantity)}
              >
              紀錄食物
            </Button>
          </View>
        ) : (
          <View style={styles.bottomButtonContainer}>
            <Button
              onPress={handleManualSubmit}
              style={styles.bottomButton}
              disabled={!manualInput.foodName || !manualInput.calories}
            >
              紀錄食物
            </Button>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  micButton: {
    width: 60,
    height: 85,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  scrollViewContent: {                                                                                                                                            
    flexGrow: 1,
  },
  tabBar: {
    marginBottom: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    textAlign: 'left',
    flex: 1,
  },
  closeIcon: {
    width: 24,
    height: 24,
    padding: 4,
  },
  subtitle: {
    marginTop: 15,
    marginBottom: 10,
  },
  input: {
    minHeight: 70,
  },
  button: {
    marginTop: 10,
  },
  list: {
    height: 200,
    marginVertical: 10,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  foodItemContainer: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    marginTop: 5
  },
  quantityInput: {
    flex: 1,
    marginRight: 10,
  },
  unitButtonContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  bottomButtonContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: 'white',
  },
  bottomButton: {
    marginTop: 0,
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
});
