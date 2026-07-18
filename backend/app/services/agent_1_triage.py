import cv2
import numpy as np
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def check_blur(img: np.ndarray) -> tuple[bool, float]:
    """
    Computes Laplacian variance to detect image blur.
    Returns: (is_blurry, variance_score)
    """
    logger.info("Running image blur/clarity validation...")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    is_blurry = variance < settings.BLUR_THRESHOLD
    logger.info(f"Clarity score (variance): {variance:.2f} (Threshold: {settings.BLUR_THRESHOLD}). Status: {'Blurry' if is_blurry else 'Clear'}")
    return is_blurry, variance

def check_lighting(img: np.ndarray) -> tuple[bool, float]:
    """
    Checks average pixel intensity to verify lighting.
    Returns: (is_poor_lighting, mean_brightness)
    """
    logger.info("Running image lighting intensity validation...")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    is_poor = (mean_brightness < settings.BRIGHTNESS_MIN) or (mean_brightness > settings.BRIGHTNESS_MAX)
    logger.info(f"Mean brightness value: {mean_brightness:.1f} (Limits: {settings.BRIGHTNESS_MIN} to {settings.BRIGHTNESS_MAX}). Status: {'Poor' if is_poor else 'Optimal'}")
    return is_poor, mean_brightness

def align_images(src_img: np.ndarray, ref_img: np.ndarray) -> tuple[np.ndarray, float]:
    """
    Aligns source image with reference image using ORB keypoint descriptors and Homography.
    Returns: (aligned_image, match_percentage)
    """
    logger.info("Performing geometric alignment (homography registration) between source and reference templates...")
    # Convert to grayscale
    gray_src = cv2.cvtColor(src_img, cv2.COLOR_BGR2GRAY)
    gray_ref = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY)

    # Initialize ORB detector
    orb = cv2.ORB_create(nfeatures=2000)
    kp_src, des_src = orb.detectAndCompute(gray_src, None)
    kp_ref, des_ref = orb.detectAndCompute(gray_ref, None)

    if des_src is None or des_ref is None:
        logger.warning("Failed to extract ORB features from either source or reference. Homography skipped.")
        return src_img, 0.0

    # Match descriptors
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(des_src, des_ref)

    # Sort matches by distance (best first)
    matches = sorted(matches, key=lambda x: x.distance)

    # Calculate match percentage based on total features
    good_matches = [m for m in matches if m.distance < 50]
    match_rate = len(good_matches) / max(len(kp_src), len(kp_ref), 1)

    logger.info(f"Geometric matching: Extracted {len(kp_src)} src keypoints, {len(kp_ref)} ref keypoints. Found {len(good_matches)} good matches (rate: {match_rate:.3f})")

    # Extract locations of matched keypoints
    src_pts = np.float32([kp_src[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    ref_pts = np.float32([kp_ref[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

    if len(good_matches) < 4:
        logger.warning(f"Not enough good keypoint matches ({len(good_matches)} < 4) to estimate homography transformation matrix.")
        return src_img, match_rate

    # Find homography matrix and warp image
    h_matrix, mask = cv2.findHomography(src_pts, ref_pts, cv2.RANSAC, 5.0)
    height, width, channels = ref_img.shape
    aligned_img = cv2.warpPerspective(src_img, h_matrix, (width, height))
    logger.info(f"Image aligned to frame resolution: {width}x{height}")

    return aligned_img, match_rate

def normalize_illumination(src_img: np.ndarray, ref_img: np.ndarray) -> np.ndarray:
    """
    Normalizes the illumination of src_img to match the average brightness
    and contrast of ref_img using mean/std scaling in Lab color space.
    """
    logger.info("Applying contrast/brightness normalization to match golden template illumination...")
    # Convert BGR images to LAB color space
    src_lab = cv2.cvtColor(src_img, cv2.COLOR_BGR2LAB)
    ref_lab = cv2.cvtColor(ref_img, cv2.COLOR_BGR2LAB)
    
    # Split channels
    l_src, a_src, b_src = cv2.split(src_lab)
    l_ref, a_ref, b_ref = cv2.split(ref_lab)
    
    # Calculate mean and standard deviation of L channel (Lightness)
    mean_src, std_src = l_src.mean(), l_src.std()
    mean_ref, std_ref = l_ref.mean(), l_ref.std()
    
    logger.info(f"Pre-normalization Lightness stats: Source Mean={mean_src:.1f} Std={std_src:.1f} | Reference Mean={mean_ref:.1f} Std={std_ref:.1f}")

    # Scale L channel to match reference mean & std (avoid divide by zero)
    if std_src > 0.001:
        l_norm = ((l_src - mean_src) * (std_ref / std_src)) + mean_ref
        l_norm = np.clip(l_norm, 0, 255).astype(np.uint8)
    else:
        l_norm = l_src
        
    # Merge normalized lightness back with original chromaticity channels
    norm_lab = cv2.merge([l_norm, a_src, b_src])
    normalized_bgr = cv2.cvtColor(norm_lab, cv2.COLOR_LAB2BGR)
    
    logger.info("Contrast and brightness matching completed.")
    return normalized_bgr

def process_and_validate(image_path: str, golden_path: str) -> dict:
    """
    Loads and runs validation on the source image, and registers/aligns it with the golden image.
    """
    logger.info(f"Processing image validation request for source: {image_path}")
    result = {
        "status": "pass",
        "detail": "",
        "blur_score": 0.0,
        "brightness_score": 0.0,
        "alignment_rate": 0.0,
        "aligned_image": None
    }

    # Load source image
    src = cv2.imread(image_path)
    if src is None:
        logger.error(f"Image read failure: file does not exist or is corrupted at {image_path}")
        result.update({"status": "fail", "detail": "Unable to read uploaded image"})
        return result

    # 1. Check Blur
    is_blurry, blur_val = check_blur(src)
    result["blur_score"] = blur_val
    if is_blurry:
        detail_msg = f"Image is blurry. Clarity score {blur_val:.1f} < threshold {settings.BLUR_THRESHOLD}"
        logger.warning(f"Validation failure details: {detail_msg}")
        result.update({"status": "fail", "detail": detail_msg})
        return result

    # 2. Check Brightness
    is_poor_light, light_val = check_lighting(src)
    result["brightness_score"] = light_val
    if is_poor_light:
        detail_msg = f"Poor lighting conditions. Brightness {light_val:.1f}"
        logger.warning(f"Validation failure details: {detail_msg}")
        result.update({"status": "fail", "detail": detail_msg})
        return result

    # Load golden reference image
    logger.info(f"Loading golden reference template from {golden_path}")
    ref = cv2.imread(golden_path)
    if ref is None:
        logger.warning("Golden reference file not found or unreadable. Bypassing image registration.")
        # Fallback if golden image is not readable or missing, return unaligned src
        result.update({"aligned_image": src, "alignment_rate": 1.0})
        return result

    # 3. Geometric Alignment
    aligned_img, align_rate = align_images(src, ref)
    
    # 4. Illumination and contrast normalization (Lighting correction)
    if align_rate > 0.01:
        aligned_img = normalize_illumination(aligned_img, ref)
    else:
        logger.warning("Skipping lighting correction since alignment rate is too low.")
        
    result["aligned_image"] = aligned_img
    result["alignment_rate"] = align_rate

    logger.info("Image intake preprocessing tasks finished successfully.")
    return result
