"""
Touchscreen Prototype — Turn your laptop into a touchscreen
Uses webcam to track finger position + eye gaze to determine where you're "touching"

How it works:
1. Webcam tracks your hand/finger using MediaPipe
2. When your index finger tip enters the "touch zone" (close to camera = close to screen),
   it maps the finger's X/Y position to screen coordinates
3. Eye gaze provides a secondary signal for accuracy
4. When finger is in the touch zone, it moves the cursor
5. When finger "taps" (quick forward motion), it clicks

Run: python3 touchscreen.py
Press 'q' to quit, 'c' to calibrate
"""

import cv2
import mediapipe as mp
import numpy as np
import time
import subprocess
from pynput.mouse import Button, Controller as MouseController

mouse = MouseController()

# Screen dimensions — primary monitor
# Parse from xrandr to get the primary display size
try:
    output = subprocess.check_output("xrandr", shell=True).decode()
    for line in output.split("\n"):
        if " connected primary" in line:
            # e.g. "eDP-1 connected primary 1920x1080+0+1080"
            parts = line.split()
            for p in parts:
                if "x" in p and "+" in p:
                    res = p.split("+")[0]
                    SCREEN_W, SCREEN_H = int(res.split("x")[0]), int(res.split("x")[1])
                    break
            break
    else:
        SCREEN_W, SCREEN_H = 1920, 1080
except Exception:
    SCREEN_W, SCREEN_H = 1920, 1080
print(f"Screen: {SCREEN_W}x{SCREEN_H}")

# MediaPipe setup
mp_hands = mp.solutions.hands
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils

# Tracking state
class TouchState:
    def __init__(self):
        self.cursor_x = SCREEN_W // 2
        self.cursor_y = SCREEN_H // 2
        self.is_touching = False
        self.last_click_time = 0
        self.click_cooldown = 0.4  # seconds between clicks
        self.smoothing = 0.3  # lower = smoother, higher = more responsive

        # Calibration: maps webcam coordinates to screen coordinates
        # These are the webcam coordinate ranges that map to the screen
        # x: 0.2 (left of screen) to 0.8 (right of screen) — mirrored
        # y: 0.15 (top of screen) to 0.85 (bottom of screen)
        self.cam_x_min = 0.2
        self.cam_x_max = 0.8
        self.cam_y_min = 0.15
        self.cam_y_max = 0.85

        # Touch zone: z-depth threshold for "touching"
        # When finger tip's z gets small enough, we consider it a touch
        self.touch_z_threshold = -0.05  # MediaPipe z is negative when closer to camera

        # Tap detection
        self.prev_z = 0
        self.z_velocity = 0
        self.tap_velocity_threshold = 0.015

        # Eye gaze
        self.eye_x = 0.5
        self.eye_y = 0.5
        self.use_eye_gaze = True
        self.eye_weight = 0.3  # how much eye gaze influences position (0-1)

        # Mode
        self.active = True
        self.show_debug = True

state = TouchState()


def map_to_screen(hand_x, hand_y, eye_x=None, eye_y=None):
    """Map webcam hand coordinates to screen coordinates, optionally blending with eye gaze"""

    # Map hand position (webcam is mirrored, so invert x)
    norm_x = 1.0 - (hand_x - state.cam_x_min) / (state.cam_x_max - state.cam_x_min)
    norm_y = (hand_y - state.cam_y_min) / (state.cam_y_max - state.cam_y_min)

    # Clamp to 0-1
    norm_x = max(0, min(1, norm_x))
    norm_y = max(0, min(1, norm_y))

    # Blend with eye gaze if available
    if eye_x is not None and eye_y is not None and state.use_eye_gaze:
        norm_x = norm_x * (1 - state.eye_weight) + eye_x * state.eye_weight
        norm_y = norm_y * (1 - state.eye_weight) + eye_y * state.eye_weight

    # Map to screen pixels
    screen_x = int(norm_x * SCREEN_W)
    screen_y = int(norm_y * SCREEN_H)

    return screen_x, screen_y


