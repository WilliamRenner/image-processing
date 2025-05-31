const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const app = express();
const upload = multer();

app.use(express.json());

app.post('/reposition-face', upload.single('image'), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;
    const { x, y, width, height } = req.body; // Face coordinates from OpenAI
    
    // Get original image dimensions
    const { width: imgWidth, height: imgHeight } = await sharp(imageBuffer).metadata();
    
    // Calculate face center and eye position
    const faceCenterX = x + (width / 2);
    const faceTopY = y; // Top of face (approximately eye level)
    
    // Target 16:9 aspect ratio
    const targetAspectRatio = 16 / 9;
    let outputWidth, outputHeight;
    
    if (imgWidth / imgHeight > targetAspectRatio) {
      // Image is wider than 16:9, constrain by height
      outputHeight = imgHeight;
      outputWidth = Math.floor(outputHeight * targetAspectRatio);
    } else {
      // Image is taller than 16:9, constrain by width
      outputWidth = imgWidth;
      outputHeight = Math.floor(outputWidth / targetAspectRatio);
    }
    
    // Position eyes in top third (1/3 down from top)
    const eyeTargetY = outputHeight / 3;
    
    // Calculate crop position to center face horizontally and position eyes in top third
    const cropX = Math.max(0, Math.min(faceCenterX - (outputWidth / 2), imgWidth - outputWidth));
    const cropY = Math.max(0, Math.min(faceTopY - eyeTargetY, imgHeight - outputHeight));
    
    const repositionedImage = await sharp(imageBuffer)
      .extract({
        left: Math.floor(cropX),
        top: Math.floor(cropY),
        width: outputWidth,
        height: outputHeight
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    res.set('Content-Type', 'image/jpeg');
    res.send(repositionedImage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000);
