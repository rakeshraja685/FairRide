# FairRide Fare Calculation Engine

The FairRide application uses a robust "Base + Distance + Time" algorithm modeled after realistic Indian commercial transportation standards. This calculation protects both the driver from losing money when fuel prices spike, while remaining mathematically transparent for the passenger.

## Variables
For any given ride, the app reads the following variables:
*   `D`: **Distance** (in Kilometers)
*   `T`: **Time** (in Minutes)
*   `FP`: **Fuel Price** (₹ per Liter)
*   `M`: **Mileage** (Kilometers per Liter)

## 1. Vehicle Constants
Every vehicle type has a specific set of constant regulations:

| Vehicle Type | Base Fare (₹) | Minimum Rate/Km (₹) | Time Cost (₹/min) | Minimum Total Fare (₹) |
| :--- | :--- | :--- | :--- | :--- |
| **🏍️ Bike** | ₹20 | ₹10 | ₹0.5 / min | ₹30 |
| **🚖 Auto** | ₹40 | ₹18 | ₹1.5 / min | ₹60 |
| **🚗 Car** | ₹60 | ₹25 | ₹2.0 / min | ₹100 |

## 2. Step-by-Step Calculation Formula

### Step A: Fuel Base Cost
First, the app calculates the raw underlying cost of fuel for one kilometer.
> **Formula:** `Fuel Cost Per KM` = `FP` ÷ `M`

### Step B: The "Dynamic Rate" Protection
Instead of just adding a flat +20% on the fuel cost, the Engine calculates a safe "Commercial Rate per KM" using a 6x multiplier of the raw fuel cost. It then checks this against the Vehicle's Minimum Rate (from the table above) and **uses whichever value is higher**. This mathematically guarantees profitability!
> **Formula:** `Commercial Rate Per KM` = `Math.max(Minimum Rate, Fuel Cost Per KM × 6)`

### Step C: Distance & Time Components
The engine then separately calculates distance charges and time charges (which accounts for idling in traffic).
> **Distance Charge:** `D` × `Commercial Rate Per KM`
> **Time Charge:** `T` × `Time Cost`

### Step D: Base + Addition
> **Pre-Surge Total:** `Base Fare` + `Distance Charge` + `Time Charge`

## 3. Applying Multipliers (Surges)
If the user turns on any of the special condition toggles, multipliers are sequentially added to the Total amount:
*   **Night Shift (10 PM to 5 AM):** Applies a **1.5x** multiplier to the `Pre-Surge Total`.
*   **Traffic / Rain (High Demand):** Applies a **1.2x** multiplier to the `Pre-Surge Total`.

If both are checked, the surge stacks (meaning Night Shift applied first, then Traffic applied to that new number).

## 4. Minimum Fare Validation
Finally, the system runs a check to guarantee the math never generated a number lower than the absolute **Minimum Total Fare** (e.g. ₹60 for an Auto). If the trip is extremely short (like 0.5km), it will automatically snap to the Minimum Fare.

---

### Real World Example (Auto in Chennai)
*   **Inputs:** 10 KM Distance, 30 Mins, ₹100/L Petrol, 25 KM/L Mileage, Auto, Standard Time.
*   **A: Fuel Cost/KM:** 100 ÷ 25 = ₹4.0/km
*   **B: Rate/KM:** 4.0 × 6 = ₹24.0/km (Since ₹24 is > ₹18 Min Rate, we use ₹24).
*   **C: Distance Charge:** 10 KM × ₹24 = ₹240
*   **D: Time Charge:** 30 Mins × ₹1.5 = ₹45
*   **Base:** ₹40
*   **Total Fare:** ₹40 + ₹240 + ₹45 = **₹325**
