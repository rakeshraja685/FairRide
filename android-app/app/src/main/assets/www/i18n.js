const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject the data-i18n tags directly via string replace
const tags = {
  "Select Vehicle": "vehicle_select",
  "Distance": "distance",
  "Fuel Type": "fuel_type",
  "Vehicle Mileage": "mileage",
  "Fuel Price (₹/L)": "fuel_price",
  "Adjust based on your vehicle": "adjust_vehicle",
  "Trip Time": "trip_time",
  "Used for Traffic/Idle charge": "idle_charge",
  "Night Shift": "night_shift",
  "10 PM - 5 AM": "night_time",
  "Traffic / Rain": "traffic_rain",
  "Surge multiplier": "surge_mult",
  "Estimated Total": "est_total",
  "Reset": "reset",
  "Share Fare": "share_fare",
  "Vehicle Comparison": "veh_comp",
  "vs Standard Mileage": "vs_std",
  "Trip<br/>History": "trip_history_title",
  "Activity Journal": "act_journal",
  "All Trips": "all_trips",
  "Clear": "clear",
  "Weekly Summary": "weekly_sum",
  "Total Trips": "total_trips",
  "Total Spent": "total_spent",
  "Avg per trip": "avg_trip",
  "No trips yet": "no_trips",
  "App Preferences": "app_pref"
};

// Extremely precise replacements to avoid breaking HTML tree
html = html.replace(/>Select Vehicle</g, '>Select Vehicle<'); // Just a hook marker
for (const [en, key] of Object.entries(tags)) {
  const re = new RegExp(`>\\s*${en.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1")}\\s*<`, 'g');
  html = html.replace(re, ` data-i18n="${key}">${en}<`);
}
// Specific ones
html = html.replace('Trip<br/>History', '<span data-i18n="trip_history_title">Trip<br/>History</span>');

// 2. Add Lang toggle in settings page
const settingsHTML = `
  <!-- Preferences -->
  <section class="space-y-4">
    <p data-i18n="app_pref" style="font-size:10px;text-transform:uppercase;letter-spacing:.15em;font-weight:700;color:#006d37;margin-bottom:-.5rem;">App Preferences</p>

    <!-- Language Toggle -->
    <div class="card-bg p-5 rounded-xl flex items-center justify-between" style="background:#fff;">
      <div class="flex items-center gap-3">
        <div style="width:2.5rem;height:2.5rem;border-radius:9999px;background:rgba(0,109,55,.1);display:flex;align-items:center;justify-content:center;color:#006d37;">
          <span class="material-symbols-outlined" style="font-size:20px;">translate</span>
        </div>
        <div>
          <h4 style="font-weight:700;color:#191c1d;margin:0 0 2px;">App Language</h4>
          <p style="font-size:9px;color:#6c7b6d;margin:0;">Select English or Tamil</p>
        </div>
      </div>
      <div style="background:#e7e8e9;border-radius:9999px;padding:4px;display:flex;width:120px;">
        <button id="lang-en" class="flex-1 py-1.5 rounded-full text-xs font-bold transition-all" style="background:#2ecc71;color:#005027;" onclick="setLang('en')">EN</button>
        <button id="lang-ta" class="flex-1 py-1.5 rounded-full text-xs font-bold transition-all text-[#3d4a3e]" onclick="setLang('ta')">TA</button>
      </div>
    </div>
`;
html = html.replace(/<!-- Preferences -->\s*<section class="space-y-4">\s*<p style="([^"]+)">App Preferences<\/p>/, settingsHTML);

