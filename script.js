// ========== STATE & STORAGE ==========
const STORAGE_KEY = "clinic_demo_v2";
let appData = { bookings: [] };

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  appData = saved ? JSON.parse(saved) : { bookings: [] };
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  const dateInput = document.getElementById("apptDate");
  if (dateInput) {
    const today = new Date().toISOString().slice(0, 10);
    dateInput.min = today;
    dateInput.value = today;
  }
  const role = sessionStorage.getItem("activeRole") || "public";
  switchRole(role);
  if (sessionStorage.getItem("assistantLoggedIn") === "true")
    showAssistantDashboard();
});

function switchRole(role) {
  document.getElementById("public-view").classList.add("hidden");
  document.getElementById("assistant-view").classList.add("hidden");
  document.getElementById("tab-public").classList.remove("tab-active");
  document.getElementById("tab-assistant").classList.remove("tab-active");
  if (role === "public") {
    document.getElementById("public-view").classList.remove("hidden");
    document.getElementById("tab-public").classList.add("tab-active");
  } else if (role === "assistant") {
    document.getElementById("assistant-view").classList.remove("hidden");
    document.getElementById("tab-assistant").classList.add("tab-active");
    if (sessionStorage.getItem("assistantLoggedIn") === "true")
      showAssistantDashboard();
  }
  sessionStorage.setItem("activeRole", role);
}

function toggleFAQ(btn) {
  const content = btn.nextElementSibling;
  const icon = btn.querySelector("span");
  content.classList.toggle("open");
  icon.textContent = content.classList.contains("open") ? "−" : "+";
}

document
  .getElementById("reservationForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const date = document.getElementById("apptDate").value;
    const name = document.getElementById("fullName").value.trim();
    const wa = document.getElementById("whatsapp").value.trim();
    const age = document.getElementById("age").value;
    const gender = document.getElementById("gender").value;
    const complaint = document.getElementById("complaint").value;
    if (!date || !name || !wa || !age || !gender || !complaint)
      return alert("Lengkapi semua field.");
    document.getElementById("reservasi-section").classList.add("hidden");
    document.getElementById("success-view").classList.remove("hidden");
    const msg = `Halo Admin Klinik, saya ingin mengajukan reservasi.\n\nNama: ${name}\nWhatsApp: ${wa}\nUsia: ${age}\nJenis kelamin: ${gender}\nKeluhan: ${complaint}\nTanggal yang diinginkan: ${date}\n\nMohon informasi slot waktu yang tersedia.`;
    document.getElementById("whatsappConfirmLink").href =
      `https://wa.me/628813564384?text=${encodeURIComponent(msg)}`;
    window.open(document.getElementById("whatsappConfirmLink").href, "_blank");
  });

function resetReservation() {
  document.getElementById("reservasi-section").classList.remove("hidden");
  document.getElementById("success-view").classList.add("hidden");
  document.getElementById("reservationForm").reset();
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById("apptDate").value = today;
}

function loginAssistant() {
  if (
    document.getElementById("assistEmail").value === "asisten@klinik.com" &&
    document.getElementById("assistPass").value === "123"
  ) {
    sessionStorage.setItem("assistantLoggedIn", "true");
    showAssistantDashboard();
  } else alert("Email/password salah.");
}

function showAssistantDashboard() {
  document.getElementById("assistant-login").classList.add("hidden");
  document.getElementById("assistant-dashboard").classList.remove("hidden");
  renderAssistantQueue();
}

function renderAssistantQueue() {
  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = appData.bookings.filter((b) => b.date === today);
  const tbody = document.getElementById("assistantQueueBody");
  const emptyMsg = document.getElementById("empty-queue");
  if (todayBookings.length === 0) {
    tbody.innerHTML = "";
    emptyMsg.classList.remove("hidden");
    return;
  }
  emptyMsg.classList.add("hidden");
  tbody.innerHTML = todayBookings
    .map(
      (b) => `
      <tr class="border-b last:border-0">
        <td class="py-3 font-medium">${b.queueNumber}</td><td>${b.name}</td><td>${b.timeSlot}</td><td>${b.complaint}</td>
        <td><span class="inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor(b.status)}">${statusLabel(b.status)}</span></td>
        <td class="flex gap-1 flex-wrap py-2">
          ${b.status === "booked" ? `<button class="btn-status bg-blue-100 text-blue-700" onclick="updateStatus('${b.id}','present')">Hadir</button>` : ""}
          ${b.status !== "cancelled" && b.status !== "completed" ? `<button class="btn-status bg-red-100 text-red-700" onclick="updateStatus('${b.id}','cancelled')">Batal</button>` : ""}
          ${b.status === "present" ? `<button class="btn-status bg-green-100 text-green-700" onclick="updateStatus('${b.id}','completed')">Selesai</button>` : ""}
        </td>
      </tr>`,
    )
    .join("");
}

function updateStatus(bookingId, newStatus) {
  const booking = appData.bookings.find((b) => b.id === bookingId);
  if (booking) {
    booking.status = newStatus;
    saveData();
    renderAssistantQueue();
  }
}
function statusColor(s) {
  return (
    {
      booked: "bg-yellow-50 text-yellow-700",
      present: "bg-blue-50 text-blue-700",
      completed: "bg-green-50 text-green-700",
      cancelled: "bg-red-50 text-red-700",
    }[s] || ""
  );
}
function statusLabel(s) {
  return (
    {
      booked: "Menunggu",
      present: "Hadir",
      completed: "Selesai",
      cancelled: "Batal",
    }[s] || s
  );
}

function logout(role) {
  if (role === "assistant") {
    sessionStorage.removeItem("assistantLoggedIn");
    document.getElementById("assistant-dashboard").classList.add("hidden");
    document.getElementById("assistant-login").classList.remove("hidden");
  }
}

function exportData() {
  if (appData.bookings.length === 0) return alert("Belum ada data.");
  let csv = "Nama,WhatsApp,Tanggal,Slot,Keluhan,Status\n";
  appData.bookings.forEach(
    (b) =>
      (csv += `"${b.name}","${b.whatsapp}","${b.date}","${b.timeSlot}","${b.complaint}","${b.status}"\n`),
  );
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "data_pasien.csv";
  a.click();
  URL.revokeObjectURL(url);
}
