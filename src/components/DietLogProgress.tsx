import { CircularProgressBar, Icon, IconProps, Layout, ProgressBar, Text, Tooltip } from '@ui-kitten/components';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DietLog } from '../services/api';

interface DietLogProgressProps {
  dietLog: DietLog | null;
  caloriesGoal?: number;
}

const DietLogProgress: React.FC<DietLogProgressProps> = ({ dietLog, caloriesGoal = 2000 }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  if (!dietLog) {
    return null;
  }

  const intakeProgress = dietLog.intake / caloriesGoal;
  // const consumptionProgress = dietLog.consumption / caloriesGoal;

  // Calculate total macronutrients from intake foods
  const totalMacros = dietLog.intake_foods?.reduce((acc, food) => ({
    protein: acc.protein + food.protein,
    fat: acc.fat + food.fat,
    carbohydrates: acc.carbohydrates + food.carbohydrates
  }), {
    protein: 0,
    fat: 0,
    carbohydrates: 0
  }) || {
    protein: 0,
    fat: 0,
    carbohydrates: 0
  };

  const toggleTooltip = () => {
    setTooltipVisible(!tooltipVisible);
  };

  // Daily recommended values (in grams)
  const proteinGoal = 70;
  const fatGoal = 65;
  const carbsGoal = 300;

  const FireIcon = (props: IconProps) => (
    <Icon {...props} name='fire' pack="assets"/>
  );
  return (
    <Layout style={styles.container}>
      <View style={styles.progressContainer}>
        <Tooltip
          anchor={() => 
            <View style={styles.progressItem}>
              <CircularProgressBar
                progress={intakeProgress}
                size='giant'
                status='danger'
                renderIcon={FireIcon}
                onTouchStart={() => toggleTooltip()}
              />
              <Text category="s1" style={styles.label}>攝入熱量</Text>
            </View>
          }
          visible={tooltipVisible}
          onBackdropPress={() => toggleTooltip()}
          placement='bottom'
        >
          <Text style={{ color: 'white' }}>還剩 {(caloriesGoal - dietLog.intake).toFixed(0)} 大卡 🫠</Text>
          <Text style={{ color: 'white' }}>扣除消耗還剩 {(caloriesGoal - dietLog.intake + dietLog.consumption).toFixed(0)} 大卡</Text>
        </Tooltip>
        <View style={styles.progressBar}>
          <View style={styles.macroItem}>
            <View style={styles.labelRow}>
              <Text category="s1">蛋白質</Text>
              <Text category="s1">{totalMacros.protein ? Math.round(totalMacros.protein) : '-'} g</Text>
            </View>
            <ProgressBar
              size='medium'
              progress={Math.min(totalMacros.protein / proteinGoal, 1)}
              status='success'
            />
          </View>

          <View style={styles.macroItem}>
            <View style={styles.labelRow}>
              <Text category="s1">脂肪</Text>
              <Text category="s1">{totalMacros.fat ? Math.round(totalMacros.fat) : '-'} g</Text>
            </View>
            <ProgressBar
              size='medium'
              progress={Math.min(totalMacros.fat / fatGoal, 1)}
              status='warning'
            />
          </View>

          <View style={styles.macroItem}>
            <View style={styles.labelRow}>
              <Text category="s1">碳水化合物</Text>
              <Text category="s1">{totalMacros.carbohydrates ? Math.round(totalMacros.carbohydrates) : '-'} g</Text>
            </View>
            <ProgressBar
              size='medium'
              progress={Math.min(totalMacros.carbohydrates / carbsGoal, 1)}
              status='info'
            />
          </View>
          <View style={styles.labelRow}>
            <Text category="s1">
              淨攝入
            </Text>
            <Text category="s1">
              {dietLog.intake ? Math.round(dietLog.intake - dietLog.consumption) : '-'} 大卡
            </Text>
          </View>
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    // marginBottom: 16,
  },
  progressItem: {
    alignItems: 'center',
    marginHorizontal: 12,
    position: 'relative',
  },
  label: {
    marginTop: 18,
  },
  progressBar: {
    width: '50%',
  },
  macroItem: {
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  }
});

export default DietLogProgress;
