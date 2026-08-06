# IME UI Theme Audit

## Scope

Audited `App.js`, Expo native configuration, all files under `src/components`,
`src/navigation`, and `src/screens` for colors, spacing, radii, shadows, inline
styles, `StyleSheet` declarations, status/safe-area surfaces, gradients,
navigation themes, React Native Paper components, modals, dialogs, search bars,
tabs, icons, chips, badges, and FAB-style controls.

## Findings and changes

- The top strip was traced to root navigator/card/status-bar fallback surfaces.
  `NavigationContainer`, the root loading/splash container, stack card surfaces,
  bottom safe-area inset, and `StatusBar` now use centralized theme values.
- React Navigation now receives an explicit theme derived from `COLORS`.
- React Native Paper now receives an explicit MD3 light theme derived from
  `COLORS`.
- Stack headers use the centralized IME header gradient; tab headers and bottom
  navigation use centralized active, inactive, border, and surface colors.
- No drawer navigator or drawer component exists in this project.
- No Material UI package is used. The component library is React Native Paper.
- Login quick-action cards were corrected so About IME, Watch Demo, and Explore
  Map use readable secondary-color text on white cards.
- `ListSearchBar` now uses `COLORS`, `SPACING`, `RADIUS`, and `SHADOW`.
- Official brand color literals in render files were replaced by `COLORS`
  references. The logo's own artwork color remains intentionally unchanged.

## Files modified

- `App.js`
- `src/navigation/AppNavigator.js`
- `src/components/Accordion.js`
- `src/components/FeedCard.js`
- `src/components/ListSearchBar.js`
- `src/components/WelcomeCard.js`
- `src/screens/theme.js`
- `src/screens/screenStyles.js`
- All screen render files containing legacy or duplicated official brand-color
  literals (the full `src/screens/*.js` screen set).

Pre-existing non-UI edits in `app.json`, `src/utils/api.js`, and backend
configuration were preserved.

## Components audited

- Root providers and NavigationContainer
- Stack and bottom-tab navigation
- Headers and status/safe-area surfaces
- Login hero and quick-action cards
- Shared search bar, welcome card, accordion, feed card, and logo
- React Native Paper inputs, buttons, search bars, chips, dialogs, and FAB usage
- Screen-local cards, buttons, inputs, modals, gradients, icons, badges, and tabs

## Files already using theme.js before this audit

- `src/navigation/AppNavigator.js`
- `src/screens/AddAdminScreen.js`
- `src/screens/AnimatedSplashScreen.js`
- `src/screens/common.js`
- `src/screens/PaymentScreen.js`
- `src/screens/ProfileEditScreen.js`
- `src/screens/RaiseFundScreen.js`
- `src/screens/RegistrationPaymentScreen.js`
- `src/screens/SignupScreen.js`
- `src/screens/screenStyles.js`

## Manual review

- `src/components/IMELogo.js`: preserved intentionally because logo artwork must
  not be recolored.
- `src/screens/MunicipalMapScreen.js`: map-provider tiles, marker/category colors,
  and geographic overlays require device-level visual review.
- `src/screens/DemoScreen.js` and `src/screens/PresentationScreen.js`: media and
  slide content includes content-specific colors that are not application chrome.
- Status/destructive colors and translucent overlays remain purpose-specific;
  they should not be replaced by brand colors without changing their meaning.
- A fresh Android/iOS native build is required to visually verify OS-controlled
  launch and status-bar surfaces after configuration changes.

## Validation

- All 108 JavaScript entry/render files parse successfully with JSX enabled.
- React Navigation, Paper, stack header, bottom navigation, search, login action,
  loading, root, and safe-area color paths resolve through `theme.js`.
