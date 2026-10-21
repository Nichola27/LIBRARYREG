const STORAGE_KEY = "libraryreg.members.v1";
const registrationForm = document.querySelector("#registration-form");
const tableBody = document.querySelector("#member-table-body");
const searchInput = document.querySelector("#member-search");
const typeFilter = document.querySelector("#type-filter");
const emptyState = document.querySelector("#empty-state");
const tableSummary = document.querySelector("#table-summary");
const memberModal = document.querySelector("#member-modal");
const loginModal = document.querySelector("#login-modal");
const toast = document.querySelector("#toast");
let members = readMembers();
let toastTimeout;

function readMembers() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    const requiredFields = ["id", "fullName", "memberId", "studyProgram", "membershipType", "phone", "email", "address"];
    if (!Array.isArray(parsed) || parsed.some((member) => !member || requiredFields.some((field) => typeof member[field] !== "string"))) {
      throw new Error("Format data anggota tidak valid.");
    }
    return parsed;
  } catch (error) {
    showToast(`Data anggota tidak dapat dibaca: ${error.message}`, true);
    return [];
  }
}

function saveMembers(nextMembers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMembers));
    members = nextMembers;
    renderMembers();
    updateMemberStat();
    return true;
  } catch (error) {
    showToast(`Data tidak dapat disimpan di browser: ${error.message}`, true);
    return false;
  }
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 4000);
}

function updateMemberStat() {
  const stat = document.querySelector("#stat-members");
  stat.textContent = members.length ? `${new Intl.NumberFormat("id-ID").format(members.length)} anggota` : "8.250+";
}

function addCell(row, value, className = "") {
  const cell = document.createElement("td");
  cell.textContent = value || "—";
  if (className) cell.className = className;
  row.append(cell);
  return cell;
}

function renderMembers() {
  const term = searchInput.value.trim().toLocaleLowerCase("id");
  const kind = typeFilter.value;
  const filtered = members.filter((member) => {
    const matchesTerm = `${member.fullName} ${member.memberId}`.toLocaleLowerCase("id").includes(term);
    return matchesTerm && (!kind || member.membershipType === kind);
  });

  tableBody.replaceChildren();
  filtered.forEach((member, index) => {
    const row = document.createElement("tr");
    addCell(row, String(index + 1));
    addCell(row, member.fullName, "member-name");
    addCell(row, member.memberId);
    addCell(row, member.studyProgram);
    addCell(row, member.membershipType);
    addCell(row, member.phone);
    addCell(row, member.email);
    const actionCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "row-actions";
    actions.append(
      makeActionButton("Lihat detail", "◉", () => showMemberDetails(member)),
      makeActionButton("Edit anggota", "✎", () => editMember(member)),
      makeActionButton("Hapus anggota", "×", () => deleteMember(member), true)
    );
    actionCell.append(actions);
    row.append(actionCell);
    tableBody.append(row);
  });

  emptyState.hidden = filtered.length !== 0;
  if (members.length === 0) {
    emptyState.textContent = "Belum ada data anggota. Silakan daftarkan anggota baru.";
  } else if (filtered.length === 0) {
    emptyState.textContent = "Anggota tidak ditemukan. Coba ubah kata kunci atau filter.";
  }
  tableSummary.textContent = `Menampilkan ${filtered.length} dari ${members.length} anggota`;
}

function makeActionButton(label, icon, action, danger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `icon-button${danger ? " danger" : ""}`;
  button.textContent = icon;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.addEventListener("click", action);
  return button;
}

function showMemberDetails(member) {
  document.querySelector("#modal-title").textContent = "Detail Anggota";
  const content = document.querySelector("#modal-content");
  content.replaceChildren();
  const details = document.createElement("dl");
  details.className = "detail-list";
  const fields = [
    ["Nama lengkap", member.fullName],
    ["NIM/NIP", member.memberId],
    ["Program studi", member.studyProgram],
    ["Jenis keanggotaan", member.membershipType],
    ["Nomor telepon", member.phone],
    ["Email", member.email],
    ["Alamat", member.address]
  ];
  fields.forEach(([label, value]) => {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value || "—";
    wrapper.append(term, description);
    details.append(wrapper);
  });
  content.append(details);
  memberModal.showModal();
}

