from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import requests
import uuid
from app.config import settings

from app.database import get_db
from app import models, schemas, utils

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email is already taken
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Hash password and create user
    hashed_password = utils.get_password_hash(user_in.password)
    db_user = models.User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Verify user existence and password
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create JWT access token
    access_token = utils.create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(utils.get_current_user)):
    return current_user

@router.post("/google", response_model=schemas.Token)
def google_login(payload: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Verify Google id_token, auto-register user if not exists,
    and return customized JWT access token.
    """
    token = payload.id_token
    
    try:
        # Validate Google token using official Google API
        google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        response = requests.get(google_url, timeout=5)
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Google OAuth token."
            )
        user_info = response.json()
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google OAuth verification failed: {str(e)}"
        )

    # Aud/Client verification if configured
    if settings.GOOGLE_CLIENT_ID:
        aud = user_info.get("aud")
        if aud != settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google OAuth audience mismatch (client ID does not match settings)."
            )

    email = user_info.get("email")
    name = user_info.get("name", email.split("@")[0] if email else "Google User")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token payload does not contain a verified email address."
        )

    # Check if user exists, if not, register them automatically
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        random_pass = str(uuid.uuid4())
        hashed_password = utils.get_password_hash(random_pass)
        user = models.User(
            name=name,
            email=email,
            hashed_password=hashed_password,
            role="user"  # default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create local JWT access token
    access_token = utils.create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name
    }
