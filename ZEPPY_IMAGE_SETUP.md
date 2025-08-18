# How to Add Zeppy's Photo

## Method 1: Using Data URI (Recommended)

1. **Convert your image to base64:**
   - Go to https://base64.guru/converter/encode/image
   - Upload your Zeppy image
   - Copy the generated base64 string

2. **Replace the image source in index.html:**

     
## Method 2: Using JavaScript (Dynamic)

Add this script after the chatbot is initialized:

```javascript
// Example of setting Zeppy's image dynamically
const zeppyImageData = "data:image/jpeg;base64,YOUR_BASE64_STRING_HERE";
window.chatbot.setZeppyImage(zeppyImageData);
```

## Method 3: Using External File

1. **Save your image as `zeppy.jpg` in the same folder**
2. **Update the image source:**
   ```html
   <img src="zeppy.jpg" alt="Zeppy" class="zeppy-image">
   ```

## Image Requirements

- **Format:** JPG, PNG, or SVG
- **Size:** 40x40 pixels (will be automatically resized)
- **Shape:** Square images work best (will be cropped to circle)
- **File Size:** Keep under 100KB for fast loading

## Current Placeholder

The current image is an SVG placeholder with a golden circle and "Z" letter. Replace it with your actual Zeppy photo using any of the methods above.

## Fallback

If the image fails to load, it will automatically show a stylized "Z" letter with the same golden background.