def get_eye_gaze(face_landmarks):
    """Estimate where the user is looking based on iris position relative to eye bounds"""

    # Left eye landmarks (MediaPipe face mesh)
    # Left iris center: 468
    # Left eye inner corner: 133, outer corner: 33
    # Left eye top: 159, bottom: 145

    try:
        iris = face_landmarks.landmark[468]
        inner = face_landmarks.landmark[133]
        outer = face_landmarks.landmark[33]
        top = face_landmarks.landmark[159]
        bottom = face_landmarks.landmark[145]

        # Horizontal gaze: where is iris between inner and outer corner
        eye_width = abs(outer.x - inner.x)
        if eye_width > 0.001:
            gaze_x = (iris.x - min(inner.x, outer.x)) / eye_width
        else:
            gaze_x = 0.5

        # Vertical gaze: where is iris between top and bottom
        eye_height = abs(bottom.y - top.y)
        if eye_height > 0.001:
            gaze_y = (iris.y - top.y) / eye_height
        else:
            gaze_y = 0.5

        # Map gaze to screen-ish coordinates (invert x because webcam is mirrored)
        screen_gaze_x = 1.0 - max(0, min(1, gaze_x))
        screen_gaze_y = max(0, min(1, gaze_y))

        return screen_gaze_x, screen_gaze_y
    except (IndexError, AttributeError):
        return None, None


def detect_pinch(hand_landmarks):
    """Detect a pinch gesture (thumb tip touching index finger tip) for clicking"""
    thumb_tip = hand_landmarks.landmark[4]
    index_tip = hand_landmarks.landmark[8]

    # Calculate distance between thumb and index finger tips
    dist = np.sqrt(
        (thumb_tip.x - index_tip.x) ** 2 +
        (thumb_tip.y - index_tip.y) ** 2
    )

    pinch_threshold = 0.04  # fingers are "touching" when this close

    now = time.time()

    if dist < pinch_threshold:
        if not state.is_touching and (now - state.last_click_time > state.click_cooldown):
            state.last_click_time = now
            state.is_touching = True
            return True  # pinch just started = click
    else:
        state.is_touching = False

    return False


