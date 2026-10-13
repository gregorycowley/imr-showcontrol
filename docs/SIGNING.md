# Signing the Mac app for GitHub

Reference for publishing a Show Control build that students can open. The app is downloaded from GitHub Releases. It is not submitted to the Mac App Store.

An unsigned download is marked by the browser. macOS then says the app is damaged. Right-click → Open does not clear that dialog. The workaround for an unsigned build is:

```sh
xattr -cr "/Applications/Show Control.app"
```

A signed and notarized build opens with a double-click. Signing uses a **Developer ID Application** certificate. Notarization is Apple's scan for apps distributed outside the store. The scan does not list the app in the App Store.

## Certificate

A `.cer` downloaded from Apple is only the public half. The private key is created on the Mac that makes the certificate request, and Apple never receives it. A certificate downloaded without that request cannot be exported as a `.p12`.

Other people's names in Keychain Access are public certificates saved from signed email. They are not a signing identity.

Create the request on the Mac that will export the key:

1. Open Keychain Access → **Certificate Assistant → Request a Certificate From a Certificate Authority**.
2. Use the email on the Apple Developer account. Choose **Saved to disk**.
3. Save the `.certSigningRequest` file. This writes the private key into the **login** keychain.

On [developer.apple.com](https://developer.apple.com/account/resources/certificates), create a **Developer ID Application** certificate and upload that request. Do not create an Apple Development or Apple Distribution certificate. Those are for Xcode testing and the App Store.

Download the new `.cer`. In Keychain Access, select the **login** keychain, then double-click the `.cer`.

Confirm it under **login → My Certificates**. The name looks like `Developer ID Application: Your Name (TEAMID)`. Expand it. A private key is listed underneath. If the certificate appears only under **System → Certificates**, or **My Certificates** is empty, the key and the certificate are not in the same keychain and the `.p12` option stays grey.

Export the private key: select it, **File → Export Items**, format **Personal Information Exchange (.p12)**. Set a password and keep it. That password is the `CSC_KEY_PASSWORD` secret.

```sh
base64 -i Certificates.p12 | pbcopy
```

The copied text is the `CSC_LINK` secret. Do not commit the `.p12` or the base64 text.

## Notarization key

Notarization uses an App Store Connect API key as a login. It does not upload the app to the store.

At [App Store Connect → Integrations → API](https://appstoreconnect.apple.com/access/integrations/api), create a key with the **Developer** role. Download the `.p8` once. Note the **Key ID** and the **Issuer ID**. The Team ID is on the Apple Developer membership page.

```sh
base64 -i AuthKey_XXXXXXXX.p8 | pbcopy
```

That text is the `APPLE_API_KEY` secret. `notarytool` does not accept the base64 text itself. It wants a path to the `.p8`. The release workflow decodes the secret into a file and passes that path. A trailing newline from `pbcopy` is stripped there. If notarization says `The value '***' is invalid for '--key'`, the secret was passed as a path instead of being decoded.

## GitHub secrets

Repo → **Settings → Secrets and variables → Actions**.

| Secret | Value |
|---|---|
| `CSC_LINK` | Base64 of the `.p12` |
| `CSC_KEY_PASSWORD` | Password set when exporting the `.p12` |
| `APPLE_API_KEY` | Base64 of the `.p8` |
| `APPLE_API_KEY_ID` | Key ID |
| `APPLE_API_ISSUER` | Issuer ID |

`GITHUB_TOKEN` is provided by Actions. It is not one of these secrets.

## What the build does

[`.github/workflows/release.yml`](../.github/workflows/release.yml) runs on a version tag. The Mac job passes the five secrets to electron-builder. [`shell/package.json`](../shell/package.json) has `hardenedRuntime` and `notarize` turned on. electron-builder signs the app, sends it to Apple, staples the notarization ticket, and attaches the dmg and zip to the GitHub release.

Publish by tagging the version in `shell/package.json`:

```sh
git tag v1.0.1
git push origin v1.0.1
```

Watch the run at [the Actions tab](https://github.com/gregorycowley/imr-showcontrol/actions). Notarization adds several minutes. The signed dmg appears on [Releases](https://github.com/gregorycowley/imr-showcontrol/releases). Students use that file, not an older unsigned release.

If the Mac job fails while importing the certificate, the `.p12` password is wrong, the file was not base64-encoded, or the certificate is not a Developer ID Application certificate.

`SecKeychainUnlock: The user name or passphrase you entered is not correct` on `set-key-partition-list` is a different failure. electron-builder creates the temporary keychain with a random password, then tries to unlock it with the `.p12` password. The import of the certificate has already succeeded, so `CSC_KEY_PASSWORD` is fine. The patch in `shell/patches/` makes that command use the keychain password. `npm ci` applies it through `patch-package`.
