import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Ignore specific warnings (optional)
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Warning: Failed prop type',
]);

const App = () => {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={{ flex: 1 }}>
          <AppNavigator />
        </SafeAreaView>
      </AppProvider>
    </SafeAreaProvider>
  );
};

export default App;
