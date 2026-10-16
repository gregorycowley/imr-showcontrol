Download the file for your computer, then open Show Control. The interface is inside the app. Your show is saved on your computer.

**Mac**

1. Download `Show Control-*-mac.zip` (Apple silicon) or the matching Intel zip if one is listed.
2. Unzip it and move `Show Control.app` to Applications.
3. The first time, macOS says the app is damaged. It is not damaged. Chrome marks the download, and this build is not signed with an Apple Developer ID. In Terminal, run:

   ```sh
   xattr -cr "/Applications/Show Control.app"
   ```

   Then open the app again. Right-click → Open does not clear this dialog.

**Windows**

1. Download the `.exe` installer.
2. Open it. Windows may show a SmartScreen warning. Choose More info, then Run anyway.
3. The app installs for your user and opens from the Start menu.
