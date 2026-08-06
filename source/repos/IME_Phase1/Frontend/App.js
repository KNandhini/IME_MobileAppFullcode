import 'react-native-gesture-handler';
import { DefaultTheme as NavigationDefaultTheme, NavigationContainer } from '@react-navigation/native';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/screens/theme';

const imeTheme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.selected,
    secondary: COLORS.secondary,
    secondaryContainer: '#DCEFF3',
    tertiary: COLORS.accent,
    background: COLORS.bg,
    surface: COLORS.white,
    surfaceVariant: COLORS.bgSoft,
    onSurface: COLORS.text,
    onBackground: COLORS.text,
    outline: COLORS.placeholder,
    error: COLORS.danger,
  },
};

const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.bg,
    card: COLORS.white,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.headerStart} />
      <PaperProvider theme={imeTheme}>
        <AuthProvider>
          <NavigationContainer theme={navigationTheme}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
