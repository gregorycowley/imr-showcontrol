# imr-showcontrol

Show Control is the student interface for the immersive room. Download the latest build from [Releases](https://github.com/gregorycowley/imr-showcontrol/releases).

## Mac

1. Download `Show-Control-*-arm64.dmg`.
2. Open the disk image and drag **Show Control** to Applications.
3. The first open says the app is damaged. It is not. macOS marks files downloaded in Chrome, and this build is not signed with an Apple Developer ID.
4. Open Terminal and remove the quarantine flag:

```sh
xattr -cr "/Applications/Show Control.app"
```

5. Open Show Control from Applications.

Right-click → Open does not clear that dialog.

## Windows

1. Download the `.exe` installer.
2. If SmartScreen warns, choose More info, then Run anyway.
