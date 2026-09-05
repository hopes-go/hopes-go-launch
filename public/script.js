const screens = document.querySelectorAll(".screen");
const deliveryForm = document.querySelector("#deliveryForm");
const groceryForm = document.querySelector("#groceryForm");
const customRequestForm = document.querySelector("#customRequestForm");
const afterHoursForm = document.querySelector("#afterHoursForm");
const customLocations = document.querySelector("#customLocations");
const addLocation = document.querySelector("#addLocation");
const tipInput = document.querySelector("#tipInput");
const timerDisplay = document.querySelector("#orderTimer");
const waitingMessage = document.querySelector("#waitingMessage");
const acceptedMessage = document.querySelector("#acceptedMessage");
const continueAfterAccepted = document.querySelector("#continueAfterAccepted");
const driverStatus = document.querySelector("#driverStatus");
const continueWithTip = document.querySelector("#continueWithTip");
const continueWithoutTip = document.querySelector("#continueWithoutTip");
const splashScreen = document.querySelector("#splashScreen");
const pricingModal = document.querySelector("#pricingModal");
const openPricing = document.querySelector("#openPricing");
const closePricing = document.querySelector("#closePricing");
const brandHome = document.querySelector("#brandHome");
const screenControls = document.querySelector("#screenControls");
const backButton = document.querySelector("#backButton");
const orderTimerBox = document.querySelector("#orderTimerBox");
const checkoutFoodPolicy = document.querySelector("#checkoutFoodPolicy");
const ownerModal = document.querySelector("#ownerModal");
const ownerUnlockForm = document.querySelector("#ownerUnlockForm");
const ownerCode = document.querySelector("#ownerCode");
const ownerError = document.querySelector("#ownerError");
const closeOwnerModal = document.querySelector("#closeOwnerModal");
const ownerModeStatus = document.querySelector("#ownerModeStatus");
const legalModal = document.querySelector("#legalModal");
const legalModalTitle = document.querySelector("#legalModalTitle");
const closeLegalModal = document.querySelector("#closeLegalModal");

const state = {
  driverAvailable: false,
  foodTotal: 0,
  deliveryFee: 10,
  secondStopFee: 0,
  smallStopFee: 0,
  tip: 5,
  distanceMiles: 4.5,
  requestType: "delivery",
  currentScreen: "home",
  previousScreen: "home",
  ownerMode: false,
};

function updateDriverStatus(available) {
  state.driverAvailable = available;
  driverStatus.classList.toggle("unavailable", !available);
  driverStatus.innerHTML = `
    <span class="status-dot"></span>
    ${available ? "Driver available" : "No driver clocked in"}
  `;
}

async function refreshDriverAvailability() {
  try {
    const response = await fetch("/api/driver-availability");
    const data = await response.json();
    updateDriverStatus(Boolean(data.available));
  } catch {
    updateDriverStatus(false);
  }
}

function updateOwnerMode(enabled) {
  state.ownerMode = enabled;
  ownerModeStatus.classList.toggle("hidden", !enabled);
  ownerModeStatus.textContent = "Owner preview · no live requests";
}

async function refreshOwnerAccess() {
  try {
    const response = await fetch("/api/owner/access");
    const data = await response.json();
    updateOwnerMode(Boolean(data.ownerMode));
    if (data.ownerMode) showScreen("home");
  } catch {
    updateOwnerMode(false);
  }
}

function hideSplashScreen() {
  window.setTimeout(() => {
    splashScreen.classList.add("leaving");
  }, 3000);

  window.setTimeout(() => {
    splashScreen.remove();
  }, 3700);
}

hideSplashScreen();

function isWithinBusinessHours() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  return weekday !== "Sun" && hour >= 10 && hour < 23;
}

