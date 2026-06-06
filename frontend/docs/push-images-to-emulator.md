Putting images on the Android emulator

1. Start the AVD (Android Studio → Device Manager, or CLI):

   emulator -list-avds
   emulator -avd <Your_AVD_Name> &

2. Wait until it is booted, then confirm adb sees it:

   adb devices

3. Push files into a folder the gallery indexes (e.g. Pictures or DCIM):

   adb push /path/to/image25.jpg /sdcard/Pictures/image25.jpg

   Use your real host path (for example the repo’s backend/assets/test_imgs/experiment1/image25.jpg if that file exists on disk).

4. Ask MediaProvider to scan so Photos picks them up (exact broadcast varies by API level; this often works):

   adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d "file:///sdcard/Pictures/image25.jpg"

   On newer images, opening the Photos app and pulling to refresh, or rebooting the emulator, can also surface new files.

5. In the app, use Upload Images and choose those photos from the library.

Note: adb talks to the emulator’s loopback from the host; you do not use 10.0.2.2 for adb push (that is only for traffic from the emulator to the host).
iOS Simulator: Drag image files onto the simulator window; they are added to the simulated photo library, then you can use the same Upload Images flow.
