import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightColors, DarkColors, ColorPalette } from "../constants";

interface ThemeContextType {
  colors: ColorPalette;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: LightColors,
  isDark: false,
  toggleTheme: () => {},
});

const STORAGE_KEY = "@oinky_dark_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === "true") setIsDark(true);
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{ colors: isDark ? DarkColors : LightColors, isDark, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export type { ColorPalette };
