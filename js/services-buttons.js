document.addEventListener('DOMContentLoaded', () => {
  const servicesList = document.querySelector('.services-section__list');
  const targetSectionId = '#contact-section';
  const targetSection = document.querySelector(targetSectionId);
  const messageField = document.querySelector('#user-message-contact');

  // Прибираємо href у <button>, якщо лишився
  document
    .querySelectorAll('.services-section__item .button--arrow[href]')
    .forEach(btn => btn.removeAttribute('href'));

  // Перевірка на мобільний пристрій
  const isMobileLike = () =>
    window.matchMedia('(max-width: 1024px)').matches ||
    window.matchMedia('(pointer: coarse)').matches;

  // Делегування кліків по всіх кнопках у картках
  servicesList.addEventListener('click', e => {
    const btn = e.target.closest('.button--arrow');
    if (!btn) return;

    // Отримуємо назву картки
    const card = btn.closest('.services-card');
    const titleEl = card?.querySelector('.services-card__title');
    const title = (titleEl?.textContent || '').replace(/\s+/g, ' ').trim();

    // Формуємо текст: "Title. "
    const prefill = title ? `${title}. ` : '';

    // Затримка для мобіли/деcктопа
    const delay = isMobileLike() ? 250 : 50;

    // Переходимо через deep‑link протокол скролера: ОНОВЛЮЄМО ХЕШ БЕЗ НАТИВНОГО СТРИБКА
    setTimeout(() => {
      if (window.fullpage?.goToId) {
        // Міняємо адресний рядок (бек/форвард/шарінг), але без нативного скролу:
        history.pushState(null, '', targetSectionId);
        window.dispatchEvent(new HashChangeEvent('hashchange')); // скрол зробить full-page-scroll
      } else if (targetSection) {
        // Фолбек (небажано, але раптом): плавний скрол
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, delay);

    // Після невеликої паузи вставляємо текст і ставимо фокус (без прокрутки інпутом)
    setTimeout(() => {
      if (prefill) {
        const needsNL = messageField.value && !/\n$/.test(messageField.value);
        const base = needsNL ? messageField.value + '\n' : messageField.value;
        messageField.value = base + prefill + '\n';
      }

      const len = messageField.value.length;
      messageField.focus({ preventScroll: true });
      messageField.setSelectionRange(len, len);
    }, delay + 10);
  });
});
