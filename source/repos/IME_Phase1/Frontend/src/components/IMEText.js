import React, { createContext, forwardRef, useContext } from 'react';
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput } from 'react-native';
import { getRobotoFontFamily } from '../utils/typography';

const AppTextSizeContext = createContext(null);

export const AppTextSizeProvider = ({ fontSize, children }) => (
  <AppTextSizeContext.Provider value={fontSize}>
    {children}
  </AppTextSizeContext.Provider>
);

const withRobotoFont = (Component) => {
  const RobotoComponent = forwardRef(({ style, ...props }, ref) => {
    const textStyle = StyleSheet.flatten(style) || {};
    const fontFamily = getRobotoFontFamily(textStyle.fontWeight, textStyle.fontStyle);
    const uniformFontSize = useContext(AppTextSizeContext);

    return (
      <Component
        ref={ref}
        {...props}
        style={[
          style,
          uniformFontSize == null ? null : { fontSize: uniformFontSize },
          { fontFamily, fontWeight: 'normal', fontStyle: 'normal' },
        ]}
      />
    );
  });

  RobotoComponent.displayName = `Roboto${Component.displayName || Component.name}`;
  return RobotoComponent;
};

export const AppText = withRobotoFont(NativeText);
export const AppTextInput = withRobotoFont(NativeTextInput);