function showScreen(id) {
  if (id === "home" && !state.ownerMode && !isWithinBusinessHours()) id = "afterHours";
  state.previousScreen = state.currentScreen;
  state.currentScreen = id;
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === id);
  });
  screenControls.classList.toggle("hidden", id === "home" || id === "afterHours");
  orderTimerBox.classList.toggle("hidden", !["placeOrder", "groceryDetails"].includes(id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openPricingModal() {
  pricingModal.classList.remove("hidden");
}

function closePricingModal() {
  pricingModal.classList.add("hidden");
}

function showCheckout() {
  checkoutFoodPolicy.classList.toggle("hidden", state.requestType === "grocery");
  showScreen("checkout");
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function readCurrencyInput(input) {
  const digits = String(input.value || "").replace(/\D/g, "");
  return digits ? Number(digits) / 100 : 0;
}

function formatCurrencyInput(input) {
  const value = readCurrencyInput(input);
  input.value = money(value);
  return value;
}

function calculateTotals() {
  const subtotal =
    state.foodTotal +
    state.deliveryFee +
    state.secondStopFee +
    state.smallStopFee +
    state.tip;
  const taxes = state.foodTotal * 0.07;
  const beforeCardFee = subtotal + taxes;
  const cardFee = beforeCardFee * 0.029 + 0.3;
  return {
    taxes,
    cardFee,
    total: beforeCardFee + cardFee,
  };
}

function updateSummary() {
  const totals = calculateTotals();
  document.querySelector("#summaryFood").textContent = money(state.foodTotal);
  document.querySelector("#summaryDelivery").textContent = money(state.deliveryFee);
  document.querySelector("#summarySecondStop").textContent = money(state.secondStopFee);
  document.querySelector("#summarySmallStop").textContent = money(state.smallStopFee);
  document.querySelector("#summaryTip").textContent = money(state.tip);
  document.querySelector("#summaryTax").textContent = money(totals.taxes);
  document.querySelector("#summaryCardFee").textContent = money(totals.cardFee);
  document.querySelector("#summaryTotal").textContent = money(totals.total);
}

function getDeliveryFee(distanceMiles) {
  if (distanceMiles <= 5) return 10;
  if (distanceMiles <= 15) return 20;
  if (distanceMiles <= 25) return 27;
  if (distanceMiles <= 35) return 35;
  return null;
}

function estimateDistanceFromAddress(address) {
  const normalizedAddress = address.toLowerCase();
  if (!normalizedAddress.trim()) return 4.5;
  if (normalizedAddress.includes("burlington") || normalizedAddress.includes("west burlington")) return 4.5;
  if (normalizedAddress.includes("middletown") || normalizedAddress.includes("danville")) return 12;
  if (normalizedAddress.includes("new london") || normalizedAddress.includes("wever")) return 22;
  if (normalizedAddress.includes("fort madison") || normalizedAddress.includes("mount pleasant")) return 32;
  if (normalizedAddress.includes("custom") || normalizedAddress.includes("far")) return 40;
  return 8;
}

function syncOrderFees() {
  const form = new FormData(deliveryForm);
  const addressParts = [
    form.get("dropoffStreet"),
    form.get("dropoffApt"),
    form.get("dropoffTown"),
    form.get("dropoffState"),
    form.get("dropoffZip"),
  ];
  const dropoff = addressParts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
  const distanceMiles = estimateDistanceFromAddress(dropoff);
  const secondFoodStop = String(form.get("secondFoodStop") || "").trim();
  const smallStop = String(form.get("smallStop") || "").trim();
  const deliveryFee = getDeliveryFee(distanceMiles);

  state.distanceMiles = distanceMiles;
  state.foodTotal = readCurrencyInput(deliveryForm.querySelector('[name="foodTotal"]'));
  state.deliveryFee = deliveryFee ?? 0;
  state.secondStopFee = secondFoodStop ? 7 : 0;
  state.smallStopFee = smallStop ? 3 : 0;

  document.querySelector("#distanceStatus").textContent =
    deliveryFee === null ? "Custom Request needed" : `About ${distanceMiles} miles`;
  document.querySelector("#liveDeliveryFee").textContent =
    deliveryFee === null ? "Custom Request" : money(state.deliveryFee);
  document.querySelector("#liveSecondStopFee").textContent = money(state.secondStopFee);
  document.querySelector("#liveSmallStopFee").textContent = money(state.smallStopFee);
}

function syncGroceryFees() {
  const form = new FormData(groceryForm);
  const addressParts = [
    form.get("groceryStreet"),
    form.get("groceryApt"),
    form.get("groceryTown"),
    form.get("groceryState"),
    form.get("groceryZip"),
  ];
  const dropoff = addressParts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
  const distanceMiles = estimateDistanceFromAddress(dropoff);
  const deliveryFee = getDeliveryFee(distanceMiles);
  const largeFee = form.get("largeGrocery") ? 10 : 0;

  state.distanceMiles = distanceMiles;
  state.foodTotal = 0;
  state.deliveryFee = deliveryFee ?? 0;
  state.secondStopFee = largeFee;
  state.smallStopFee = 0;

  document.querySelector("#groceryDeliveryFee").textContent =
    deliveryFee === null ? "Custom Request" : money(state.deliveryFee);
  document.querySelector("#groceryLargeFee").textContent = money(largeFee);
}

function startOrderTimer() {
  let secondsLeft = 15 * 60;
  clearInterval(window.orderTimer);

  window.orderTimer = setInterval(() => {
    secondsLeft -= 1;
    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const seconds = (secondsLeft % 60).toString().padStart(2, "0");
    timerDisplay.textContent = `${minutes}:${seconds}`;

    if (secondsLeft <= 0) {
      clearInterval(window.orderTimer);
      timerDisplay.textContent = "Expired";
    }
  }, 1000);
}

function waitForDriverAcceptance() {
  acceptedMessage.classList.add("hidden");
  continueAfterAccepted.classList.add("hidden");
  waitingMessage.textContent =
    state.requestType === "grocery"
      ? "A clocked-in driver will accept your request before you place your grocery pickup."
      : "A clocked-in driver will accept your request before you place the food order.";
  acceptedMessage.textContent =
    state.requestType === "grocery"
      ? "Driver accepted. You can continue with your grocery pickup."
      : "Driver accepted. You can continue placing your order.";
  clearTimeout(window.driverAcceptanceTimer);

  window.driverAcceptanceTimer = setTimeout(() => {
    acceptedMessage.classList.remove("hidden");
    continueAfterAccepted.classList.remove("hidden");
  }, 2200);
}

document.querySelectorAll(".request-button").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.request === "custom") {
      state.requestType = "custom";
      showScreen("customDetails");
      return;
    }

    if (!state.driverAvailable && !state.ownerMode) {
      alert("No driver is clocked in. Please call (319) 600-6857 and choose extension 1 for delivery.");
      return;
    }

    if (button.dataset.request === "ride") {
      showScreen("rideDisclaimer");
      return;
    }

    if (button.dataset.request === "grocery") {
      state.requestType = "grocery";
      showScreen("waiting");
      waitForDriverAcceptance();
      return;
    }

    state.requestType = "delivery";
    showScreen("waiting");
    waitForDriverAcceptance();
  });
});

