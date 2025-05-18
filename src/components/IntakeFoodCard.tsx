
import { Button, Card, Divider, Icon, Text } from '@ui-kitten/components';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { IntakeFood } from '../services/types';
import { handleImagePick } from '../services/utils';

const ChevronDownIcon = (props: any) => (
  <Icon {...props} name='chevron-down-outline' />
);

const ChevronUpIcon = (props: any) => (
  <Icon {...props} name='chevron-up-outline' />
);

interface IntakeFoodCardSmallProps {
  food: IntakeFood;
  onRemove: () => void;
  setUploadedImage: React.Dispatch<React.SetStateAction<{ image_base64: string | null; id: number | null }>>;
  onRefresh: () => void;
}

export const IntakeFoodCardSmall: React.FC<IntakeFoodCardSmallProps> = ({ food, onRemove, setUploadedImage, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: expanded ? (food.image_url ? 220 : 115) : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [expanded, food.image_url]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
      onPanResponderMove: (evt, gestureState) => {
        // Only allow sliding left (dx < 0)
        if (gestureState.dx < 0) {
          panX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100) {
          // Slide left detected, trigger onRemove
          onRemove();
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        } else {
          // Return to original position
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.redBackgroundRight, { opacity: panX.interpolate({
          inputRange: [-100, 0],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        }) }]}
      >
        <Icon name='trash-2-outline' style={styles.trashIcon} />
      </Animated.View>
      <Animated.View
        style={[styles.animatedContainer, { transform: [{ translateX: panX }] }]}
        {...panResponder.panHandlers}
      >
        <Card style={styles.card} onPress={() => setExpanded(!expanded)}>
          <View style={styles.headerContainer}>
            <Text category='h6' style={styles.foodName} numberOfLines={1} ellipsizeMode='tail'>
              {food.name}
            </Text>
            <View style={styles.summaryContainer}>
              <Text category='s1' style={styles.calories}>
                共 {food.calories === 0 ? '-' : food.calories.toFixed(1)} 大卡
              </Text>
              <Text category='s1' style={styles.servings}>
                {food.quantity} {food.unit_type === 'grams' ? '克' : '份'}
              </Text>
              {expanded ? <ChevronUpIcon style={styles.icon} /> : <ChevronDownIcon style={styles.icon} />}
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <View></View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressSegment, { flex: food.protein, backgroundColor: '#4CAF50' }]} />
              <View style={[styles.progressSegment, { flex: food.fat, backgroundColor: '#FF9800' }]} />
              <View style={[styles.progressSegment, { flex: food.carbohydrates, backgroundColor: '#2196F3' }]} />
            </View>
          </View>
          <Animated.View style={[styles.expandedContainer, { height: animatedHeight }]}>
            <Divider />
            <View style={styles.nutritionContainer}>
              <View style={styles.nutritionItem}>
                <Text category='s2'>蛋白質</Text>
                <Text>{food.protein === 0 ? '-' : `${food.protein.toFixed(1)}g`}</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text category='s2'>脂肪</Text>
                <Text>{food.fat === 0 ? '-' : `${food.fat.toFixed(1)}g`}</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text category='s2'>碳水</Text>
                <Text>{food.carbohydrates === 0 ? '-' : `${food.carbohydrates.toFixed(1)}g`}</Text>
              </View>
            </View>
            {food.image_url ? (
              <View style={styles.imageWrapper}>
                <Animated.Image
                  source={{ uri: food.image_url }}
                  style={styles.foodImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}
            {!food.image_url && (
              <View style={styles.uploadButtonContainer}>
                <Button
                  style={{
                    width: '100%',
                  }}
                  appearance="ghost"
                  status="basic"
                  accessoryLeft={props => <Icon {...props} name={'plus-outline'} />}
                  onPress={() => {
                    handleImagePick(setUploadedImage);
                    setUploadedImage(prev => ({
                      ...prev,
                      id: food.id,
                    }));
                  }}
                >
                  上傳照片
                </Button>
              </View>
            )}
          </Animated.View>
        </Card>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  redBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 5,
    marginHorizontal: 10,
  },
  redBackgroundRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 5,
    marginHorizontal: 10,
  },
  trashIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  card: {
    marginVertical: 5,
    marginHorizontal: 10,
    paddingVertical: 8,
  },
  animatedContainer: {
    // Optional: add shadow or background to highlight swipe
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodName: {
    flex: 1,
    marginRight: 10,
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calories: {
    marginRight: 10,
  },
  servings: {
    marginRight: 5,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#8F9BB3',
  },
  progressBarContainer: {
    flexDirection: 'row',
    width: '45%',
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressSegment: {
    height: '100%',
  },
  expandedContainer: {
    overflow: 'hidden',
    marginTop: 10,
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  imageWrapper: {
    width: '100%',
    height: 160,
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  uploadButtonContainer: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    paddingVertical: 3,
    marginTop: 10,
    borderRadius: 6,
  },
  deleteButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  deleteIcon: {
    width: 24,
    height: 24,
    tintColor: '#FF3B30',
  },
});
