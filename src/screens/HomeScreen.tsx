import { Datepicker, Icon, IconProps, Layout, StyleType, TopNavigation } from '@ui-kitten/components';
import React, { useEffect } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import DietLogProgress from '../components/DietLogProgress';
import DietLogTable from '../components/DietLogTable';
import { useDate } from '../context/DateContext';
import { useDietLog } from '../context/DietLogContext';
import { localeDateService } from '../services/calendarLocale';
import { formatDateToString } from '../services/utils';

const CalendarIcon = (props: IconProps) => (
  <Icon {...props} name='calendar-outline'/>
);
const LegIcon = (props: IconProps) => (
  <Icon {...props} name='leg' pack="assets"/>
);

const DayCell = ({ date }: { date: Date }, style: StyleType, dates: string[]): React.ReactElement => {
  console.log(dates,'jfewijwegijw');
  
  return (
  <View style={[styles.dayContainer, style.container]}>
    <Text style={style.text}>
      {date.getDate()}
    </Text>
    {dates.includes(formatDateToString(date)) && (
      <LegIcon style={{ width: 12, height: 12, marginTop: 4, alignSelf: 'center' }} />
    )}
  </View>
)};

const HomeScreen = () => {
  const { selectedDate, setSelectedDate } = useDate();
  const { dietLog, fetchDietLog } = useDietLog();
  const { dateHasIntake, fetchDateHasIntakeInMonth } = useDietLog();

  useEffect(() => {
    fetchDietLog(selectedDate, false);
    fetchDateHasIntakeInMonth(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
  }, [selectedDate]);
  
  return (
    <Layout style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <TopNavigation title="鼻鼻食記" alignment='start' style={styles.topNav}/>
          <Datepicker
            date={selectedDate}
            onSelect={nextDate => setSelectedDate(nextDate)}
            accessoryRight={CalendarIcon}
            style={styles.datePicker}
            min={new Date(2020, 0, 1)}
            max={new Date(2030, 11, 31)}
            dateService={localeDateService}
            renderDay={(date, style) => DayCell(date, style, dateHasIntake)}
          />
        </View>
        <View style={styles.summaryContainer}>
          <DietLogProgress dietLog={dietLog} />
        </View>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl 
                refreshing={false}
                onRefresh={() => {
                  fetchDietLog(selectedDate, false)
                }}
              />
          }
        >
          <DietLogTable 
            dietLog={dietLog} 
            onRefresh={() => fetchDietLog(selectedDate, false)}
          />
        </ScrollView>
      </SafeAreaView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  title: {
    textAlign: 'center',
    marginVertical: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    width: '100%',
  },
  topNav: {
    flex: 1,
  },
  datePicker: {
    width: '45%',
  },
  addButton: {
    margin: 15,
    alignSelf: 'center',
  },
  progressContainer: {
    padding: 16,
  },
  progressItem: {
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    marginTop: 8,
  },
  summaryContainer: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  dayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
  },
  value: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default HomeScreen;
