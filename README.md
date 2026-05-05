# FairRide

FairRide is a smart fare calculator built to help riders and drivers estimate a fair trip price before the ride starts. It combines distance, trip time, vehicle type, mileage, and fuel price into one quick calculation so users can compare costs and avoid unfair pricing.

## Download APK

[Download the latest Android APK](https://github.com/rakeshraja685/FairRide/releases/latest/download/FairRide-latest.apk)

Repository: [rakeshraja685/FairRide](https://github.com/rakeshraja685/FairRide)

## What the app does

- Calculates estimated fares for `Bike`, `Auto`, and `Car` trips.
- Uses fuel price and mileage inputs to make fare estimates more realistic.
- Includes live fuel price syncing support when available.
- Shows a fare breakdown so users can see fuel cost, profit margin, and base fare.
- Supports map-based route selection with distance and time estimation.
- Stores trip history locally for quick reference.
- Includes settings for theme, language, and default ride preferences.

## How FairRide calculates fares

FairRide uses a base fare plus variable trip costs. The estimate is influenced by:

- Distance traveled
- Trip time
- Vehicle type
- Fuel type and fuel price
- Vehicle mileage
- Configured profit margin

The repository also includes `fair_fare_documentation.md`, which explains the fare logic in more detail.

## Project structure

- `index.html`: main app interface
- `calculator.html`: calculator-focused UI
- `history.html`: trip history screen
- `settings.html`: app settings screen
- `app.js`: fare calculation logic and UI behavior
- `android-app/`: Android wrapper project used to build the APK
- `APK/FairRide-latest.apk`: latest shareable Android build

## Notes

- This repository is public, so anyone with the APK link can download the app.
- The APK in `APK/FairRide-latest.apk` is the build intended for sharing from GitHub.
