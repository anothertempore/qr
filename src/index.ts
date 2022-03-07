import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";
import { exec } from "child_process";
import {
  app,
  clipboard,
  globalShortcut,
  Menu,
  Notification,
  Tray,
} from "electron";
import { join } from "path";
import { PNG } from "pngjs";

let tray;

function createTray() {
  tray = new Tray(join(__dirname, "icon/iconTemplate@2x.png"));
  const menu = Menu.buildFromTemplate([
    {
      label: "Screenshot",
      accelerator: "Shift+F1",
      click: execScreenCapture,
    },
    {
      label: "About",
      role: "about",
    },
    {
      label: "Quit",
      role: "quit",
      accelerator: "CommandOrControl+Q",
    },
  ]);
  tray.setContextMenu(menu);
}

function execScreenCapture() {
  // Clear clipboard
  clipboard.clear();

  // Take screenshot
  exec(`screencapture -s -x -c`, (error) => {
    if (error) {
      console.log(`exec error: ${error}`);
      return;
    }

    const image = clipboard.readImage();
    if (image.isEmpty()) return;

    const pngData = clipboard.readImage().toPNG();
    const imageData = PNG.sync.read(pngData);

    const hints = new Map();
    const formats = [BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    const reader = new MultiFormatReader();
    reader.setHints(hints);

    const len = imageData.width * imageData.height;
    const luminancesUint8Array = new Uint8ClampedArray(len);

    for (let i = 0; i < len; i++) {
      luminancesUint8Array[i] =
        ((imageData.data[i * 4] +
          imageData.data[i * 4 + 1] * 2 +
          imageData.data[i * 4 + 2]) /
          4) &
        0xff;
    }

    const luminanceSource = new RGBLuminanceSource(
      luminancesUint8Array,
      imageData.width,
      imageData.height
    );

    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

    try {
      const res = reader.decode(binaryBitmap);
      const text = res.getText();
      clipboard.writeText(text);
      new Notification({
        title: "🎉 Succeed to copy result to clipboard",
        body: `${text}`,
      }).show();
    } catch (err) {
      new Notification({
        title: "😕 Failed to copy result to clipboard",
        body: "Sorry, we cannot recognize it :(",
      }).show();
    }
  });
}

app.whenReady().then(() => {
  app.dock.hide();

  globalShortcut.register("Shift+F1", execScreenCapture);

  createTray();
});
