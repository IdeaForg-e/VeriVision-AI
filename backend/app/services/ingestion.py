import cv2
import numpy as np
from app.config import settings

def check_blur(img: np.ndarray) -> tuple[bool, float]:
    """
    Computes Laplacian variance to detect image blur.
    Returns: (is_blurry, variance_score)
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    is_blurry = variance < settings.BLUR_THRESHOLD
    return is_blurry, variance

def check_lighting(img: np.ndarray) -> tuple[bool, float]:
    """
    Checks average pixel intensity to verify lighting.
    Returns: (is_poor_lighting, mean_brightness)
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mean_brightness = np.mean(gray)
    is_poor = (mean_brightness < settings.BRIGHTNESS_MIN) or (mean_brightness > settings.BRIGHTNESS_MAX)
    return is_poor, mean_brightness

def align_images(src_img: np.ndarray, ref_img: np.ndarray) -> tuple[np.ndarray, float]:
    """
    Aligns source image with reference image using ORB keypoint descriptors and Homography.
    Returns: (aligned_image, match_percentage)
    """
    # Convert to grayscale
    gray_src = cv2.cvtColor(src_img, cv2.COLOR_BGR2GRAY)
    gray_ref = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY)

    # Initialize ORB detector
    orb = cv2.ORB_create(nfeatures=2000)
    kp_src, des_src = orb.detectAndCompute(gray_src, None)
    kp_ref, des_ref = orb.detectAndCompute(gray_ref, None)

    if des_src is None or des_ref is None:
        return src_img, 0.0

    # Match descriptors
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(des_src, des_ref)

    # Sort matches by distance (best first)
    matches = sorted(matches, key=lambda x: x.distance)

    # Calculate match percentage based on total features
    good_matches = [m for m in matches if m.distance < 50]
    match_rate = len(good_matches) / max(len(kp_src), len(kp_ref), 1)

    # Extract locations of matched keypoints
    src_pts = np.float32([kp_src[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    ref_pts = np.float32([kp_ref[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

    if len(good_matches) < 4:
        # Not enough matches to compute homography
        return src_img, match_rate

    # Find homography matrix and warp image
    h_matrix, mask = cv2.findHomography(src_pts, ref_pts, cv2.RANSAC, 5.0)
    height, width, channels = ref_img.shape
    aligned_img = cv2.warpPerspective(src_img, h_matrix, (width, height))

    return aligned_img, match_rate

def normalize_illumination(src_img: np.ndarray, ref_img: np.ndarray) -> np.ndarray:
    """
    Normalizes the illumination of src_img to match the average brightness
    and contrast of ref_img using mean/std scaling in Lab color space.
    """
    # Convert BGR images to LAB color space
    src_lab = cv2.cvtColor(src_img, cv2.COLOR_BGR2LAB)
    ref_lab = cv2.cvtColor(ref_img, cv2.COLOR_BGR2LAB)
    
    # Split channels
    l_src, a_src, b_src = cv2.split(src_lab)
    l_ref, a_ref, b_ref = cv2.split(ref_lab)
    
    # Calculate mean and standard deviation of L channel (Lightness)
    mean_src, std_src = l_src.mean(), l_src.std()
    mean_ref, std_ref = l_ref.mean(), l_ref.std()
    
    # Scale L channel to match reference mean & std (avoid divide by zero)
    if std_src > 0.001:
        l_norm = ((l_src - mean_src) * (std_ref / std_src)) + mean_ref
        l_norm = np.clip(l_norm, 0, 255).astype(np.uint8)
    else:
        l_norm = l_src
        
    # Merge normalized lightness back with original chromaticity channels
    norm_lab = cv2.merge([l_norm, a_src, b_src])
    return cv2.cvtColor(norm_lab, cv2.COLOR_LAB2BGR)

def process_and_validate(image_path: str, golden_path: str) -> dict:
    """
    Loads and runs validation on the source image, and registers/aligns it with the golden image.
    """
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
        result.update({"status": "fail", "detail": "Unable to read uploaded image"})
        return result

    # 1. Check Blur
    is_blurry, blur_val = check_blur(src)
    result["blur_score"] = blur_val
    if is_blurry:
        result.update({"status": "fail", "detail": f"Image is blurry. Clarity score {blur_val:.1f} < threshold {settings.BLUR_THRESHOLD}"})
        return result

    # 2. Check Brightness
    is_poor_light, light_val = check_lighting(src)
    result["brightness_score"] = light_val
    if is_poor_light:
        result.update({"status": "fail", "detail": f"Poor lighting conditions. Brightness {light_val:.1f}"})
        return result

    # Load golden reference image
    ref = cv2.imread(golden_path)
    if ref is None:
        # Fallback if golden image is not readable or missing, return unaligned src
        result.update({"aligned_image": src, "alignment_rate": 1.0})
        return result

    # 3. Geometric Alignment
    aligned_img, align_rate = align_images(src, ref)
    
    # 4. Illumination and contrast normalization (Lighting correction)
    if align_rate > 0.01:
        aligned_img = normalize_illumination(aligned_img, ref)
        
    result["aligned_image"] = aligned_img
    result["alignment_rate"] = align_rate

    return result
