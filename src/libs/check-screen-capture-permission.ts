import { shell } from "electron";

async function openSystemPreferences() {
  await shell.openExternal(
    `x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`
  );
}

export { openSystemPreferences };
