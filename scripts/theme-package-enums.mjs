/**
 * Single source for package.json theme-name enums.
 * Values come from ALL_DUSK_THEMES; favorite / lock also allow "".
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { ALL_DUSK_THEMES } = require("../lib/themes/theme-common.js");

export const THEME_ENUM_SPECS = [
  { key: "duskOffice.favoriteTheme", includeEmpty: true },
  { key: "duskOffice.autoSwitch.lightTheme", includeEmpty: false },
  { key: "duskOffice.autoSwitch.darkTheme", includeEmpty: false },
  { key: "duskOffice.adaptiveFocus.defaultLightTheme", includeEmpty: false },
  { key: "duskOffice.adaptiveFocus.defaultDarkTheme", includeEmpty: false },
  { key: "duskOffice.adaptiveFocus.lockTheme", includeEmpty: true },
];

export function buildThemeEnum(includeEmpty) {
  return includeEmpty ? ["", ...ALL_DUSK_THEMES] : [...ALL_DUSK_THEMES];
}

export function enumsEqual(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
