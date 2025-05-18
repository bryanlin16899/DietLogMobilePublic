/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import React from 'react';
import { StatusBar } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { DateProvider } from './src/context/DateContext';
import { DietLogProvider } from './src/context/DietLogContext';
import { UserProvider } from './src/context/UserContext';
import { AssetIconsPack } from './src/feather-icons';
import { AppNavigator } from './src/navigation/AppNavigator';
import { default as theme } from './theme.json';

mobileAds()
.initialize()
.then(adapterStatuses => {
  // Initialization complete!
});

function AppWrapper() {
  return (
    <>
      <IconRegistry icons={[EvaIconsPack, AssetIconsPack]} />
      <ApplicationProvider {...eva} theme={{ ...eva.light, ...theme }}>
        <StatusBar
          translucent={false}
          barStyle="dark-content"
        />
        <UserProvider>
          <DateProvider>
          <DietLogProvider>
          <AppNavigator />
          </DietLogProvider>
          </DateProvider>
        </UserProvider>
      </ApplicationProvider>
    </>
  );
}

export default AppWrapper;
