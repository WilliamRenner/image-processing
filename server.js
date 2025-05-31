const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const app = express();
const upload = multer();

app.use(express.json());

app.post('/reposition-face', upload.single('image'), async (req, res) => {
  try {
    console.log('=== REQUEST RECEIVED ===');
    console.log('Body:', req.body);
    console.log('File:', req.file ? 'File received' : 'No file received');
    console.log('File details:', req.file ? { 
      fieldname: req.file.fieldname, 
      originalname: req.file.originalname, 
      mimetype: req.file.mimetype, 
      size: req.file.size 
    } : 'N/A');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file received' });
    }
    
    const imageBuffer = req.file.buffer;
    const { x, y, width, height } = req.body;
    
    console.log('Coordinates:', { x, y, width, height });
    
    // Convert to numbers
    const xNum = parseFloat(x);
    const yNum = parseFloat(y);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    
    console.log('Parsed coordinates:', { xNum, yNum, widthNum, heightNum });
    
    const { width: imgWidth, height: imgHeight } = await sharp(imageBuffer).metadata();
    console.log('Image dimensions:', { imgWidth, imgHeight });
    
    const faceCenterX = xNum + (widthNum / 2);
    const faceTopY = yNum;
    
    const targetAspectRatio = 16 / 9;
    let outputWidth, outputHeight;
    
    if (imgWidth / imgHeight > targetAspectRatio) {
      outputHeight = imgHeight;
      outputWidth = Math.floor(outputHeight * targetAspectRatio);
    } else {
      outputWidth = imgWidth;
      outputHeight = Math.floor(outputWidth / targetAspectRatio);
    }
    
    const eyeTargetY = outputHeight / 3;
    const cropX = Math.max(0, Math.min(faceCenterX - (outputWidth / 2), imgWidth - outputWidth));
    const cropY = Math.max(0, Math.min(faceTopY - eyeTargetY, imgHeight - outputHeight));
    
    console.log('Crop settings:', { cropX, cropY, outputWidth, outputHeight });
    
    const repositionedImage = await sharp(imageBuffer)
      .extract({
        left: Math.floor(cropX),
        top: Math.floor(cropY),
        width: outputWidth,
        height: outputHeight
      })
      .jpeg({ quality: 90 })
      .toBuffer();
    
    console.log('=== SUCCESS ===');
    res.set('Content-Type', 'image/jpeg');
    res.send(repositionedImage);
  } catch (error) {
    console.error('=== ERROR ===', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port', process.env.PORT || 3000);
});
