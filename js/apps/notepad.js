// Schlenix - 记事本应用

class NotepadApp {
    constructor() {
        this.instances = new Map();
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '记事本',
            icon: '📋',
            width: 600,
            height: 400,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            notes: this.loadNotes(),
            currentNote: null
        });

        this.attachEvents(windowId);
    }

    getContent() {
        const notes = this.loadNotes();
        return `
            <div class="notepad-container">
                <div class="notepad-sidebar">
                    <div class="notepad-sidebar-header">
                        <button class="np-btn-new-note" title="新建笔记">➕ 新建</button>
                    </div>
                    <div class="notepad-notes-list">
                        ${this.renderNotesList(notes)}
                    </div>
                </div>
                <div class="notepad-editor">
                    <input type="text" class="notepad-title" placeholder="笔记标题..." />
                    <textarea class="notepad-textarea" placeholder="在此输入笔记内容..."></textarea>
                    <div class="notepad-footer">
                        <button class="np-btn-save">💾 保存</button>
                        <button class="np-btn-delete">🗑️ 删除</button>
                        <span class="np-char-count">0 字符</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderNotesList(notes) {
        if (notes.length === 0) {
            return '<div class="np-empty">暂无笔记</div>';
        }
        return notes.map(note => `
            <div class="np-note-item" data-note-id="${note.id}">
                <div class="np-note-title">${note.title || '无标题'}</div>
                <div class="np-note-preview">${note.content.substring(0, 50)}...</div>
                <div class="np-note-date">${new Date(note.modified).toLocaleString('zh-CN')}</div>
            </div>
        `).join('');
    }

    loadNotes() {
        return storage.get('notepad_notes') || [];
    }

    saveNotes(notes) {
        storage.set('notepad_notes', notes);
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const instance = this.instances.get(windowId);
        const titleInput = content.querySelector('.notepad-title');
        const textarea = content.querySelector('.notepad-textarea');
        const charCount = content.querySelector('.np-char-count');
        const btnNewNote = content.querySelector('.np-btn-new-note');
        const btnSave = content.querySelector('.np-btn-save');
        const btnDelete = content.querySelector('.np-btn-delete');

        // 字符计数
        textarea.addEventListener('input', () => {
            charCount.textContent = `${textarea.value.length} 字符`;
        });

        // 新建笔记
        btnNewNote.addEventListener('click', () => {
            this.createNewNote(windowId);
        });

        // 保存笔记
        btnSave.addEventListener('click', () => {
            this.saveCurrentNote(windowId);
        });

        // 删除笔记
        btnDelete.addEventListener('click', () => {
            this.deleteCurrentNote(windowId);
        });

        // 选择笔记
        content.addEventListener('click', (e) => {
            const noteItem = e.target.closest('.np-note-item');
            if (noteItem) {
                const noteId = noteItem.dataset.noteId;
                this.loadNote(windowId, noteId);
            }
        });

        // Ctrl+S 保存
        textarea.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveCurrentNote(windowId);
            }
        });

        // 窗口关闭时清理
        const window = windowManager.windows.get(windowId);
        if (window && window.element) {
            const closeBtn = window.element.querySelector('.window-control-btn.close');
            if (closeBtn) {
                const originalClose = closeBtn.onclick;
                closeBtn.onclick = () => {
                    this.instances.delete(windowId);
                    if (originalClose) originalClose();
                };
            }
        }
    }

    createNewNote(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const newNote = {
            id: Date.now().toString(),
            title: '',
            content: '',
            created: Date.now(),
            modified: Date.now()
        };

        instance.notes.unshift(newNote);
        instance.currentNote = newNote.id;
        this.saveNotes(instance.notes);

        // 更新界面
        const notesList = content.querySelector('.notepad-notes-list');
        notesList.innerHTML = this.renderNotesList(instance.notes);

        const titleInput = content.querySelector('.notepad-title');
        const textarea = content.querySelector('.notepad-textarea');
        titleInput.value = '';
        textarea.value = '';

        notify.success('成功', '新笔记已创建');
    }

    loadNote(windowId, noteId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const note = instance.notes.find(n => n.id === noteId);
        if (!note) return;

        instance.currentNote = noteId;

        const titleInput = content.querySelector('.notepad-title');
        const textarea = content.querySelector('.notepad-textarea');
        const charCount = content.querySelector('.np-char-count');

        titleInput.value = note.title;
        textarea.value = note.content;
        charCount.textContent = `${note.content.length} 字符`;

        // 高亮选中的笔记
        content.querySelectorAll('.np-note-item').forEach(item => {
            item.classList.toggle('active', item.dataset.noteId === noteId);
        });
    }

    saveCurrentNote(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance || !instance.currentNote) {
            notify.warning('提示', '请先选择或创建一个笔记');
            return;
        }

        const titleInput = content.querySelector('.notepad-title');
        const textarea = content.querySelector('.notepad-textarea');

        const note = instance.notes.find(n => n.id === instance.currentNote);
        if (note) {
            note.title = titleInput.value || '无标题';
            note.content = textarea.value;
            note.modified = Date.now();

            this.saveNotes(instance.notes);

            // 更新列表
            const notesList = content.querySelector('.notepad-notes-list');
            notesList.innerHTML = this.renderNotesList(instance.notes);

            notify.success('保存成功', '笔记已保存');
        }
    }

    deleteCurrentNote(windowId) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance || !instance.currentNote) {
            notify.warning('提示', '请先选择一个笔记');
            return;
        }

        if (!confirm('确定要删除这条笔记吗？')) return;

        instance.notes = instance.notes.filter(n => n.id !== instance.currentNote);
        instance.currentNote = null;
        this.saveNotes(instance.notes);

        // 更新界面
        const notesList = content.querySelector('.notepad-notes-list');
        notesList.innerHTML = this.renderNotesList(instance.notes);

        const titleInput = content.querySelector('.notepad-title');
        const textarea = content.querySelector('.notepad-textarea');
        titleInput.value = '';
        textarea.value = '';

        notify.success('成功', '笔记已删除');
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['notepad'] = new NotepadApp();