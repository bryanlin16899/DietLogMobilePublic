import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Button, Icon, IconProps, Layout, Text } from '@ui-kitten/components';
import { Image, Platform, StatusBar, StyleSheet, ToastAndroid, View } from 'react-native';
import { API_URL } from 'react-native-dotenv';
import { useUser } from '../context/UserContext';
import { authenticateWithGoogle } from '../services/auth';

// Configure Google Sign-In (ideally move to a config file)
GoogleSignin.configure({
  iosClientId: '<IOS_CLIENT_ID>',
  webClientId: '<ANDROID_CLIENT_ID>', // for android debug version
  offlineAccess: true,
  scopes: ['profile', 'email'],
  forceCodeForRefreshToken: true,
});

const GoogleIcon = (props: IconProps) => <Icon {...props} name='google' />;

export const LoginScreen = () => {
  const { setUserInfo, setToken } = useUser();

  const handleGoogleSignIn = async () => {
    try {
      // Attempt to sign in
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      console.log(Platform.OS);
      // Authenticate with backend
      const { token, userInfo: backendUserInfo } = await authenticateWithGoogle(
        userInfo.data?.idToken || '',
        Platform.OS
      );
      
      ToastAndroid.show('登入成功', ToastAndroid.TOP);
      // Update context
      setUserInfo(backendUserInfo);
      setToken(token);

    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in
        console.log('Sign-in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign-in is already in progress
        console.log('Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        console.log('Play services not available');
      } else {
        // Some other error happened
        console.error('Google Sign-In Error:', error, API_URL);
        ToastAndroid.show(`登入失敗 ${error}`, ToastAndroid.TOP);
      }
    }
  };

  return (
    <Layout style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../assets/icon.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text category="h1" style={styles.title}>
          鼻鼻食記
        </Text>
        <Button 
          onPress={handleGoogleSignIn}
          style={styles.googleButton}
          accessoryLeft={<GoogleIcon/>}
        >
          Google 登入
        </Button>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    marginBottom: 20,
  },
  googleButton: {
    width: '80%',
  },
});