document.querySelector("#backFromRide").addEventListener("click", () => {
  showScreen("home");
});

backButton.addEventListener("click", () => {
  const deliveryOrder = ["home", "waiting", "placeOrder", "tipScreen", "checkout"];
  const groceryOrder = ["home", "waiting", "groceryDetails", "tipScreen", "checkout"];
  const customOrder = ["home", "customDetails"];
  const screenOrder = state.requestType === "grocery" ? groceryOrder : state.requestType === "custom" ? customOrder : deliveryOrder;
  const currentIndex = screenOrder.indexOf(state.currentScreen);
  if (state.currentScreen === "rideDisclaimer") {
    showScreen("home");
    return;
  }
  showScreen(screenOrder[Math.max(currentIndex - 1, 0)] || "home");
});

openPricing.addEventListener("click", openPricingModal);
closePricing.addEventListener("click", closePricingModal);
pricingModal.addEventListener("click", (event) => {
  if (event.target === pricingModal) closePricingModal();
});
let brandClickCount = 0;
let brandClickTimer;

brandHome.addEventListener("click", (event) => {
  event.preventDefault();
  brandClickCount += 1;
  clearTimeout(brandClickTimer);
  brandClickTimer = setTimeout(() => { brandClickCount = 0; }, 1800);
  if (brandClickCount === 5) {
    brandClickCount = 0;
    ownerError.classList.add("hidden");
    ownerCode.value = "";
    ownerModal.classList.remove("hidden");
    ownerCode.focus();
  }
  closePricingModal();
  showScreen("home");
});