// 3. Inject JS Logic
const jsLogic = `
// ═══════════════════════════════════════════════
//  I18N (LANGUAGE)
// ═══════════════════════════════════════════════
const i18n = {
  en: {
    vehicle_select: "Select Vehicle",
    distance: "Distance",
    fuel_type: "Fuel Type",
    mileage: "Vehicle Mileage",
    fuel_price: "Fuel Price (₹/L)",
    adjust_vehicle: "Adjust based on your vehicle",
    trip_time: "Trip Time",
    idle_charge: "Used for Traffic/Idle charge",
    night_shift: "Night Shift",
    night_time: "10 PM - 5 AM",
    traffic_rain: "Traffic / Rain",
    surge_mult: "Surge multiplier",
    est_total: "Estimated Total",
    reset: "Reset",
    share_fare: "Share Fare",
    veh_comp: "Vehicle Comparison",
    vs_std: "vs Standard Mileage",
    trip_history_title: "Trip<br/>History",
    act_journal: "Activity Journal",
    all_trips: "All Trips",
    clear: "Clear",
    weekly_sum: "Weekly Summary",
    total_trips: "Total Trips",
    total_spent: "Total Spent",
    avg_trip: "Avg per trip",
    no_trips: "No trips yet",
    app_pref: "App Preferences",
    fair_price: "Fair Price Calculated",
    exp_price: "Expensive Rate",
    very_fair: "Very Reasonable"
  },
  ta: {
    vehicle_select: "வாகனத்தை தேர்வு செய்க",
    distance: "தூரம்",
    fuel_type: "எரிபொருள்",
    mileage: "வாகன மைலேஜ்",
    fuel_price: "எரிபொருள் விலை (₹/L)",
    adjust_vehicle: "உங்கள் வாகனத்திற்கு ஏற்ப மாற்றவும்",
    trip_time: "பயண நேரம்",
    idle_charge: "போக்குவரத்து நேரம்",
    night_shift: "இரவு ஷிப்ட்",
    night_time: "இரவு 10 - காலை 5",
    traffic_rain: "போக்குவரத்து / மழை",
    surge_mult: "கூடுதல் கட்டணம்",
    est_total: "மொத்த கட்டணம்",
    reset: "மீட்டமை",
    share_fare: "பகிர்க",
    veh_comp: "வாகன ஒப்பீடு",
    vs_std: "சராசரியுடன் ஒப்பீடு",
    trip_history_title: "பயண<br/>வரலாறு",
    act_journal: "செயல்பாட்டு இதழ்",
    all_trips: "அனைத்து",
    clear: "அழி",
    weekly_sum: "வாராந்திர சுருக்கம்",
    total_trips: "மொத்த பயணங்கள்",
    total_spent: "மொத்த செலவு",
    avg_trip: "சராசரி பயன்",
    no_trips: "பயணங்கள் இல்லை",
    app_pref: "பயன்பாட்டு அமைப்புகள்",
    fair_price: "நியாயமான விலை",
    exp_price: "அதிக விலை",
    very_fair: "மிகவும் நியாயமானது"
  }
};

function setLang(lang) {
  settings.lang = lang;
  saveSettings();
  applyLangUI();
}

function applyLangUI() {
  const lang = settings.lang || 'en';
  
  // Toggle buttons
  const isEn = lang === 'en';
  const bEn = document.getElementById('lang-en');
  const bTa = document.getElementById('lang-ta');
  if(bEn && bTa) {
    bEn.style.background = isEn ? '#2ecc71' : 'transparent';
    bEn.style.color = isEn ? '#005027' : '#3d4a3e';
    bTa.style.background = !isEn ? '#2ecc71' : 'transparent';
    bTa.style.color = !isEn ? '#005027' : '#3d4a3e';
  }

  // Update texts
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang] && i18n[lang][key]) {
      el.innerHTML = i18n[lang][key];
    }
  });
  
  // Rerender calculation variables
  recalculate();
}
`;

html = html.replace('//  CALCULATION LOGIC', jsLogic + '\n//  CALCULATION LOGIC');

// 4. Update the recalculate function to use it
html = html.replace(/text = 'Fair Price Calculated'/g, "text = (settings.lang === 'ta') ? i18n.ta.fair_price : i18n.en.fair_price");
html = html.replace(/text = 'Very Reasonable'/g, "text = (settings.lang === 'ta') ? i18n.ta.very_fair : i18n.en.very_fair");
html = html.replace(/text = 'Slightly High'/g, "text = (settings.lang === 'ta') ? 'சற்றே அதிகம்' : 'Slightly High'");
html = html.replace(/text = 'Expensive'/g, "text = (settings.lang === 'ta') ? i18n.ta.exp_price : i18n.en.exp_price");

// 5. Apply on boot
html = html.replace('applyTheme();', 'applyTheme();\n  applyLangUI();');

fs.writeFileSync('index.html', html);
console.log('Success applying i18n');
