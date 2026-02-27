const listEl = document.getElementById('script-list');
const emptyEl = document.getElementById('empty-state');

function render(scripts) {
    listEl.innerHTML = '';
    emptyEl.classList.toggle('visible', scripts.length === 0);

    for (const script of scripts) {
        const item = document.createElement('div');
        item.className = 'script-item';

        // Toggle
        const toggle = document.createElement('label');
        toggle.className = 'toggle';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = script.enabled;
        checkbox.addEventListener('change', () => toggleScript(script.id, checkbox.checked));
        const slider = document.createElement('span');
        slider.className = 'slider';
        toggle.append(checkbox, slider);

        // Info (clickable to edit)
        const info = document.createElement('div');
        info.className = 'script-info';
        info.title = 'Click to edit';
        info.innerHTML = `
      <div class="script-name">${escapeHtml(script.name)}</div>
      <div class="script-match">${escapeHtml(script.matches)}</div>
    `;
        info.addEventListener('click', () => editScript(script.id));

        // Delete
        const del = document.createElement('button');
        del.className = 'delete-btn';
        del.title = 'Delete';
        del.textContent = '×';
        del.addEventListener('click', () => deleteScript(script.id));

        item.append(toggle, info, del);
        listEl.append(item);
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function loadScripts() {
    chrome.storage.local.get('scripts', (data) => {
        render(data.scripts || []);
    });
}

function toggleScript(id, enabled) {
    chrome.storage.local.get('scripts', (data) => {
        const scripts = data.scripts || [];
        const script = scripts.find(s => s.id === id);
        if (script) {
            script.enabled = enabled;
            chrome.storage.local.set({ scripts }, () => render(scripts));
        }
    });
}

function deleteScript(id) {
    if (!confirm('Delete this script?')) return;
    chrome.storage.local.get('scripts', (data) => {
        const scripts = (data.scripts || []).filter(s => s.id !== id);
        chrome.storage.local.set({ scripts }, () => render(scripts));
    });
}

function editScript(id) {
    chrome.tabs.create({ url: `editor.html?id=${id}` });
}

// Add button
document.getElementById('add-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'editor.html' });
});

// Listen for storage changes (e.g. after saving in editor)
chrome.storage.onChanged.addListener(() => loadScripts());

loadScripts();
