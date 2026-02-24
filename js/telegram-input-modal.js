(() => {
  const tg = window.Telegram?.WebApp;
  const IS_TELEGRAM_WEBVIEW =
    !!tg &&
    (/Telegram/i.test(navigator.userAgent) ||
      (typeof tg.initData === 'string' && tg.initData.length > 0));

  if (!IS_TELEGRAM_WEBVIEW) return;

  const TELEGRAM_MODAL_MAX_W = 1140;

  // Глобальний прапор для full-page-scroll.js
  window.__telegramInputModalOpen = false;

  const FORM_SELECTOR = '#contact-section-form';
  const FIELD_SELECTOR = `${FORM_SELECTOR} input, ${FORM_SELECTOR} textarea`;

  const style = document.createElement('style');
  style.textContent = `
    .tg-input-modal {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: none;
      background: #fff;
      color: #111;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }
    .tg-input-modal.is-open {
      display: block;
    }
    .tg-input-modal__wrap {
      height: 100%;
      display: grid;
      grid-template-rows: auto 1fr;
    }
    .tg-input-modal__bar {
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
    .tg-input-modal__btn {
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
    .tg-input-modal__btn--ok {
      font-weight: 700;
    }
    .tg-input-modal__title {
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: #444;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tg-input-modal__body {
      padding: 14px;
      overflow: auto;
      background: #fff;
    }
    .tg-input-modal__editor,
    .tg-input-modal__textarea {
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
    .tg-input-modal__editor {
      min-height: 48px;
    }
    .tg-input-modal__textarea {
      min-height: 42vh;
      resize: vertical;
    }
    html.tg-input-modal-open,
    html.tg-input-modal-open body {
      overflow: hidden;
      touch-action: none;
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.className = 'tg-input-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="tg-input-modal__wrap">
      <div class="tg-input-modal__bar">
        <button type="button" class="tg-input-modal__btn" data-action="cancel">Cancel</button>
        <div class="tg-input-modal__title">Edit field</div>
        <button type="button" class="tg-input-modal__btn tg-input-modal__btn--ok" data-action="ok">OK</button>
      </div>
      <div class="tg-input-modal__body">
        <div data-slot="editor"></div>
        </div>
    </div>
  `;
  document.body.appendChild(modal);

  const titleEl = modal.querySelector('.tg-input-modal__title');
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
      el.className = 'tg-input-modal__textarea';
      el.rows = Math.max(4, Number(field.getAttribute('rows')) || 6);
    } else {
      el.className = 'tg-input-modal__editor';

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
    document.documentElement.classList.add('tg-input-modal-open');
    window.__telegramInputModalOpen = true;

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
    document.documentElement.classList.remove('tg-input-modal-open');
    window.__telegramInputModalOpen = false;

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

  // Перехоплюємо саме поля форми контактів у Telegram
  document.addEventListener(
    'pointerdown',
    e => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      if (window.innerWidth >= TELEGRAM_MODAL_MAX_W) return;

      const field = target.closest(FIELD_SELECTOR);
      if (!field) return;
      if (field.disabled || field.readOnly) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      openModalForField(field);
    },
    true,
  );
})();
