import { Dispatch, SetStateAction } from "react";
import { Asset, launchImageLibrary } from "react-native-image-picker";

export const formatDate = (date: Date): string => {                                                                                                           
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

export const handleImagePick = async <T extends { image_base64?: string | null }> (
  state: Dispatch<SetStateAction<T>>
) => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 800,
      maxHeight: 800,
    });

    const firstAsset: Asset | undefined = result.assets?.[0];

    if (firstAsset?.base64) {
      state(prev => ({
        ...prev,
        image_base64: `data:image/jpeg;base64,${firstAsset?.base64}`
      }));
    }
  };

export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}