function editMember(member) {
  const title = document.querySelector("#modal-title");
  title.textContent = "Edit Data Anggota";
  const content = document.querySelector("#modal-content");
  content.replaceChildren();
  const form = document.createElement("form");
  form.className = "member-form";
  form.id = "edit-member-form";
  const fields = [
    ["fullName", "Nama lengkap", "text", 100],
    ["memberId", "NIM/NIP", "text", 30],
    ["studyProgram", "Program studi", "text", 100],
    ["membershipType", "Jenis keanggotaan", "select", 40],
    ["phone", "Nomor telepon", "tel", 20],
    ["email", "Email", "email", 120],
    ["address", "Alamat", "textarea", 300]
  ];
  fields.forEach(([key, label, type, maxLength]) => {
    const wrapper = document.createElement("div");
    wrapper.className = `form-field${key === "address" ? " form-field-wide" : ""}`;
    const fieldLabel = document.createElement("label");
    fieldLabel.textContent = label;
    const input = type === "textarea" ? document.createElement("textarea") : document.createElement(type === "select" ? "select" : "input");
    input.id = `edit-${key}`;
    input.name = key;
    input.required = true;
    fieldLabel.htmlFor = input.id;
    if (type === "textarea") input.rows = 3;
    else if (type !== "select") input.type = type;
    input.maxLength = maxLength;
    if (type === "select") {
      ["Mahasiswa", "Dosen", "Tenaga Kependidikan"].forEach((optionText) => {
        const option = document.createElement("option");
        option.value = optionText;
        option.textContent = optionText;
        input.append(option);
      });
    }
    input.value = member[key];
    wrapper.append(fieldLabel, input);
    form.append(wrapper);
  });
  const actions = document.createElement("div");
  actions.className = "form-actions form-field-wide";
  const cancel = document.createElement("button");
  cancel.className = "button button-outline";
  cancel.type = "button";
  cancel.textContent = "Batal";
  cancel.addEventListener("click", () => memberModal.close());
  const save = document.createElement("button");
  save.className = "button button-dark";
  save.type = "submit";
  save.textContent = "Simpan Perubahan";
  actions.append(cancel, save);
  form.append(actions);
  content.append(form);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const updated = { ...member, ...Object.fromEntries(new FormData(form).entries()) };
    updated.memberId = updated.memberId.trim();
    updated.email = updated.email.trim();
    updated.fullName = updated.fullName.trim();
    updated.studyProgram = updated.studyProgram.trim();
    updated.phone = updated.phone.trim();
    updated.address = updated.address.trim();
  const validTypes = ["Mahasiswa", "Dosen", "Tenaga Kependidikan"];
    if (!validTypes.includes(updated.membershipType)) {
      showToast("Pilih jenis keanggotaan yang tersedia.", true);
      return;
    }
    if (members.some((item) => item.id !== member.id && item.memberId.toLocaleLowerCase("id") === updated.memberId.toLocaleLowerCase("id"))) {
      showToast("Perubahan belum disimpan. NIM/NIP tersebut sudah terdaftar.", true);
      return;
    }
    const next = members.map((item) => item.id === member.id ? updated : item);
    if (saveMembers(next)) {
      memberModal.close();
      showToast("Data anggota berhasil diperbarui.");
    }
  });
  memberModal.showModal();
}

function deleteMember(member) {
  if (!window.confirm(`Hapus data anggota ${member.fullName} (${member.memberId})?`)) return;
  const next = members.filter((item) => item.id !== member.id);
  if (saveMembers(next)) showToast("Data anggota berhasil dihapus.");
}

registrationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!registrationForm.reportValidity()) return;
  const formData = new FormData(registrationForm);
  const member = Object.fromEntries(formData.entries());
  member.id = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  member.createdAt = new Date().toISOString();
  member.memberId = member.memberId.trim();
  member.email = member.email.trim();
  member.fullName = member.fullName.trim();
  if (members.some((item) => item.memberId.toLocaleLowerCase("id") === member.memberId.toLocaleLowerCase("id"))) {
    document.querySelector("#memberId").setCustomValidity("NIM/NIP ini sudah terdaftar.");
    document.querySelector("#memberId").reportValidity();
    showToast("Pendaftaran gagal. NIM/NIP tersebut sudah terdaftar.", true);
    return;
  }
  document.querySelector("#memberId").setCustomValidity("");
  if (saveMembers([...members, member])) {
    registrationForm.reset();
    showToast("Pendaftaran berhasil. Anggota telah ditambahkan.");
    document.querySelector("#anggota").scrollIntoView({ behavior: "smooth" });
  }
});

document.querySelector("#memberId").addEventListener("input", (event) => event.currentTarget.setCustomValidity(""));
registrationForm.addEventListener("reset", () => document.querySelector("#memberId").setCustomValidity(""));
searchInput.addEventListener("input", renderMembers);
typeFilter.addEventListener("change", renderMembers);

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

document.querySelectorAll("[data-open-login]").forEach((button) => button.addEventListener("click", () => loginModal.showModal()));
document.querySelector("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  loginModal.close();
  document.querySelector("#anggota").scrollIntoView({ behavior: "smooth" });
  showToast("Mode simulasi: Anda dapat mengelola data anggota di halaman ini.");
  event.currentTarget.reset();
});

const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#primary-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    navigation.querySelectorAll(".nav-link").forEach((item) => item.classList.toggle("active", item.hash === link.hash));
  });
});

renderMembers();
updateMemberStat();
