import { createContext } from 'react';

// Login starts fading in when the splash overlay exits. Later logins should
// fade in immediately rather than wait for a splash signal that won't recur.
export const SplashFadeContext = createContext(true);
