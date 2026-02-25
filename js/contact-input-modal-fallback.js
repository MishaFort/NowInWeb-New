(() => {
  const FORM_SELECTOR = '#contact-section-form';
  const FIELD_SELECTOR = `${FORM_SELECTOR} input, ${FORM_SELECTOR} textarea`;

  const INPUT_MODAL_MAX_W = 1140;

  // full-page-scroll.js читає цей прапор (чи модалка зараз відкрита)
  window.__contactInputModalOpen = false;

  // режим fallback (зараз вимкнений; увімкнемо з full-page-scroll.js після детекції стрибка)
  window.__contactInputModalModeEnabled =
    sessionStorage.getItem('contactInputModalMode') === '1';

  function isContactInputModalModeEnabled() {
    return (
      window.__contactInputModalModeEnabled === true &&
      window.innerWidth < INPUT_MODAL_MAX_W
    );
  }

  const style = document.createElement('style');
  style.textContent = `
    .input-modal {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: none;
      background: #fff;
      color: #111;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    .input-modal.is-open {
      display: block;
    }
    .input-modal__wrap {
      height: 100%;
      display: grid;
      grid-template-rows: auto 1fr;
    }
    .input-modal__bar {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 12px 14px;
      border-bottom: 1px solid #e6e6e6;
      background: #fff;
      position: sticky;
      top: 0;
    }
    .input-modal__btn {
      appearance: none;
      border: 0;
      background: transparent;
      color: #0a84ff;
      font-size: 16px;
      line-height: 1;
      padding: 8px 6px;
      min-width: 72px;
      min-height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .input-modal__btn--ok {
      font-weight: 700;
    }
    .input-modal__title {
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: #444;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .input-modal__body {
      padding: 14px;
      overflow: auto;
      background: #fff;
    }
    .input-modal__editor,
    .input-modal__textarea {
      width: 100%;
      border: 1px solid #dcdcdc;
      border-radius: 12px;
      background: #fff;
      color: #111;
      padding: 14px 16px;
      font: inherit;
      font-size: 16px;
      line-height: 1.4;
      outline: none;
      box-sizing: border-box;
    }
    .input-modal__editor {
      min-height: 48px;
    }
    .input-modal__textarea {
      min-height: 42vh;
      resize: vertical;
    }
    html.input-modal-open,
    html.input-modal-open body {
      overflow: hidden;
      touch-action: none;
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.className = 'input-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="input-modal__wrap">
      <div class="input-modal__bar">
        <button type="button" class="input-modal__btn" data-action="cancel">Cancel</button>
        <div class="input-modal__title">Edit field</div>
        <button type="button" class="input-modal__btn input-modal__btn--ok" data-action="ok">OK</button>
      </div>
      <div class="input-modal__body">
        <div data-slot="editor"></div>
        </div>
    </div>
  `;
  document.body.appendChild(modal);

  const titleEl = modal.querySelector('.input-modal__title');
  const editorSlot = modal.querySelector('[data-slot="editor"]');
  const cancelBtn = modal.querySelector('[data-action="cancel"]');
  const okBtn = modal.querySelector('[data-action="ok"]');

  let sourceField = null;
  let editorField = null;

  function getFieldLabel(field) {
    if (!field) return 'Edit field';
    const label =
      (field.id &&
        document.querySelector(`label[for="${field.id}"]`)?.textContent) ||
      field.getAttribute('aria-label') ||
      field.name ||
      field.placeholder ||
      'Edit field';
    return String(label).trim() || 'Edit field';
  }

  function createEditorFor(field) {
    const isTextarea = field.tagName === 'TEXTAREA';
    const el = document.createElement(isTextarea ? 'textarea' : 'input');

    if (isTextarea) {
      el.className = 'input-modal__textarea';
      el.rows = Math.max(4, Number(field.getAttribute('rows')) || 6);
    } else {
      el.className = 'input-modal__editor';

      const allowedTypes = new Set([
        'text',
        'email',
        'tel',
        'number',
        'url',
        'search',
        'password',
      ]);
      const srcType = (field.getAttribute('type') || 'text').toLowerCase();
      el.type = allowedTypes.has(srcType) ? srcType : 'text';
    }

    el.value = field.value || '';
    el.placeholder = field.placeholder || '';
    el.autocomplete = field.autocomplete || 'off';

    const inputMode = field.getAttribute('inputmode');
    if (inputMode) el.setAttribute('inputmode', inputMode);

    const maxLength = field.getAttribute('maxlength');
    if (maxLength) el.setAttribute('maxlength', maxLength);

    return el;
  }

  function openModalForField(field) {
    sourceField = field;
    editorField = createEditorFor(field);

    editorSlot.innerHTML = '';
    editorSlot.appendChild(editorField);

    titleEl.textContent = getFieldLabel(field);

    modal.classList.add('is-open');
    document.documentElement.classList.add('input-modal-open');
    window.__contactInputModalOpen = true;

    requestAnimationFrame(() => {
      editorField.focus({ preventScroll: true });
      const len = editorField.value.length;
      try {
        if (typeof editorField.setSelectionRange === 'function') {
          editorField.setSelectionRange(len, len);
        }
      } catch {}
    });
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('input-modal-open');
    window.__contactInputModalOpen = false;

    editorSlot.innerHTML = '';
    sourceField = null;
    editorField = null;
  }

  function commitAndClose() {
    if (!sourceField || !editorField) {
      closeModal();
      return;
    }

    const nextValue = editorField.value;
    if (sourceField.value !== nextValue) {
      sourceField.value = nextValue;
      sourceField.dispatchEvent(new Event('input', { bubbles: true }));
      sourceField.dispatchEvent(new Event('change', { bubbles: true }));
    }

    sourceField.blur();
    closeModal();
  }

  function enableContactInputModalMode() {
    window.__contactInputModalModeEnabled = true;
    try {
      sessionStorage.setItem('contactInputModalMode', '1');
    } catch {}
  }

  function disableContactInputModalMode() {
    window.__contactInputModalModeEnabled = false;
    try {
      sessionStorage.removeItem('contactInputModalMode');
    } catch {}
  }

  function openContactInputModalForField(field) {
    if (!(field instanceof Element)) return false;

    const matchedField = field.closest(FIELD_SELECTOR);
    if (!matchedField) return false;
    if (matchedField.disabled || matchedField.readOnly) return false;
    if (window.innerWidth >= INPUT_MODAL_MAX_W) return false;

    enableContactInputModalMode();

    if (window.__contactInputModalOpen) return true;
    openModalForField(matchedField);
    return true;
  }

  window.contactInputModalFallback = {
    enableMode: enableContactInputModalMode,
    disableMode: disableContactInputModalMode,
    isModeEnabled: () => isContactInputModalModeEnabled(),
    openForField: openContactInputModalForField,
  };

  cancelBtn.addEventListener('click', () => closeModal());
  okBtn.addEventListener('click', () => commitAndClose());

  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }

    if (
      e.key === 'Enter' &&
      editorField &&
      editorField.tagName !== 'TEXTAREA'
    ) {
      e.preventDefault();
      commitAndClose();
    }
  });

  let lastInterceptAt = 0;

  function interceptContactFieldTap(e) {
    if (!isContactInputModalModeEnabled()) return;
    if (window.__contactInputModalOpen) return;

    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    const field = target.closest(FIELD_SELECTOR);
    if (!field) return;
    if (field.disabled || field.readOnly) return;

    // На деяких девайсах приходять і touchstart, і pointerdown
    const now = Date.now();
    if (now - lastInterceptAt < 250) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
      }
      return;
    }
    lastInterceptAt = now;

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation();
    }

    openModalForField(field);
  }

  document.addEventListener('pointerdown', interceptContactFieldTap, true);
  document.addEventListener('touchstart', interceptContactFieldTap, {
    capture: true,
    passive: false,
  });
})();
