import os
import cv2
import numpy as np
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app import models

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 512

def extract_image_embedding(image_path: str) -> List[float]:
    """
    Extracts a normalized 512-dimensional visual vector embedding from an image file.
    Combines:
    1. 256-dim multi-channel HSV & LAB spatial color distribution features.
    2. 128-dim gradient magnitude & orientation texture features (HOG-like).
    3. 128-dim ORB spatial keypoint descriptor summary statistics.
    """
    if not os.path.exists(image_path):
        logger.error(f"[Embedding Service] File not found: {image_path}")
        return [0.0] * EMBEDDING_DIM

    img = cv2.imread(image_path)
    if img is None:
        logger.error(f"[Embedding Service] Unable to read image: {image_path}")
        return [0.0] * EMBEDDING_DIM

    # Standardize image size for invariant feature extraction
    img_resized = cv2.resize(img, (256, 256))

    # Feature 1: HSV Color Histogram (256 dimensions)
    hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
    hist_h = cv2.calcHist([hsv], [0], None, [96], [0, 180])
    hist_s = cv2.calcHist([hsv], [1], None, [80], [0, 256])
    hist_v = cv2.calcHist([hsv], [2], None, [80], [0, 256])
    color_vec = np.concatenate([hist_h, hist_s, hist_v]).flatten()
    color_vec = color_vec / (np.linalg.norm(color_vec) + 1e-7)

    # Feature 2: Spatial Gradient & Texture Features (128 dimensions)
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    mag, ang = cv2.cartToPolar(sobelx, sobely, angleInDegrees=True)
    grad_hist, _ = np.histogram(ang, bins=128, weights=mag, range=(0, 360))
    texture_vec = grad_hist / (np.linalg.norm(grad_hist) + 1e-7)

    # Feature 3: Keypoint & Descriptor Stats (128 dimensions)
    orb = cv2.ORB_create(nfeatures=256)
    _, des = orb.detectAndCompute(gray, None)
    if des is not None and len(des) > 0:
        kp_mean = np.mean(des, axis=0).astype(np.float32)  # 32 values
        kp_std = np.std(des, axis=0).astype(np.float32)   # 32 values
        kp_max = np.max(des, axis=0).astype(np.float32)   # 32 values
        kp_min = np.min(des, axis=0).astype(np.float32)   # 32 values
        kp_vec = np.concatenate([kp_mean, kp_std, kp_max, kp_min])
    else:
        kp_vec = np.zeros(128, dtype=np.float32)
    kp_vec = kp_vec / (np.linalg.norm(kp_vec) + 1e-7)

    # Concatenate all 3 feature representations into 512-dim vector
    raw_vector = np.concatenate([color_vec, texture_vec, kp_vec])
    if len(raw_vector) < EMBEDDING_DIM:
        raw_vector = np.pad(raw_vector, (0, EMBEDDING_DIM - len(raw_vector)))
    elif len(raw_vector) > EMBEDDING_DIM:
        raw_vector = raw_vector[:EMBEDDING_DIM]

    # L2 Normalization for Cosine Similarity
    norm = np.linalg.norm(raw_vector)
    if norm > 0:
        normalized_vector = raw_vector / norm
    else:
        normalized_vector = raw_vector

    return normalized_vector.tolist()


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Computes Cosine Similarity between two N-dimensional vector embeddings.
    Range: [0.0, 1.0]
    """
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0

    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)

    dot = float(np.dot(a, b))
    norm_a = float(np.linalg.norm(a))
    norm_b = float(np.linalg.norm(b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    similarity = dot / (norm_a * norm_b)
    return float(np.clip(similarity, 0.0, 1.0))


def search_reference_library(uploaded_image_path: str, db: Session) -> Dict[str, Any]:
    """
    Performs fast vector Cosine Similarity retrieval across all indexed Golden References.
    Returns the top-1 matching product, part number, golden image URL, and similarity score.
    """
    logger.info(f"[Embedding Service] Searching Reference Library for uploaded image: {uploaded_image_path}")

    target_embedding = extract_image_embedding(uploaded_image_path)
    if not target_embedding or all(v == 0.0 for v in target_embedding):
        return {
            "matched": False,
            "detail": "Failed to extract visual embedding from target image.",
            "top_match": None,
        }

    golden_refs = db.query(models.GoldenReference).all()
    if not golden_refs:
        return {
            "matched": False,
            "detail": "No Golden References indexed in the Reference Library.",
            "top_match": None,
        }

    ranked_matches = []
    for ref in golden_refs:
        # Load pre-computed embedding from database or compute on-the-fly
        ref_vec = ref.embedding_vector
        if not ref_vec or len(ref_vec) != EMBEDDING_DIM:
            if ref.image_path and os.path.exists(ref.image_path):
                ref_vec = extract_image_embedding(ref.image_path)
                ref.embedding_vector = ref_vec
                db.commit()
            else:
                continue

        sim_score = cosine_similarity(target_embedding, ref_vec)
        product = ref.product

        ranked_matches.append({
            "golden_id": ref.id,
            "product_id": product.id if product else None,
            "part_number": product.part_number if product else "N/A",
            "name": product.name if product else "Unknown Part",
            "commodity": product.commodity if product else "Unknown",
            "golden_image_path": ref.image_path,
            "golden_image_url": f"/data/golden/{os.path.basename(ref.image_path)}" if ref.image_path else None,
            "similarity_score": round(sim_score * 100, 2),
            "confidence": "HIGH" if sim_score >= 0.80 else "MEDIUM" if sim_score >= 0.60 else "LOW",
        })

    if not ranked_matches:
        return {
            "matched": False,
            "detail": "Could not compute similarity for any indexed Golden Reference.",
            "top_match": None,
        }

    # Sort descending by similarity score
    ranked_matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    top = ranked_matches[0]

    logger.info(
        f"[Embedding Service] Top Match Found: '{top['part_number']}' "
        f"({top['name']}) with {top['similarity_score']}% Vector Cosine Similarity"
    )

    return {
        "matched": True,
        "detail": f"Matched catalog item '{top['part_number']}' with {top['similarity_score']}% similarity.",
        "top_match": top,
        "candidates": ranked_matches[:3],  # Top 3 candidates
    }
