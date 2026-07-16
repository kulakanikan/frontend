import { Dimensions, PixelRatio, Platform, StatusBar } from "react-native";

/**
 * Responsive Layout Utility for Kulakan Ikan
 *
 * Provides scaling functions that adapt sizes proportionally
 * across all phone screen sizes — from iPhone SE (375x667)
 * to Galaxy S24 Ultra (412x915) to tablets.
 *
 * Base design is calibrated on 390x844 (iPhone 14).
 */

// Base dimensions (iPhone 14 — standard modern phone)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Get current screen dimensions (updates on rotation if needed)
const getScreenDimensions = () => {
  const { width, height } = Dimensions.get("window");
  return { width, height };
};

let { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = getScreenDimensions();

/**
 * Listen for dimension changes (e.g., screen rotation).
 * Call this at app root to keep dimensions updated.
 */
export const listenForDimensionChanges = () => {
  const subscription = Dimensions.addEventListener("change", ({ window }) => {
    SCREEN_WIDTH = window.width;
    SCREEN_HEIGHT = window.height;
  });
  return subscription;
};

/**
 * Get current screen width (dynamic)
 */
export const screenWidth = () => Dimensions.get("window").width;

/**
 * Get current screen height (dynamic)
 */
export const screenHeight = () => Dimensions.get("window").height;

/**
 * Get a clamped screen width for scaling calculations.
 * This prevents UI elements from blowing up on large web screens or iPads.
 */
const getScaleWidth = () => Math.min(screenWidth(), 480);
const getScaleHeight = () => Math.min(screenHeight(), 1000);

/**
 * Scale a value horizontally based on screen width.
 * Use for: widths, horizontal paddings, margins, font sizes.
 */
export const wp = (size: number): number => {
  const scale = getScaleWidth() / BASE_WIDTH;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

/**
 * Scale a value vertically based on screen height.
 * Use for: heights, vertical paddings, margins.
 */
export const hp = (size: number): number => {
  const scale = getScaleHeight() / BASE_HEIGHT;
  return Math.round(PixelRatio.roundToNearestPixel(size * scale));
};

/**
 * Moderate scale — a balanced scaling function that doesn't
 * distort too much on large or small screens.
 * factor: 0.5 = halfway between original and full scale (default).
 *         0 = no scaling, 1 = full scaling.
 *
 * Best for: font sizes, icon sizes, border radius.
 */
export const ms = (size: number, factor: number = 0.5): number => {
  const scale = getScaleWidth() / BASE_WIDTH;
  return Math.round(
    PixelRatio.roundToNearestPixel(size + (scale - 1) * size * factor)
  );
};

/**
 * Width as percentage of screen width.
 */
export const widthPercent = (percent: number): number => {
  return Math.round((screenWidth() * percent) / 100);
};

/**
 * Height as percentage of screen height.
 */
export const heightPercent = (percent: number): number => {
  return Math.round((screenHeight() * percent) / 100);
};

/**
 * Check if the device is a small phone (e.g., iPhone SE, Galaxy A03).
 * Width <= 375 dp.
 */
export const isSmallDevice = (): boolean => {
  return screenWidth() <= 375;
};

/**
 * Check if the device is a large phone / phablet (e.g., Pro Max).
 * Width >= 414 dp.
 */
export const isLargeDevice = (): boolean => {
  return screenWidth() >= 414;
};

/**
 * Check if the device is a tablet.
 * Width >= 600 dp.
 */
export const isTablet = (): boolean => {
  return screenWidth() >= 600;
};

/**
 * Get safe status bar height.
 */
export const statusBarHeight = (): number => {
  return Platform.OS === "ios" ? 44 : StatusBar.currentHeight || 24;
};

/**
 * Responsive font size — uses moderate scaling for clean text.
 */
export const fontSize = (size: number): number => {
  return ms(size, 0.3);
};

/**
 * Responsive spacing — uses moderate scaling.
 */
export const spacing = (size: number): number => {
  return ms(size, 0.4);
};

/**
 * Responsive radius — uses light scaling so shapes stay proportional.
 */
export const radius = (size: number): number => {
  return ms(size, 0.25);
};

/**
 * Responsive icon size — moderate scale.
 */
export const iconSize = (size: number): number => {
  return ms(size, 0.35);
};

export default {
  wp,
  hp,
  ms,
  widthPercent,
  heightPercent,
  isSmallDevice,
  isLargeDevice,
  isTablet,
  statusBarHeight,
  fontSize,
  spacing,
  radius,
  iconSize,
  screenWidth,
  screenHeight,
  listenForDimensionChanges,
};
