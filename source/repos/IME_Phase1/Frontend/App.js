import { useFonts } from 'expo-font';
import {
  Roboto_100Thin,
  Roboto_100Thin_Italic,
  Roboto_200ExtraLight,
  Roboto_200ExtraLight_Italic,
  Roboto_300Light,
  Roboto_300Light_Italic,
  Roboto_400Regular,
  Roboto_400Regular_Italic,
  Roboto_500Medium,
  Roboto_500Medium_Italic,
  Roboto_600SemiBold,
  Roboto_600SemiBold_Italic,
  Roboto_700Bold,
  Roboto_700Bold_Italic,
  Roboto_800ExtraBold,
  Roboto_800ExtraBold_Italic,
  Roboto_900Black,
  Roboto_900Black_Italic,
} from '@expo-google-fonts/roboto';
import 'react-native-gesture-handler';
import { DefaultTheme as NavigationDefaultTheme, NavigationContainer } from '@react-navigation/native';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/screens/theme';
import { getRobotoFontFamily } from './src/utils/typography';

const ROBOTO_FONTS = {
  Roboto_100Thin,
  Roboto_100Thin_Italic,
  Roboto_200ExtraLight,
  Roboto_200ExtraLight_Italic,
  Roboto_300Light,
  Roboto_300Light_Italic,
  Roboto_400Regular,
  Roboto_400Regular_Italic,
  Roboto_500Medium,
  Roboto_500Medium_Italic,
  Roboto_600SemiBold,
  Roboto_600SemiBold_Italic,
  Roboto_700Bold,
  Roboto_700Bold_Italic,
  Roboto_800ExtraBold,
  Roboto_800ExtraBold_Italic,
  Roboto_900Black,
  Roboto_900Black_Italic,
};

const robotoPaperFonts = Object.fromEntries(
  Object.entries(MD3LightTheme.fonts).map(([name, style]) => [
    name,
    {
      ...style,
      fontFamily: getRobotoFontFamily(style.fontWeight),
      fontWeight: 'normal',
    },
  ])
);

const imeTheme = {
  ...MD3LightTheme,
  fonts: robotoPaperFonts,
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
  fonts: {
    regular: { fontFamily: getRobotoFontFamily('400'), fontWeight: 'normal' },
    medium: { fontFamily: getRobotoFontFamily('500'), fontWeight: 'normal' },
    bold: { fontFamily: getRobotoFontFamily('700'), fontWeight: 'normal' },
    heavy: { fontFamily: getRobotoFontFamily('900'), fontWeight: 'normal' },
  },
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
  const [fontsLoaded, fontError] = useFonts(ROBOTO_FONTS);

  if (fontError) throw fontError;
  if (!fontsLoaded) return null;

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
