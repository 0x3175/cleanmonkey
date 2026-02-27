const listEl = document.getElementById('script-list');
const emptyEl = document.getElementById('empty-state');
const editorEl = document.getElementById('editor');
const editorTitle = document.getElementById('editor-title');
const nameInput = document.getElementById('name');
const matchesInput = document.getElementById('matches');
const codeInput = document.getElementById('code');

let editingId = null;

// --- List ---

function render(scripts) {
    listEl.innerHTML = '';
    emptyEl.classList.toggle('visible', scripts.length === 0);

    for (const script of scripts) {
        const item = document.createElement('div');
        item.className = 'script-item' + (editingId === script.id ? ' active' : '');

        const toggle = document.createElement('label');
        toggle.className = 'toggle';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = script.enabled;
        checkbox.addEventListener('change', () => toggleScript(script.id, checkbox.checked));
        const slider = document.createElement('span');
        slider.className = 'slider';
        toggle.append(checkbox, slider);

        const info = document.createElement('div');
        info.className = 'script-info';
        info.title = 'Click to edit';
        info.innerHTML = `
      <div class="script-name">${escapeHtml(script.name)}</div>
      <div class="script-match">${escapeHtml(script.matches)}</div>
    `;
        info.addEventListener('click', () => openEditor(script.id));

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
        chrome.storage.local.set({ scripts }, () => {
            if (editingId === id) closeEditor();
            render(scripts);
        });
    });
}

// --- Editor ---

function openEditor(id) {
    editingId = id || null;

    if (id) {
        editorTitle.textContent = 'Edit Script';
        chrome.storage.local.get('scripts', (data) => {
            const script = (data.scripts || []).find(s => s.id === id);
            if (script) {
                nameInput.value = script.name;
                matchesInput.value = script.matches;
                codeInput.value = script.code;
            }
            loadScripts(); // re-render to show active state
        });
    } else {
        editorTitle.textContent = 'New Script';
        nameInput.value = '';
        matchesInput.value = '';
        codeInput.value = '';
        loadScripts();
    }

    editorEl.classList.add('visible');
    nameInput.focus();
}

function closeEditor() {
    editingId = null;
    editorEl.classList.remove('visible');
    loadScripts();
}

// Tab key inserts spaces
codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeInput.selectionStart;
        const end = codeInput.selectionEnd;
        codeInput.value = codeInput.value.substring(0, start) + '  ' + codeInput.value.substring(end);
        codeInput.selectionStart = codeInput.selectionEnd = start + 2;
    }
});

document.getElementById('save-btn').addEventListener('click', () => {
    const name = nameInput.value.trim();
    const matches = matchesInput.value.trim();
    const code = codeInput.value;

    if (!name || !matches) {
        alert('Name and match pattern are required.');
        return;
    }

    chrome.storage.local.get('scripts', (data) => {
        const scripts = data.scripts || [];

        if (editingId) {
            const script = scripts.find(s => s.id === editingId);
            if (script) {
                script.name = name;
                script.matches = matches;
                script.code = code;
            }
        } else {
            scripts.push({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                name,
                matches,
                code,
                enabled: true
            });
        }

        chrome.storage.local.set({ scripts }, () => closeEditor());
    });
});

document.getElementById('cancel-btn').addEventListener('click', closeEditor);
document.getElementById('add-btn').addEventListener('click', () => openEditor(null));

loadScripts();
