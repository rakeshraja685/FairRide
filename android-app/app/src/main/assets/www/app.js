document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements Mapping
    const distanceInput = document.querySelector('input[type="number"]');
    
    // Vehicle buttons: Bike, Auto, Car (using exact classes from UI)
    const vehicleButtons = document.querySelectorAll('.space-y-4 .flex.gap-3 button');
    
    // Fuel type buttons: Petrol, Diesel, LPG
    const fuelContainer = document.querySelector('.bg-surface-container-high.p-1.rounded-full.flex');
    const fuelButtons = fuelContainer ? fuelContainer.querySelectorAll('button') : [];
    
    // Detailed params inputs (Mileage, Fuel Price)
    const paramInputs = document.querySelectorAll('.flex-1.bg-surface-container-lowest input[type="text"]');
    const mileageInput = paramInputs[0];
    const fuelPriceInput = paramInputs[1];
    
    // Result Card elements (Hero)
    const totalFareDisplay = document.querySelector('h2.text-7xl');
    const breakdownValues = document.querySelectorAll('.grid.grid-cols-3 .font-bold');
    const fuelCostDisplay = breakdownValues[0];
    const profitDisplay = breakdownValues[1];
    const baseFareDisplay = breakdownValues[2];
    
    // Fairness Indicator
    const fairnessContainer = document.querySelector('.bg-primary-container .px-4.py-1');
    const fairnessText = fairnessContainer ? fairnessContainer.querySelector('span.tracking-widest') : null;
    const fairnessIcon = fairnessContainer ? fairnessContainer.querySelector('.material-symbols-outlined') : null;
    const heroCard = document.querySelector('section.relative .p-8.rounded-xl.overflow-hidden');
    
    // Comparison Cards
    const comparisonCards = document.querySelectorAll('.overflow-x-auto .w-48 p.text-2xl.font-headline');

    // Action buttons (Reset, Share)
    const actionButtons = document.querySelectorAll('.fixed.bottom-24 button');
    const resetButton = Array.from(actionButtons).find(btn => btn.textContent.toLowerCase().includes('reset'));

    // 2. Constants & Data Defaults
    const VEHICLES = {
        'Bike': { base: 10, mileage: 40 },
        'Auto': { base: 30, mileage: 25 },
        'Car': { base: 50, mileage: 15 }
    };
    
    const FUELS = {
        'Petrol': 102,
        'Diesel': 94,
        'LPG': 70
    };

    // 3. State Variables
    let state = {
        distance: 12.5,
        vehicle: 'Bike',
        fuel: 'Petrol',
        mileage: 40,
        fuelPrice: 102,
        manualMileage: false,
        manualFuelPrice: false
    };

    // 4. Persistence setup
    const loadState = () => {
        const savedInfo = localStorage.getItem('fairRideState');
        if (savedInfo) {
            try {
                state = JSON.parse(savedInfo);
            } catch (e) {
                console.error("Local storage error:", e);
            }
        }
    };
    
    const saveState = () => {
        localStorage.setItem('fairRideState', JSON.stringify(state));
    };

    // Save a history entry whenever a full calculation is triggered by the user
    const saveHistoryEntry = () => {
        const results = calculateFare(state.distance, state.vehicle, state.mileage, state.fuelPrice);
        const existing = JSON.parse(localStorage.getItem('fairRideHistory') || '[]');
        existing.push({
            vehicle: state.vehicle,
            fuel: state.fuel,
            distance: state.distance,
            totalFare: results.totalFare.toFixed(2),
            savedAt: Date.now()
        });
        // Keep last 30 entries max
        if (existing.length > 30) existing.splice(0, existing.length - 30);
        localStorage.setItem('fairRideHistory', JSON.stringify(existing));
    };

    // 5. Update UI values based on State
    const updateUIState = () => {
        if (distanceInput) distanceInput.value = state.distance;
        
        if (mileageInput) {
            const val = String(state.mileage);
            mileageInput.value = val + (val.includes('km/l') ? '' : ' km/l');
        }

        if (fuelPriceInput) fuelPriceInput.value = state.fuelPrice;

        // Sync Vehicle Buttons styling
        vehicleButtons.forEach((btn) => {
            const btnType = Object.keys(VEHICLES).find(v => btn.textContent.includes(v));
            if (btnType === state.vehicle) {
                btn.className = "flex-none px-8 py-4 bg-primary-container text-on-primary-container rounded-full font-bold flex items-center gap-2 shadow-sm";
            } else {
                btn.className = "flex-none px-8 py-4 bg-surface-container-high text-on-surface rounded-full font-semibold flex items-center gap-2 hover:bg-surface-container-highest transition-colors";
            }
        });

        // Sync Fuel Buttons styling
        fuelButtons.forEach((btn) => {
            const isSelected = btn.textContent.trim() === state.fuel;
            if (isSelected) {
                btn.className = "flex-1 py-2 bg-surface-container-lowest shadow-sm rounded-full text-xs font-bold text-primary";
                btn.classList.remove("text-on-surface-variant");
            } else {
                btn.className = "flex-1 py-2 text-xs font-bold text-on-surface-variant";
            }
        });
    };

    // 6. Primary Calculation Logic
    const calculateFare = (distance, vehicleType, mileage, fuelPrice) => {
        const d = parseFloat(distance) || 0;
        // Parse numerical values from strings (like '45 km/l')
        const m = parseFloat(String(mileage).replace(/[^0-9.]/g, '')) || 1;
        const p = parseFloat(String(fuelPrice).replace(/[^0-9.]/g, '')) || 0;
        
        const vehicleInfo = VEHICLES[vehicleType] || VEHICLES['Bike'];
        
        const fuelUsed = d / m;
        const fuelCost = fuelUsed * p;
        const profit = fuelCost * 0.20;
        const baseFare = vehicleInfo.base;
        const totalFare = fuelCost + profit + baseFare;
        
        return { fuelCost, profit, baseFare, totalFare };
    };

    const updateCalculations = () => {
        const results = calculateFare(state.distance, state.vehicle, state.mileage, state.fuelPrice);
        
        // Render functions
        const formatMoney = val => '₹' + val.toFixed(2);
        
        // Update main values
        if (totalFareDisplay) totalFareDisplay.textContent = formatMoney(results.totalFare);
        if (fuelCostDisplay) fuelCostDisplay.textContent = formatMoney(results.fuelCost);
        if (profitDisplay) profitDisplay.textContent = formatMoney(results.profit);
        if (baseFareDisplay) baseFareDisplay.textContent = formatMoney(results.baseFare);
        
        // 7. Fairness Indicator Update Logic
        if (fairnessContainer && heroCard) {
            const standardResults = calculateFare(
                state.distance, 
                state.vehicle, 
                VEHICLES[state.vehicle].mileage, 
                FUELS[state.fuel]
            );
            
            const difference = results.totalFare - standardResults.totalFare;
            
            // Clean dynamic classes
            heroCard.classList.remove('bg-primary-container', 'text-on-primary-container', 'bg-yellow-400', 'text-yellow-900', 'bg-red-500', 'text-white');
            fairnessContainer.classList.remove('bg-on-primary-container/10', 'bg-black/10');
            
            // Threshold checks
            if (difference > standardResults.totalFare * 0.2) {
                // > 20% more expensive
                if(fairnessText) fairnessText.textContent = "EXPENSIVE FARE";
                if(fairnessIcon) fairnessIcon.textContent = "warning";
                heroCard.classList.add('bg-red-500', 'text-white');
                fairnessContainer.classList.add('bg-black/10');
            } else if (difference > standardResults.totalFare * 0.05) {
                // > 5% more expensive
                if(fairnessText) fairnessText.textContent = "SLIGHTLY HIGH";
                if(fairnessIcon) fairnessIcon.textContent = "info";
                heroCard.classList.add('bg-yellow-400', 'text-yellow-900');
                fairnessContainer.classList.add('bg-black/10');
            } else {
                // Normal & Fair (or cheaper)
                if(fairnessText) fairnessText.textContent = "FAIR PRICE CALCULATED";
                if(fairnessIcon) fairnessIcon.textContent = "verified";
                heroCard.classList.add('bg-primary-container', 'text-on-primary-container');
                fairnessContainer.classList.add('bg-on-primary-container/10');
            }
        }
        
        // 8. Update Comparison Section
        if (comparisonCards.length >= 3) {
            const comparisons = [
                { type: 'Bike', card: comparisonCards[0] },
                { type: 'Auto', card: comparisonCards[1] },
                { type: 'Car', card: comparisonCards[2] }
            ];

            comparisons.forEach(comp => {
                // Calculate comparison value utilizing standard vs manual inputs safely
                const km = state.distance || 1; 
                // Always use standard mileage/fuel for comparison to be a true "baseline" comparison
                const res = calculateFare(km, comp.type, VEHICLES[comp.type].mileage, FUELS[state.fuel]);
                
                comp.card.textContent = formatMoney(res.totalFare);
                comp.card.nextElementSibling.textContent = `~ ₹${(res.totalFare / km).toFixed(0)}/km`;
            });
        }
    };

    // 9. Attach Interaction Listeners
    if (distanceInput) {
        distanceInput.addEventListener('input', (e) => {
            state.distance = parseFloat(e.target.value) || 0;
            saveState();
            updateCalculations();
        });
    }

    vehicleButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const btnText = btn.textContent.trim();
            const typeMatch = Object.keys(VEHICLES).find(v => btnText.includes(v));
            if (typeMatch) {
                state.vehicle = typeMatch;
                if (!state.manualMileage) {
                    // Smart Auto-Update Logic
                    state.mileage = VEHICLES[typeMatch].mileage;
                }
                saveState();
                updateUIState();
                updateCalculations();
                saveHistoryEntry();
            }
        });
    });

    fuelButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const type = btn.textContent.trim();
            if (FUELS[type]) {
                state.fuel = type;
                if (!state.manualFuelPrice) {
                    // Smart Auto-Update Logic
                    state.fuelPrice = FUELS[type];
                }
                saveState();
                updateUIState();
                updateCalculations();
                saveHistoryEntry();
            }
        });
    });

    if (mileageInput) {
        mileageInput.addEventListener('input', (e) => {
            state.manualMileage = true; // Turn off smart update for mileage
            state.mileage = e.target.value;
            saveState();
            updateCalculations();
        });
    }

    if (fuelPriceInput) {
        fuelPriceInput.addEventListener('input', (e) => {
            state.manualFuelPrice = true; // Turn off smart update for fuel
            state.fuelPrice = e.target.value;
            saveState();
            updateCalculations();
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            // Restore entirely to defaults
            state = {
                distance: parseFloat(distanceInput ? distanceInput.value : 12.5) || 12.5,
                vehicle: 'Bike',
                fuel: 'Petrol',
                mileage: VEHICLES['Bike'].mileage,
                fuelPrice: FUELS['Petrol'],
                manualMileage: false,
                manualFuelPrice: false
            };
            saveState();
            updateUIState();
            updateCalculations();
        });
    }

    // 10. Boot Application
    loadState();
    updateUIState();
    updateCalculations();
});
