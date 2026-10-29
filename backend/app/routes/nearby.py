from urllib.parse import quote_plus
from fastapi import APIRouter

router = APIRouter(prefix="/api/nearby", tags=["Nearby Care"])


@router.get("/dermatologists")
def nearby_dermatologists(location: str = ""):
    query = location.strip() if location.strip() else "dermatologist"
    url = f"https://www.google.com/maps/search/{quote_plus('dermatologist ' + query)}"
    return {
        "location": query,
        "maps_url": url,
        "message": "Open the Maps URL to view nearby dermatologists and medical centers."
    }
