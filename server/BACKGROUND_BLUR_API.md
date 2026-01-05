# Background Blur API Documentation

This API endpoint allows you to upload images and blur the background while keeping the main object(s) in focus.

## Installation

First, install the required dependency:

```bash
cd server
npm install @imgly/background-removal-node
```

## API Endpoints

### 1. POST `/api/blur-background`

Upload an image and receive the processed image directly as a PNG.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Image file (jpeg, jpg, png, webp)
  - `blurRadius`: (optional) Blur intensity, default: 10

**Response:**
- Content-Type: `image/png`
- Body: Processed image buffer

**Example using cURL:**
```bash
curl -X POST http://localhost:8000/api/blur-background \
  -F "file=@/path/to/image.jpg" \
  -F "blurRadius=15" \
  --output blurred_image.png
```

**Example using JavaScript (fetch):**
```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('blurRadius', '15')

const response = await fetch('http://localhost:8000/api/blur-background', {
  method: 'POST',
  body: formData
})

const blob = await response.blob()
const imageUrl = URL.createObjectURL(blob)
// Use imageUrl to display the image
```

### 2. POST `/api/blur-background-base64`

Upload an image and receive the processed image as a base64-encoded data URL.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Image file (jpeg, jpg, png, webp)
  - `blurRadius`: (optional) Blur intensity, default: 10

**Response:**
```json
{
  "success": true,
  "image": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "size": 123456
}
```

**Example using JavaScript (fetch):**
```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('blurRadius', '15')

const response = await fetch('http://localhost:8000/api/blur-background-base64', {
  method: 'POST',
  body: formData
})

const data = await response.json()
if (data.success) {
  // Use data.image directly as src for img tag
  document.getElementById('result').src = data.image
}
```

## How It Works

1. **Background Removal**: Uses `@imgly/background-removal-node` to detect and extract the main object(s) from the image, creating a mask with transparent background.

2. **Background Blurring**: Uses `sharp` to apply a blur effect to the original image.

3. **Compositing**: Combines the blurred background with the sharp foreground object to create the final image.

## Parameters

- **blurRadius**: Controls the intensity of the blur effect
  - Range: 1-100 (recommended: 5-20)
  - Default: 10
  - Higher values = more blur

## Model Options

The background removal uses a machine learning model. You can modify the model size in `blurRoutes.js`:

- `'small'`: Fastest, lower accuracy
- `'medium'`: Balanced (default)
- `'large'`: Slowest, highest accuracy

## Error Handling

The API returns appropriate HTTP status codes:
- `400`: No file uploaded or invalid file type
- `500`: Processing error (check server logs for details)

## Performance Notes

- Processing time depends on image size and model selection
- First request may be slower as models are loaded
- Recommended max file size: 10MB (configurable in `blurRoutes.js`)
- For production, consider adding caching and rate limiting

## Alternative Libraries

If `@imgly/background-removal-node` doesn't meet your needs, here are alternatives:

1. **TensorFlow.js with DeepLab** (already installed)
   - More control but requires more setup
   - Good for custom segmentation tasks

2. **@mediapipe/selfie_segmentation**
   - Optimized for people/selfies
   - Very fast and accurate for human subjects

3. **rembg** (Python)
   - Requires Python subprocess
   - Excellent results but adds Python dependency
