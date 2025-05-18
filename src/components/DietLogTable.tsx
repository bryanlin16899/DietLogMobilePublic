import { Text } from '@ui-kitten/components';
import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import { DietLog, removeIntake, UploadIntakeImage } from '../services/api';
import { IntakeFoodCardSmall } from './IntakeFoodCard';

interface DietLogTableProps {
  dietLog: DietLog | null;
  onRefresh: () => void;
}

interface ImageUpload {
  image_base64: string | null;
  id: number | null;
}

const DietLogTable: React.FC<DietLogTableProps> = ({ dietLog, onRefresh }) => {
  const [uploadedImage, setUploadedImage] = useState<ImageUpload>({
      image_base64: null,
      id: null,
    });
  useEffect(() => {
    if (uploadedImage.image_base64 && uploadedImage.id) {
      handleUploadImage(uploadedImage);
      setUploadedImage({ image_base64: null, id: null });
    }
  }, [uploadedImage]);
  const handleRemoveIntake = async (foodId: number) => {
    if (!dietLog) return;
    
    try {
      await removeIntake(foodId);
      onRefresh();
    } catch (error) {
      console.error('Failed to remove intake:', error);
    }
  };

  if (!dietLog) {
    return null;
  }

  const handleUploadImage = async (uploadedImage: ImageUpload) => {
    if (!uploadedImage.image_base64 || !uploadedImage.id) return;
    try {
      await UploadIntakeImage(uploadedImage.image_base64, uploadedImage.id);
      onRefresh();
    }
    catch (error) {
      console.error('Failed to upload image:', error);
    }
  }

  return (
    <>
      {(!dietLog.intake_foods || dietLog.intake_foods.length === 0) && (
        <View style={{ alignItems: 'center' }}>
          <Image 
            source={require('../assets/404.png')}
            style={{ width: 230, height: 230, marginVertical: 20 }}
          />
          <Text category='h6' style={{ textAlign: 'center', marginBottom: 20 }}>
            今天還沒有記錄任何食物
          </Text>
        </View>
      )}
      {dietLog.intake_foods?.map((food, index) => (
        <IntakeFoodCardSmall 
          key={`${food.id}-${index}`}
          food={food}
          onRemove={() => handleRemoveIntake(food.id)}
          setUploadedImage={setUploadedImage}
          onRefresh={onRefresh}
        />
      ))}
    </>
  );
};

export default DietLogTable;
