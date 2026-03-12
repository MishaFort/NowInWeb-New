(() => {
  const FORM_SELECTOR = '#contact-section-form';
  const FIELD_SELECTOR = `${FORM_SELECTOR} input, ${FORM_SELECTOR} textarea`;

  const INPUT_MODAL_MAX_W = 1140;
  const INPUT_MODAL_CLOSE_PRE_DELAY_MS = 90;
  const INPUT_MODAL_CLOSE_ANIM_MS = 300;

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
      display: block;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      background: rgba(0, 0, 0, 0.12);
      color: #111;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      transition:
        opacity 220ms cubic-bezier(0.4, 0, 0.2, 1),
        visibility 0s linear 220ms;
    }
    .input-modal.is-open {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transition:
      opacity 220ms cubic-bezier(0, 0, 0.2, 1),
      visibility 0s linear 0s;
    }
    .input-modal__wrap {
      height: 100%;
      display: grid;
      grid-template-rows: auto 1fr;
      background: #fff;
      transform: translate3d(0, 100%, 0);
      will-change: transform;
      transition: transform 300ms cubic-bezier(0, 0, 0.2, 1);
    }
    .input-modal.is-open .input-modal__wrap {
      transform: translate3d(0, 0, 0);
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
      background: #3a0080;
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
    @media (prefers-reduced-motion: reduce) {
      .input-modal,
      .input-modal__wrap {
        transition: none;
    }
  }`;

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
  let modalCleanupTmr = null;
  let modalCloseStartTmr = null;
  let modalIsClosing = false;
  let modalHistoryArmed = false;
  let suppressNextModalPopstate = false;

  function isCountrySearchField(field) {
    return !!field?.classList?.contains('phone-input-wrapper__search-input');
  }

  function getFieldLabel(field) {
    if (!field) return 'Edit field';
    if (isCountrySearchField(field)) return 'Choose country';

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
    clearTimeout(modalCleanupTmr);

    clearTimeout(modalCloseStartTmr);
    modalIsClosing = false;

    if (!modalHistoryArmed) {
      try {
        history.pushState({ __contactInputModal: true }, '', location.href);
        modalHistoryArmed = true;
      } catch {}
    }

    sourceField = field;
    editorField = createEditorFor(field);

    editorSlot.innerHTML = '';
    editorSlot.appendChild(editorField);

    titleEl.textContent = getFieldLabel(field);

    modal.classList.add('is-open');
    document.documentElement.classList.add('input-modal-open');
    window.__contactInputModalOpen = true;
    window.dispatchEvent(new CustomEvent('contact-input-modal:open'));

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

  function closeModal({ skipHistoryBack = false } = {}) {
    if (!modal.classList.contains('is-open')) return;
    if (modalIsClosing) return;

    modalIsClosing = true;

    // Даємо full-page-scroll шанс зафіксувати contact під модалкою
    window.dispatchEvent(new CustomEvent('contact-input-modal:before-close'));

    // Підтримка кнопки/жесту "Назад"
    if (!skipHistoryBack && modalHistoryArmed) {
      suppressNextModalPopstate = true;
      try {
        history.back();
      } catch {}
    }

    clearTimeout(modalCloseStartTmr);
    modalCloseStartTmr = setTimeout(() => {
      modal.classList.remove('is-open');
      document.documentElement.classList.remove('input-modal-open');
      window.__contactInputModalOpen = false;

      window.dispatchEvent(new CustomEvent('contact-input-modal:close'));

      clearTimeout(modalCleanupTmr);
      modalCleanupTmr = setTimeout(() => {
        if (window.__contactInputModalOpen) return;
        editorSlot.innerHTML = '';
        sourceField = null;
        editorField = null;
        modalIsClosing = false;
      }, INPUT_MODAL_CLOSE_ANIM_MS);
    }, INPUT_MODAL_CLOSE_PRE_DELAY_MS);
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

  window.addEventListener('popstate', () => {
    if (suppressNextModalPopstate) {
      suppressNextModalPopstate = false;
      modalHistoryArmed = false;
      return;
    }

    if (!modal.classList.contains('is-open') && !modalIsClosing) return;

    modalHistoryArmed = false;
    closeModal({ skipHistoryBack: true });
  });

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

  const TAP_MOVE_TOLERANCE_PX = 14;
  const TAP_MAX_DURATION_MS = 320;

  let pendingTouchField = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartAt = 0;
  let touchMoved = false;

  function getFieldFromEventTarget(target) {
    if (!(target instanceof Element)) return null;
    const field = target.closest(FIELD_SELECTOR);
    if (!field) return null;
    if (field.disabled || field.readOnly) return null;
    return field;
  }

  function openModalFromUserTap(e, field) {
    if (!isContactInputModalModeEnabled()) return;
    if (window.__contactInputModalOpen) return;

    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation();
    }

    openModalForField(field);
  }

  // Миша/стилус: одразу відкриваємо модалку
  document.addEventListener(
    'pointerdown',
    e => {
      if (!isContactInputModalModeEnabled()) return;
      if (window.__contactInputModalOpen) return;

      // Для touch-подій працюємо через touchstart/touchend (щоб відрізнити свайп)
      if (e.pointerType === 'touch') return;

      const field = getFieldFromEventTarget(e.target);
      if (!field) return;

      openModalFromUserTap(e, field);
    },
    true,
  );

  // Touch: спочатку тільки запам'ятовуємо кандидат на тап
  document.addEventListener(
    'touchstart',
    e => {
      if (!isContactInputModalModeEnabled()) return;
      if (window.__contactInputModalOpen) return;

      const field = getFieldFromEventTarget(e.target);
      if (!field) return;

      const t = e.touches && e.touches[0];
      if (!t) return;

      pendingTouchField = field;
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartAt = Date.now();
      touchMoved = false;
    },
    { capture: true, passive: true },
  );

  // Якщо рух є — це свайп, не відкривати модалку
  document.addEventListener(
    'touchmove',
    e => {
      if (!pendingTouchField) return;
      const t = e.touches && e.touches[0];
      if (!t) return;

      const dx = Math.abs(t.clientX - touchStartX);
      const dy = Math.abs(t.clientY - touchStartY);
      if (dx > TAP_MOVE_TOLERANCE_PX || dy > TAP_MOVE_TOLERANCE_PX) {
        touchMoved = true;
      }
    },
    { capture: true, passive: true },
  );

  // Відкриваємо модалку тільки якщо це був короткий тап без руху
  document.addEventListener(
    'touchend',
    e => {
      if (!pendingTouchField) return;

      const field = pendingTouchField;
      const duration = Date.now() - touchStartAt;
      const moved = touchMoved;

      pendingTouchField = null;
      touchMoved = false;

      if (moved) return;
      if (duration > TAP_MAX_DURATION_MS) return;

      openModalFromUserTap(e, field);
    },
    { capture: true, passive: false },
  );

  document.addEventListener(
    'touchcancel',
    () => {
      pendingTouchField = null;
      touchMoved = false;
    },
    { capture: true, passive: true },
  );

  document.addEventListener(
    'focusin',
    e => {
      if (!isContactInputModalModeEnabled()) return;
      if (window.__contactInputModalOpen) return;

      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      const field = target.closest(FIELD_SELECTOR);
      if (!field) return;
      if (field.disabled || field.readOnly) return;

      // Ловимо programmatic focus (наприклад, JustValidate на submit)
      requestAnimationFrame(() => {
        if (!isContactInputModalModeEnabled()) return;
        if (window.__contactInputModalOpen) return;
        if (document.activeElement !== field) return;

        field.blur();
        openModalForField(field);
      });
    },
    true,
  );
})();
