import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.models import mobilenet_v2

class DynamicMorphologyAwareCBAM(nn.Module):
    def __init__(self, channels=1280, reduction=16):
        super().__init__()
        hidden = max(channels // reduction, 8)
        self.channel_mlp = nn.Sequential(
            nn.Conv2d(channels, hidden, 1, bias=False),
            nn.ReLU(inplace=True),
            nn.Conv2d(hidden, channels, 1, bias=False)
        )
        self.spatial_conv = nn.Conv2d(2, 1, 7, padding=3, bias=False)
        self.morphology_gate = nn.Sequential(
            nn.Linear(4, 16),
            nn.ReLU(inplace=True),
            nn.Linear(16, 4),
            nn.Sigmoid()
        )
        sx = torch.tensor(
            [[-1., 0., 1.], [-2., 0., 2.], [-1., 0., 1.]]
        ).view(1, 1, 3, 3)
        sy = torch.tensor(
            [[-1., -2., -1.], [0., 0., 0.], [1., 2., 1.]]
        ).view(1, 1, 3, 3)
        self.register_buffer("sobel_x", sx)
        self.register_buffer("sobel_y", sy)

    def forward(self, x):
        sm = x.mean(dim=1, keepdim=True)
        mean = sm.mean(dim=(2, 3))
        spread = sm.std(dim=(2, 3), unbiased=False)
        local_mean = F.avg_pool2d(sm, 3, 1, 1)
        variance = F.avg_pool2d((sm - local_mean).pow(2), 3, 1, 1)
        variance = variance.mean(dim=(2, 3))
        ex = F.conv2d(sm, self.sobel_x, padding=1)
        ey = F.conv2d(sm, self.sobel_y, padding=1)
        edge = torch.sqrt(ex.pow(2) + ey.pow(2) + 1e-8).mean(dim=(2, 3))
        descriptors = torch.cat([mean, spread, variance, edge], dim=1)
        gates = self.morphology_gate(descriptors)
        factor = (1.0 + 0.25 * gates.sum(dim=1, keepdim=True))
        factor = factor.view(-1, 1, 1, 1)
        avg = F.adaptive_avg_pool2d(x, 1)
        mx = F.adaptive_max_pool2d(x, 1)
        ca = torch.sigmoid(self.channel_mlp(avg) + self.channel_mlp(mx))
        x = x * ca * factor
        avg_map = x.mean(dim=1, keepdim=True)
        max_map = x.max(dim=1, keepdim=True).values
        sa = torch.sigmoid(self.spatial_conv(torch.cat([avg_map, max_map], dim=1)))
        return x * sa * factor

class MobileNetV2_DynamicMorphology(nn.Module):
    def __init__(self, num_classes=23):
        super().__init__()
        self.features = mobilenet_v2(weights=None).features
        self.dynamic_cbam = DynamicMorphologyAwareCBAM(1280, 16)
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.dropout = nn.Dropout(p=0.2)
        self.classifier = nn.Linear(1280, num_classes)

    def forward(self, x):
        x = self.features(x)
        x = self.dynamic_cbam(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        x = self.dropout(x)
        return self.classifier(x)
