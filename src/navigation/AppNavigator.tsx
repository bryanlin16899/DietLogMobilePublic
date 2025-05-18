import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomNavigation, BottomNavigationTab, Icon, IconProps } from '@ui-kitten/components';
import { ToastAndroid, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useDate } from '../context/DateContext';
import { useDietLog } from '../context/DietLogContext';
import { FoodListProvider } from '../context/FoodListContext';
import { useUser } from '../context/UserContext';
import { CreateFoodScreen } from '../screens/CreateFoodScreen';
import { EditFoodScreen } from '../screens/EditFoodScreen';
import { FoodsScreen } from '../screens/FoodsScreen';
import HomeScreen from '../screens/HomeScreen';
import { IntakePromptScreen } from '../screens/IntakePromptScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { formatDate } from '../services/utils';

const adUnitId = __DEV__ ? TestIds.BANNER : '<AD_UNIT_ID>';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const HomeIcon = (props: IconProps) => <Icon {...props} name='home-outline' />;
const ListIcon = (props: IconProps) => <Icon {...props} name='list-outline' />;
const LogoutIcon = (props: IconProps) => <Icon {...props} name='log-out-outline' />;
const PlusIcon = (props: IconProps) => <Icon {...props} name='plus-outline'/>;

const BottomTabBar = ({ navigation, state }) => {
  const { logout } = useUser();
  const { selectedDate } = useDate();
  const { fetchDietLog } = useDietLog();

  const onSelect = (index: number): void => {
    if (index === 2) {
      navigation.navigate('IntakePrompt', {
        date: formatDate(selectedDate),
        onSuccess: () => fetchDietLog(selectedDate, false)
      });
      return;
    }
    if (index === 3) {
      logout();
      navigation.navigate('Login');
      return;
    }
    navigation.navigate(state.routeNames[index]);
  };

  return (
    <View style={{ paddingBottom: 12, backgroundColor: '#fff' }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.FULL_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          ToastAndroid.show(`Ad failed to load, ${error.message}`, ToastAndroid.TOP);
        }}
      />
      <BottomNavigation
        selectedIndex={state.index}
        onSelect={onSelect}
        appearance='noIndicator'
      >
      <BottomNavigationTab icon={HomeIcon} title='首頁' />
      <BottomNavigationTab icon={ListIcon} title='食物清單' />
      <BottomNavigationTab icon={PlusIcon} title='新增飲食' />
      <BottomNavigationTab icon={LogoutIcon} title='登出' />
      </BottomNavigation>
    </View>
  );
};

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="TabNavigator" 
      component={TabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="IntakePrompt"
      component={IntakePromptScreen}
      options={({ navigation }) => ({ 
        title: '新增飲食',
        presentation: 'modal',
        headerLeft: () => (
          <Icon
            name='close-outline'
            style={{ width: 24, height: 24 }}
            fill='#000'
            onPress={() => navigation.goBack()}
          />
        )
      })}
    />
    <Stack.Screen 
      name="CreateFood" 
      component={CreateFoodScreen} 
      options={ ({navigation}) => ({ 
        title: '新增食物',
        presentation: 'modal',
        headerLeft: () => (
          <Icon
            name='close-outline'
            style={{ width: 24, height: 24 }}
            fill='#000'
            onPress={() => navigation.goBack()}
          />
        )
      })}
    />
    
    <Stack.Screen 
      name="EditFood" 
      component={EditFoodScreen} 
      options={({navigation}) => ({
        title: '編輯食物',
        presentation: 'modal',
        headerLeft: () => (
          <Icon
            name='close-outline'
            style={{ width: 24, height: 24 }}
            fill='#000'
            onPress={() => navigation.goBack()}
          />
        )
      })}
    />
  </Stack.Navigator>
);


const TabNavigator = () => (
  <Tab.Navigator tabBar={props => <BottomTabBar {...props} />}>
    <Tab.Screen 
      name='首頁' 
      component={HomeScreen}
      options={{ 
        headerShown: false 
      }}
    />
    <Tab.Screen 
      name='食物清單' 
      component={FoodsScreen} 
      options={{ 
        headerShown: false 
      }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { token } = useUser();
  return (
    <NavigationContainer>
      <FoodListProvider>
        <View
          style={{
            flex: 1,
          }}
        >
        {!token ? <LoginScreen /> : <MainStack />}
        </View>
      </FoodListProvider>
    </NavigationContainer>
  );
};
