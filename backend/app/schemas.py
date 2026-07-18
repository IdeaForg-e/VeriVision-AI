from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


# --- Product Schemas ---
class ProductBase(BaseModel):
    part_number: str
    name: str
    commodity: str

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Golden Reference Schemas ---
class GoldenReferenceBase(BaseModel):
    product_id: int
    image_path: str
    expected_serial: Optional[str] = None
    roi_config: Optional[Dict[str, Any]] = None
    angle: str = "top"

class GoldenReferenceCreate(BaseModel):
    product_id: int
    expected_serial: Optional[str] = None
    roi_config: Optional[str] = None  # JSON string from form data
    angle: str = "top"

class GoldenReferenceResponse(GoldenReferenceBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Inspection & Result Schemas ---
class InspectionResultResponse(BaseModel):
    id: int
    ssim_score: Optional[float] = None
    keypoint_match_rate: Optional[float] = None
    ocr_detected_text: Optional[str] = None
    ocr_expected_text: Optional[str] = None
    fraud_score: int
    verdict: str
    confidence: float
    recommended_action: str
    explanation: Optional[str] = None
    heatmap_path: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InspectionResponse(BaseModel):
    id: int
    case_id: str
    product_id: int
    user_id: int
    captured_image_path: str
    capture_site: str
    capture_angle: str
    status: str
    created_at: datetime
    result: Optional[InspectionResultResponse] = None
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)


# --- Human Review Schemas ---
class ReviewAction(BaseModel):
    action: str  # approve, reject, override
    override_verdict: Optional[str] = None  # tampered, missing, mismatched, reused, clean
    comments: Optional[str] = None


# --- Audit & Reports Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    inspection_id: int
    actor: str
    action: str
    comments: Optional[str] = None
    previous_verdict: Optional[str] = None
    new_verdict: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class ReportResponse(BaseModel):
    id: int
    inspection_id: int
    pdf_path: Optional[str] = None
    html_path: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
