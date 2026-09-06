# QRify Pro — Enhanced & Scan-Safe

QRify Pro generates standards-based QR codes for URL, text, email, phone and Wi-Fi.

## Scan compatibility improvements

This version is tuned for reliable scanning by common phone cameras and Google Lens:

- **Universal scan-safe mode is ON by default**
  - Pure black modules on a white background
  - High (H) error correction
  - No proprietary or custom QR encoding
- **Proper quiet zone on exported PNGs**
  - Downloaded QR images include a generous clean border around the code.
  - This prevents surrounding UI/graphics from touching the QR and improves camera detection.
- **Wi-Fi payload fixed**
  - Uses the standard `WIFI:T:...;S:...;P:...;H:...;;` format.
  - Correctly escapes backslash, semicolon, comma and colon in SSID/password.
  - Supports WPA/WPA2/WPA3, WEP and open networks.
  - Supports hidden networks.
- **Wi-Fi history/reuse fixed**
  - SSID, password, security type and hidden-network flag are restored correctly.
- **High error correction by default**
  - Helps the QR remain readable if it is slightly damaged, compressed or photographed.
- Custom styling remains available, but scan-safe mode should remain enabled for maximum compatibility.

> No QR generator can honestly guarantee that every scanner on every device will accept every payload. Scanner applications differ, especially for Wi-Fi, `tel:` and `mailto:` actions. QRify uses standard QR encoding and the standard Wi-Fi payload format to maximize interoperability.

## How to use

1. Open `index.html`.
2. Choose URL, text, email, phone or Wi-Fi.
3. Enter the content.
4. Keep **Universal scan-safe mode** enabled for maximum compatibility.
5. Click **Generate QR Code**.
6. Download the PNG. The export includes a scan-safe quiet zone.
7. Test the downloaded image with Google Lens and your phone camera before printing.

## Wi-Fi notes

For best results:
- Enter the Wi-Fi **SSID exactly as broadcast by the router**.
- Select the actual security type.
- Enter the password exactly, including capitalization and symbols.
- Turn on **Hidden network** only if the SSID is actually hidden.
- If a phone camera recognizes the QR but does not offer to join Wi-Fi, that behavior can be caused by the phone OS/camera app rather than the QR itself.

## Run locally

Open `index.html`, or use VS Code Live Server.

You can also run:

`python -m http.server 8000`

Then open `http://localhost:8000`.

## Dependencies

QRCode.js and Google Fonts are loaded through CDNs, so internet access is needed when opening the app unless those assets are self-hosted.
