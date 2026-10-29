# Dynamic Morphology-Aware MobileNetV2 Skin Image Classifier

## Contents
- `model.py`: model architecture matching Experiment C.
- `model_weights.pth`: trained model parameters only.
- `class_mapping.json`: saved output index-to-class mapping.
- `predict.py`: command-line inference example.
- `requirements.txt`: Python dependencies.

## Setup
Use a compatible Python environment, then run:

```bash
pip install -r requirements.txt
```

## Predict an image
```bash
python predict.py path/to/image.jpg
```

For five candidate classes:
```bash
python predict.py path/to/image.jpg --top-k 5
```

The output contains the class name, class index, and softmax score.

## Input preprocessing
Images are converted to RGB, resized to 256 pixels on the shorter side,
center-cropped to 224x224, converted to tensors, and normalized using
ImageNet mean [0.485, 0.456, 0.406] and standard deviation
[0.229, 0.224, 0.225].

## Checkpoint information
- Architecture: MobileNetV2_DynamicMorphology
- Number of classes: 23
- Input size: 224x224
- Best epoch: 13
- Best validation macro F1: 0.4891985799037683

## Integration notes
Call `load_predictor()` once when starting your application, then reuse the
loaded model and preprocessing transform for each image. For high-volume
inference, adapt the example to batch inputs rather than reloading per image.

This is a research prototype for image classification, not a medical diagnosis
system. Predictions and confidence scores must not be used as a substitute for
professional medical evaluation. Softmax confidence is not calibrated certainty.
