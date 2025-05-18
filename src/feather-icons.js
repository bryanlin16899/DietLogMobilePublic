import React from 'react';
import { Image } from 'react-native';

const IconProvider = (source) => ({
  toReactElement: ({ animation, ...props }) => (
    <Image {...props} source={source}/>
  ),
});

export const AssetIconsPack = {
  name: 'assets',
  icons: {
    'fire': IconProvider(require('./assets/fire.png')),
    'leg': IconProvider(require('./assets/leg.png')),
    // ...
  },
};