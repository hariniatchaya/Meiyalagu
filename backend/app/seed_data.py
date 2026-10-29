from app.database import SessionLocal
from app.models import Disease, User
from app.auth import hash_password

INITIAL_DISEASES = [
    {
        "slug": "melanoma",
        "name": "Melanoma",
        "description": "A serious form of skin cancer that develops in melanocytes (pigment-producing cells).",
        "symptoms": "A changing, asymmetric, or irregularly colored mole or spot.",
        "causes": "Associated with cumulative ultraviolet (UV) radiation exposure, tanning beds, and genetics.",
        "prevention": "Broad-spectrum SPF 30+ sunscreen, protective clothing, and routine skin self-checks.",
        "treatment": "Surgical excision, immunotherapy, targeted therapy, or radiation depending on stage.",
        "warning": "Any new, rapidly changing, bleeding, or painful mole requires immediate clinical evaluation."
    },
    {
        "slug": "melanocytic-nevus",
        "name": "Melanocytic Nevus",
        "description": "A common benign mole or cutaneous lesion formed by melanocyte clusters.",
        "symptoms": "Evenly colored tan, brown, or pink spot with well-defined borders.",
        "causes": "Genetics and sun exposure during childhood and adolescence.",
        "prevention": "UV protection and periodic self-observation for ABCDE change patterns.",
        "treatment": "Routine monitoring; surgical removal is only indicated if atypical or medically recommended.",
        "warning": "Sudden alterations in size, shape, or color should be reviewed by a dermatologist."
    },
    {
        "slug": "basal-cell-carcinoma",
        "name": "Basal Cell Carcinoma",
        "description": "The most common skin malignancy, arising from the basal cell layer of the epidermis.",
        "symptoms": "Pearly or translucent bump, pink patch, or a chronic sore that repeatedly bleeds and crusts.",
        "causes": "Chronic and intense UV light exposure over many years.",
        "prevention": "Sun avoidance during peak hours, daily sunscreen, and wide-brimmed hats.",
        "treatment": "Mohs micrographic surgery, standard surgical excision, curettage, or topical therapies.",
        "warning": "Lesions that fail to heal or persistently recur require medical attention."
    },
    {
        "slug": "actinic-keratosis",
        "name": "Actinic Keratosis",
        "description": "A precancerous scaly or crusty patch on chronic sun-damaged skin.",
        "symptoms": "Rough, sandpapery pink, red, or tan lesion that is often felt before seen.",
        "causes": "Cumulative ultraviolet radiation damage over decades.",
        "prevention": "Strict sun protection to prevent further actinic damage.",
        "treatment": "Cryotherapy (liquid nitrogen), topical 5-FU, imiquimod, or photodynamic therapy.",
        "warning": "A subset of actinic keratoses can advance to invasive squamous cell carcinoma if untreated."
    },
    {
        "slug": "benign-keratosis",
        "name": "Benign Keratosis (Seborrheic Keratosis)",
        "description": "A non-cancerous epidermal growth that appears as a waxy, 'stuck-on' plaque.",
        "symptoms": "Waxy, elevated, brown or black lesion that looks pasted onto the skin.",
        "causes": "Age-related skin maturation and genetic predisposition.",
        "prevention": "No known preventive measure; not caused by sun exposure.",
        "treatment": "Usually requires no treatment; cryosurgery or electrodessication if irritated.",
        "warning": "Can mimic melanoma in appearance; clinical verification is recommended if newly noticed."
    },
    {
        "slug": "dermatofibroma",
        "name": "Dermatofibroma",
        "description": "A harmless, firm fibrous nodule commonly located on the extremities.",
        "symptoms": "Firm pink, brown, or red nodule that typically dimples inward when pinched.",
        "causes": "Often triggered by minor trauma such as an insect bite or puncture.",
        "prevention": "No specific preventive measures.",
        "treatment": "No therapy necessary unless symptomatic; surgical removal if uncomfortable.",
        "warning": "Any firm lesion showing rapid growth or bleeding should be assessed."
    },
    {
        "slug": "vascular-lesion",
        "name": "Vascular Lesion (Hemangioma / Angioma)",
        "description": "A benign proliferation of blood vessels in the dermis or subcutaneous layer.",
        "symptoms": "Bright red or purple macule or papule (e.g., cherry angioma).",
        "causes": "Aging, genetics, hormonal influences, or congenital vascular development.",
        "prevention": "Generally genetic or age-related; no direct prevention.",
        "treatment": "Laser therapy, electrodessication, or cryotherapy if cosmetically desired.",
        "warning": "Sudden onset of multiple spreading vascular spots or spontaneous bleeding should be assessed."
    }
]


def seed_initial_data():
    """Seed disease library and default demo account into the active database."""
    db = SessionLocal()
    try:
        # Seed Diseases
        for item in INITIAL_DISEASES:
            existing = db.query(Disease).filter(Disease.slug == item["slug"]).first()
            if not existing:
                db.add(Disease(**item))

        # Seed Demo User
        demo_user = db.query(User).filter(User.email == "demo@meiyalagu.ai").first()
        if not demo_user:
            demo_user = User(
                name="Harini",
                email="demo@meiyalagu.ai",
                password_hash=hash_password("password123")
            )
            db.add(demo_user)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Notice: Initial data seeding skipped: {e}")
    finally:
        db.close()
