const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const app = express();
const upload = multer();

app.use(express.json());

app.post('/crop-face', upload.single('image'), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;
    const { x, y, width, height } = req.body;
    
    const padding = Math.max(width, height) * 0.3;
    const cropX = Math.max(0, x - padding);
    const cropY = Math.max(0, y - padding);
    const cropWidth = width + (padding * 2);
    const cropHeight = height + (padding * 2);
    
    const processedImage = await sharp(imageBuffer)
      .extract({ 
        left: Math.floor(cropX), 
        top: Math.floor(cropY), 
        width: Math.floor(cropWidth), 
        height: Math.floor(cropHeight) 
      })
      .resize(512, 512)
      .jpeg({ quality: 90 })
      .toBuffer();
    
    res.set('Content-Type', 'image/jpeg');
    res.send(processedImage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000);
