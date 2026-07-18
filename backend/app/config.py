import os

class Settings:
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "verivision_super_secret_key_change_me_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 Hours

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./verivision.db")

    # Directory Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "data", "cases")
    GOLDEN_DIR: str = os.path.join(BASE_DIR, "data", "golden")
    REPORTS_DIR: str = os.path.join(BASE_DIR, "data", "reports")

    # Vision Thresholds
    SSIM_THRESHOLD: float = 0.80
    BLUR_THRESHOLD: float = 100.0  # Laplacian variance threshold
    BRIGHTNESS_MIN: int = 40
    BRIGHTNESS_MAX: int = 220
    KEYPOINT_MATCH_MIN: float = 0.60  # Percentage of matched features

settings = Settings()

# Ensure required directories exist
for path in [settings.UPLOAD_DIR, settings.GOLDEN_DIR, settings.REPORTS_DIR]:
    os.makedirs(path, exist_ok=True)