def main():
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    if not cap.isOpened():
        print("Error: Could not open webcam")
        return

    print("\n=== TOUCHSCREEN PROTOTYPE ===")
    print("Point your index finger at the screen.")
    print("Move finger forward to 'tap' (click).")
    print("")
    print("Controls:")
    print("  q — Quit")
    print("  c — Recalibrate (touch 4 corners)")
    print("  e — Toggle eye gaze blending")
    print("  d — Toggle debug overlay")
    print("  +/- — Adjust sensitivity")
    print("==============================\n")

    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.6,
    )

    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,  # needed for iris tracking
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    fps_time = time.time()
    fps = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Flip for mirror effect
        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process hand
        hand_results = hands.process(rgb)

        # Process face/eyes
        eye_x, eye_y = None, None
        face_results = face_mesh.process(rgb)
        if face_results.multi_face_landmarks:
            face_lm = face_results.multi_face_landmarks[0]
            eye_x, eye_y = get_eye_gaze(face_lm)
            if eye_x is not None:
                state.eye_x = eye_x
                state.eye_y = eye_y

            # Draw eye gaze indicator on debug view
            if state.show_debug and eye_x is not None:
                gaze_px = int(eye_x * w)
                gaze_py = int(eye_y * h)
                cv2.circle(frame, (gaze_px, gaze_py), 15, (255, 255, 0), 2)
                cv2.putText(frame, "EYE", (gaze_px - 15, gaze_py - 20),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)

        if hand_results.multi_hand_landmarks:
            hand_lm = hand_results.multi_hand_landmarks[0]

            # Index finger tip: landmark 8
            index_tip = hand_lm.landmark[8]
            # Index finger DIP (one joint back): landmark 7
            index_dip = hand_lm.landmark[7]

            finger_x = index_tip.x
            finger_y = index_tip.y
            finger_z = index_tip.z

            # Check if index finger is extended (pointing)
            # Tip should be higher (lower y) than DIP joint
            finger_extended = index_tip.y < index_dip.y

            if finger_extended and state.active:
                # Map to screen coordinates
                target_x, target_y = map_to_screen(
                    finger_x, finger_y,
                    state.eye_x if state.use_eye_gaze else None,
                    state.eye_y if state.use_eye_gaze else None
                )

                # Smooth cursor movement
                state.cursor_x = int(state.cursor_x + (target_x - state.cursor_x) * state.smoothing)
                state.cursor_y = int(state.cursor_y + (target_y - state.cursor_y) * state.smoothing)

                # Move mouse cursor — clamp to screen bounds
                state.cursor_x = max(0, min(SCREEN_W - 1, state.cursor_x))
                state.cursor_y = max(0, min(SCREEN_H - 1, state.cursor_y))
                try:
                    mouse.position = (state.cursor_x, state.cursor_y)
                except Exception:
                    pass

                # Detect pinch (thumb + index touching) = click
                if detect_pinch(hand_lm):
                    mouse.position = (state.cursor_x, state.cursor_y)
                    mouse.click(Button.left)
                    if state.show_debug:
                        cv2.circle(frame, (int(finger_x * w), int(finger_y * h)), 30, (0, 0, 255), -1)
                        cv2.putText(frame, "CLICK!", (int(finger_x * w) - 30, int(finger_y * h) - 35),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

                # Draw finger position on debug view
                if state.show_debug:
                    fx, fy = int(finger_x * w), int(finger_y * h)
                    color = (0, 255, 0) if not state.is_touching else (0, 0, 255)
                    cv2.circle(frame, (fx, fy), 12, color, -1)

                    # Show thumb-index distance
                    thumb_tip = hand_lm.landmark[4]
                    pinch_dist = np.sqrt((thumb_tip.x - finger_x)**2 + (thumb_tip.y - finger_y)**2)
                    cv2.putText(frame, f"Pinch: {pinch_dist:.3f} {'TOUCH!' if state.is_touching else ''}",
                               (fx + 15, fy), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
                    cv2.putText(frame, f"Screen: ({state.cursor_x}, {state.cursor_y})",
                               (fx + 15, fy + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)

            # Draw hand skeleton
            if state.show_debug:
                mp_drawing.draw_landmarks(frame, hand_lm, mp_hands.HAND_CONNECTIONS)

        # Draw debug info
        if state.show_debug:
            # FPS
            now = time.time()
            fps = 0.9 * fps + 0.1 * (1.0 / max(0.001, now - fps_time))
            fps_time = now

            info = [
                f"FPS: {int(fps)}",
                f"Eye gaze: {'ON' if state.use_eye_gaze else 'OFF'}",
                f"Cursor: ({state.cursor_x}, {state.cursor_y})",
                f"Tap threshold: {state.tap_velocity_threshold:.3f}",
            ]
            for i, text in enumerate(info):
                cv2.putText(frame, text, (10, 25 + i * 22),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            # Touch zone guide
            x1 = int(state.cam_x_min * w)
            y1 = int(state.cam_y_min * h)
            x2 = int(state.cam_x_max * w)
            y2 = int(state.cam_y_max * h)
            cv2.rectangle(frame, (x1, y1), (x2, y2), (100, 100, 100), 1)
            cv2.putText(frame, "Touch Zone", (x1, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 100, 100), 1)

        cv2.imshow("Touchscreen Prototype", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('e'):
            state.use_eye_gaze = not state.use_eye_gaze
            print(f"Eye gaze: {'ON' if state.use_eye_gaze else 'OFF'}")
        elif key == ord('d'):
            state.show_debug = not state.show_debug
        elif key == ord('+') or key == ord('='):
            state.tap_velocity_threshold = max(0.005, state.tap_velocity_threshold - 0.002)
            print(f"Tap sensitivity: {state.tap_velocity_threshold:.3f} (more sensitive)")
        elif key == ord('-'):
            state.tap_velocity_threshold = min(0.05, state.tap_velocity_threshold + 0.002)
            print(f"Tap sensitivity: {state.tap_velocity_threshold:.3f} (less sensitive)")
        elif key == ord('c'):
            print("\n=== CALIBRATION ===")
            print("TODO: Touch the 4 corners of your screen")
            print("(Not implemented yet in prototype)\n")

    cap.release()
    cv2.destroyAllWindows()
    hands.close()
    face_mesh.close()
    print("Touchscreen prototype stopped.")


if __name__ == "__main__":
    main()
