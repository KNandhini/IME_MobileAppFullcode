const ROBOTO_VARIANTS = {
  100: '100Thin',
  200: '200ExtraLight',
  300: '300Light',
  400: '400Regular',
  500: '500Medium',
  600: '600SemiBold',
  700: '700Bold',
  800: '800ExtraBold',
  900: '900Black',
};

export const getRobotoFontFamily = (fontWeight = '400', fontStyle = 'normal') => {
  const weight = fontWeight === 'normal'
    ? 400
    : fontWeight === 'bold'
      ? 700
      : Number(fontWeight) || 400;
  const variant = ROBOTO_VARIANTS[weight] || ROBOTO_VARIANTS[400];
  return `Roboto_${variant}${fontStyle === 'italic' ? '_Italic' : ''}`;
};
