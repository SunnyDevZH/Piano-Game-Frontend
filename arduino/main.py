from keyboard_emulator import KeyboardEmulator                      # Code von Sebastian zur Steuerung der Tastatur
from usb.device.keyboard import KeyCode                             # Code auf Board zur Tastatursteuerung
from time import sleep_ms                                           # timer
from modulino import ModulinoDistance, ModulinoPixels               # Import Modulino Module

# =========================
# Konfiguration
# =========================
ABSTAND_ZU_PLATTE_CM = 10                                           # Abstand in cm, um die Taste zu aktivieren
NUM_LEDS = 8                                                        # Anzahl der LEDs auf dem Modulino
FARBE_TASTENDRUCK = (255, 0, 0)                                     # Rot
FARBE_AUS = (0, 0, 0)                                               # Aus

# =========================
# Initialisierung Module und Farbe aus
# =========================
dist = ModulinoDistance()
pixels = ModulinoPixels()

for i in range(NUM_LEDS):
    pixels.set_rgb(i, *FARBE_AUS)
pixels.show()

# =========================
# Bedingung für F-Taste
# =========================
def should_press_f():
    distance_cm = dist.distance                                     # Abstand in cm messen
    
    if distance_cm > 0 and distance_cm <= ABSTAND_ZU_PLATTE_CM:     # Wenn Abstand zwischen 0 und 10 cm
        return True
    return False

# =========================
# LEDs aktualisieren
# =========================
def update_leds_for_keypress(active):
    farbe = FARBE_TASTENDRUCK if active else FARBE_AUS              # If True -> Rot, else Aus

    for i in range(NUM_LEDS):
        pixels.set_rgb(i, *farbe)
    pixels.show()

# =========================
# Tastatur starten
# =========================
keyboard = KeyboardEmulator()                                       # Klasse aus Tastatur-Emulator -> keyboard_emulator.py
keyboard.add_binding(should_press_f, KeyCode.F)                     # Taste F senden!

keyboard.start()                                                    # ⚠️ Achtung: Trennt die USB-Serielle Verbindung!

# =========================
# Hauptschleife
# =========================
while True:
    trigger = should_press_f()                                      # Überprüfen, ob die F-Taste gedrückt wird

    update_leds_for_keypress(trigger)                               # Trigger True/False -> LEDs aktualisieren

    keyboard.update()                                               # Tastenzustand aktualisieren
    sleep_ms(10)
