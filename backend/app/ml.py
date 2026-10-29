import json
import logging
from pathlib import Path
import torch
import torch.nn.functional as F
from PIL import Image
import numpy as np

from app.config import MODELS_DIR, UPLOADS_DIR

logger = logging.getLogger("meiyalagu.ml")

# Singleton memory cache for model resources
_MODEL = None
_CLASS_NAMES = None
_TRANSFORM = None
_DEVICE = None


def load_model():
    """Load and cache the trained skin classification model and preprocessors."""
    global _MODEL, _CLASS_NAMES, _TRANSFORM, _DEVICE
    if _MODEL is not None:
        return _MODEL, _CLASS_NAMES, _TRANSFORM, _DEVICE

    _DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    mapping_file = MODELS_DIR / "class_mapping.json"
    weights_file = MODELS_DIR / "model_weights.pth"

    if not mapping_file.exists():
        raise FileNotFoundError(f"Class mapping file missing: {mapping_file}")
    if not weights_file.exists():
        raise FileNotFoundError(f"Trained model weights missing: {weights_file}")

    with open(mapping_file, "r", encoding="utf-8") as f:
        mapping = json.load(f)
    _CLASS_NAMES = [mapping[str(i)] for i in range(len(mapping))]

    try:
        from backend.models.model import MobileNetV2_DynamicMorphology
    except ImportError:
        import importlib
        MobileNetV2_DynamicMorphology = getattr(importlib.import_module("models.model"), "MobileNetV2_DynamicMorphology")

    model = MobileNetV2_DynamicMorphology(num_classes=len(_CLASS_NAMES))
    state_dict = torch.load(weights_file, map_location=_DEVICE, weights_only=True)
    model.load_state_dict(state_dict, strict=True)
    model.to(_DEVICE).eval()
    _MODEL = model

    from torchvision import transforms

    # Standard PyTorch normalization
    _TRANSFORM = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    print(f"[AI Model] Loaded AI Model successfully on {_DEVICE} with {len(_CLASS_NAMES)} skin condition classes.")
    return _MODEL, _CLASS_NAMES, _TRANSFORM, _DEVICE


def get_risk_level(class_name: str, confidence: float) -> str:
    """Assess clinical urgency based on predicted condition class."""
    lower = class_name.lower()
    high_keywords = ["melanoma", "malignant", "carcinoma", "cancer"]
    moderate_keywords = [
        "actinic", "systemic", "bacterial", "bullous", "lupus",
        "vasculitis", "infestation", "lyme", "stds", "cellulitis"
    ]
    if any(k in lower for k in high_keywords):
        return "High"
    if any(k in lower for k in moderate_keywords):
        return "Moderate"
    return "Low"


def generate_heatmap(model, input_tensor, device, original_img: Image.Image, output_path: Path) -> bool:
    """Generate Grad-CAM activation heatmap overlay for visual explanation."""
    try:
        activations = []

        def forward_hook(module, inp, out):
            activations.append(out)

        hook_handle = model.dynamic_cbam.register_forward_hook(forward_hook)

        x = input_tensor.clone().detach().requires_grad_(True).to(device)
        output = model(x)
        top_idx = torch.argmax(output).item()
        score = output[0, top_idx]

        model.zero_grad()
        score.backward()

        hook_handle.remove()

        if not activations:
            return False

        feat = activations[0].detach()
        cam = torch.sum(feat, dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = F.interpolate(
            cam,
            size=(original_img.height, original_img.width),
            mode="bilinear",
            align_corners=False
        )
        cam = cam.squeeze().cpu().numpy()

        cam_min, cam_max = cam.min(), cam.max()
        cam_norm = (cam - cam_min) / (cam_max - cam_min + 1e-8)

        # Matplotlib JET colormap
        try:
            import matplotlib
            colormap = matplotlib.colormaps["jet"]
        except Exception:
            import matplotlib.cm as cm
            colormap = cm.get_cmap("jet")

        heatmap_rgba = colormap(cam_norm)
        heatmap_rgb = (heatmap_rgba[:, :, :3] * 255).astype(np.uint8)
        heatmap_img = Image.fromarray(heatmap_rgb)

        orig_rgb = original_img.convert("RGB")
        blended = Image.blend(orig_rgb, heatmap_img, alpha=0.45)
        blended.save(output_path, quality=92)
        return True
    except Exception as e:
        logger.warning(f"Grad-CAM generation skipped: {e}")
        return False


def predict_image(image_path: str, top_k: int = 3) -> dict:
    """
    Run prediction on skin image.
    Returns:
        dict: status, predicted_class, confidence, risk_level, heatmap_path, top_predictions
    """
    path = Path(image_path)
    if not path.is_absolute():
        from app.config import BASE_DIR
        path = BASE_DIR / path

    if not path.exists():
        raise FileNotFoundError(f"Image not found at {path}")

    model, class_names, transform, device = load_model()

    with Image.open(path) as img:
        img_rgb = img.convert("RGB")
        tensor = transform(img_rgb).unsqueeze(0).to(device)

        with torch.inference_mode():
            probs = torch.softmax(model(tensor), dim=1)[0]

    k = min(max(1, top_k), len(class_names))
    values, indices = torch.topk(probs, k)

    top_predictions = [
        {
            "class_name": class_names[i],
            "confidence": round(float(v), 4)
        }
        for v, i in zip(values.cpu().tolist(), indices.cpu().tolist())
    ]

    top_class = top_predictions[0]["class_name"]
    top_conf = top_predictions[0]["confidence"]
    risk_level = get_risk_level(top_class, top_conf)

    # Generate explainability heatmap
    heatmap_filename = f"heatmap_{path.stem}.jpg"
    heatmap_save_path = UPLOADS_DIR / heatmap_filename
    heatmap_rel_url = f"/uploads/{heatmap_filename}"

    with Image.open(path) as img:
        success = generate_heatmap(model, tensor, device, img, heatmap_save_path)
        if not success:
            heatmap_rel_url = None

    return {
        "status": "completed",
        "predicted_class": top_class,
        "confidence": top_conf,
        "risk_level": risk_level,
        "heatmap_path": heatmap_rel_url,
        "top_predictions": top_predictions
    }