closeOwnerModal.addEventListener("click", () => ownerModal.classList.add("hidden"));

ownerModal.addEventListener("click", (event) => {
  if (event.target === ownerModal) ownerModal.classList.add("hidden");
});

ownerUnlockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  ownerError.classList.add("hidden");
  const response = await fetch("/api/owner/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: ownerCode.value }),
  });
  const data = await response.json();
  if (!response.ok) {
    ownerError.textContent = data.message || "Unable to unlock Owner Mode.";
    ownerError.classList.remove("hidden");
    return;
  }
  updateOwnerMode(true);
  ownerModal.classList.add("hidden");
  showScreen("home");
});

document.querySelectorAll(".footer-link").forEach((link) => {
  link.addEventListener("click", () => {
    legalModalTitle.textContent = link.dataset.legalTitle;
    legalModal.classList.remove("hidden");
  });
});

closeLegalModal.addEventListener("click", () => legalModal.classList.add("hidden"));
legalModal.addEventListener("click", (event) => {
  if (event.target === legalModal) legalModal.classList.add("hidden");
});

continueAfterAccepted.addEventListener("click", () => {
  showScreen(state.requestType === "grocery" ? "groceryDetails" : "placeOrder");
  startOrderTimer();
});

deliveryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  syncOrderFees();
  if (state.distanceMiles > 35) {
    alert("This drop-off looks more than 35 miles away. Please go back and start a Custom Request.");
    return;
  }

  updateSummary();
  showScreen("tipScreen");
});

deliveryForm.addEventListener("input", (event) => {
  if (event.target.name === "foodTotal") formatCurrencyInput(event.target);
  syncOrderFees();
});

groceryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  syncGroceryFees();
  if (state.distanceMiles > 35) {
    alert("This drop-off looks more than 35 miles away. Please go back and start a Custom Request.");
    return;
  }

  updateSummary();
  showScreen("tipScreen");
});

groceryForm.addEventListener("input", syncGroceryFees);

addLocation.addEventListener("click", () => {
  const locationCount = customLocations.querySelectorAll("label").length;
  if (locationCount >= 5) return;

  const nextNumber = locationCount + 1;
  const label = document.createElement("label");
  label.innerHTML = `Location #${nextNumber}<input name="location${nextNumber}" required placeholder="Address, business, or landmark" />`;
  customLocations.append(label);
  if (nextNumber === 5) addLocation.classList.add("hidden");
});

customRequestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.ownerMode) {
    alert("Owner preview only: this custom request was not sent.");
    return;
  }
  alert("Your custom request has been sent for review. Someone from Hope's & Go will call about pricing and any questions. Once accepted, you will receive a text confirming the details with a payment link.");
  customRequestForm.reset();
  showScreen("home");
});

afterHoursForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (state.ownerMode) {
    alert("Owner preview only: this future service request was not sent.");
    return;
  }
  alert("Your future service request has been submitted. Once it is reviewed, someone from Hope's & Go will call or text you back to confirm the details and availability.");
  afterHoursForm.reset();
});

tipInput.addEventListener("input", () => {
  state.tip = formatCurrencyInput(tipInput);
  updateSummary();
});

continueWithTip.addEventListener("click", () => {
  state.tip = readCurrencyInput(tipInput);
  updateSummary();
  showCheckout();
});

continueWithoutTip.addEventListener("click", () => {
  state.tip = 0;
  tipInput.value = "0.00";
  updateSummary();
  showCheckout();
});

document.querySelector("#mockPay").addEventListener("click", () => {
  alert(state.ownerMode ? "Owner preview only: no payment was started." : "Stripe checkout will open here once the account is connected.");
});

updateSummary();
syncOrderFees();
syncGroceryFees();
refreshDriverAvailability();
refreshOwnerAccess();
setInterval(refreshDriverAvailability, 15000);

if (!isWithinBusinessHours()) showScreen("afterHours");
