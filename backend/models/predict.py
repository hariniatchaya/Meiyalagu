import argparse
import json
from pathlib import Path

import torch
from PIL import Image
from torchvision import transforms
try:
    from models.model import MobileNetV2_DynamicMorphology
except ImportError:
    from model import MobileNetV2_DynamicMorphology

HERE = Path(__file__).resolve().parent

def load_predictor():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    with open(HERE / "class_mapping.json", encoding="utf-8") as f:
        mapping = json.load(f)
    class_names = [mapping[str(i)] for i in range(len(mapping))]
    model = MobileNetV2_DynamicMorphology(num_classes=len(class_names))
    state = torch.load(HERE / "model_weights.pth", map_location="cpu",
                       weights_only=True)
    model.load_state_dict(state, strict=True)
    model.to(device).eval()

    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    return model, class_names, transform, device

def predict_image(image_path, top_k=3):
    model, names, transform, device = load_predictor()
    with Image.open(image_path) as img:
        image = transform(img.convert("RGB")).unsqueeze(0).to(device)
    with torch.inference_mode():
        probs = torch.softmax(model(image), dim=1)[0]
    k = min(max(1, top_k), len(names))
    values, indices = torch.topk(probs, k)
    return [
        {"class_name": names[i], "class_index": int(i),
         "confidence": float(v)}
        for v, i in zip(values.cpu().tolist(), indices.cpu().tolist())
    ]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Skin image classifier demo")
    parser.add_argument("image", help="Path to an image file")
    parser.add_argument("--top-k", type=int, default=3)
    args = parser.parse_args()
    print(json.dumps(predict_image(args.image, args.top_k), indent=2))
