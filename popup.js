// ── DOM References ──────────────────────────────────────────────

const toggleCheckbox = document.getElementById('toggle-enabled');
const toggleCard = document.getElementById('toggle-card');
const toggleLabel = document.getElementById('toggle-label');
const profileSelect = document.getElementById('profile-select');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const btnRefresh = document.getElementById('btn-refresh');

// ── Initialise ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Load toggle state
  chrome.storage.sync.get({ enabled: false }, (data) => {
    toggleCheckbox.checked = data.enabled;
    updateToggleUI(data.enabled);
  });

  detectProfiles();
});

// ── Toggle ──────────────────────────────────────────────────────

toggleCheckbox.addEventListener('change', () => {
  const enabled = toggleCheckbox.checked;
  chrome.storage.sync.set({ enabled });
  updateToggleUI(enabled);
});

function updateToggleUI(enabled) {
  toggleLabel.textContent = enabled ? 'Active' : 'Disabled';
  if (enabled) {
    toggleCard.classList.add('active');
  } else {
    toggleCard.classList.remove('active');
  }
}

// ── Profile Select ──────────────────────────────────────────────

profileSelect.addEventListener('change', () => {
  const selectedOption = profileSelect.options[profileSelect.selectedIndex];
  const directory = selectedOption.value;
  const displayName = selectedOption.textContent;

  chrome.storage.sync.set(
    { targetProfile: directory, targetProfileName: displayName },
    () => {
      profileSelect.classList.add('saved');
      setTimeout(() => profileSelect.classList.remove('saved'), 800);
    }
  );
});

// ── Refresh ─────────────────────────────────────────────────────

btnRefresh.addEventListener('click', () => {
  detectProfiles();
});

// ── Profile Detection ───────────────────────────────────────────

function detectProfiles() {
  setStatus('pending', 'Detecting profiles…');
  profileSelect.disabled = true;
  profileSelect.innerHTML = '<option value="">Detecting…</option>';

  chrome.runtime.sendMessage({ type: 'detect-profiles' }, (response) => {
    if (chrome.runtime.lastError) {
      setStatus('error', 'Cannot reach native host. Run install.bat first.');
      profileSelect.innerHTML = '<option value="">Native host not found</option>';
      return;
    }

    if (!response || !response.success) {
      const errMsg = response?.error || 'Unknown error';
      setStatus('error', `Error: ${errMsg}`);
      profileSelect.innerHTML = '<option value="">Detection failed</option>';
      return;
    }

    populateProfiles(response.profiles);
    setStatus('connected', `Connected · ${response.profiles.length} profiles found`);
  });
}

function populateProfiles(profiles) {
  profileSelect.innerHTML = '';

  profiles.sort((a, b) => {
    if (a.directory === 'Default') return -1;
    if (b.directory === 'Default') return 1;
    return a.name.localeCompare(b.name);
  });

  profiles.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.directory;
    opt.textContent = p.name;
    profileSelect.appendChild(opt);
  });

  profileSelect.disabled = false;

  // Restore saved selection
  chrome.storage.sync.get({ targetProfile: 'Default' }, (data) => {
    const match = profiles.find((p) => p.directory === data.targetProfile);
    if (match) {
      profileSelect.value = match.directory;
    } else if (profiles.length > 0) {
      profileSelect.selectedIndex = 0;
      const first = profiles[0];
      chrome.storage.sync.set({
        targetProfile: first.directory,
        targetProfileName: first.name
      });
    }
  });
}

// ── Status Helpers ──────────────────────────────────────────────

function setStatus(state, message) {
  statusDot.className = 'status-dot';
  if (state === 'connected') statusDot.classList.add('connected');
  if (state === 'error') statusDot.classList.add('error');
  statusText.textContent = message;
}
