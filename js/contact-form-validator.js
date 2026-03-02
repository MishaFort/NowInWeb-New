document.addEventListener('DOMContentLoaded', () => {
  // Валідація форми Contact
  const validator = new JustValidate('#contact-section-form', {
    errorFieldCssClass: 'input__control--error',
    successFieldCssClass: 'input__control--success',
    errorLabelCssClass: 'just-validate-error-label',
    focusInvalidField: true,
  });

  const ts = document.getElementById('form_ts');
  if (ts) ts.value = String(Date.now());

  const PHONE_LENGTHS_BY_DIAL = {
    '+380': [9],
    '+1': [10],
    '+34': [9],
    '+48': [9],
    '+49': [10, 11],
    '+44': [10, 11],
    '+52': [10],
    '+90': [10],
    '+372': [7, 8],
    '+371': [8],
    '+370': [8],
  };

  const DIAL_CODES_SORTED = Object.keys(PHONE_LENGTHS_BY_DIAL).sort(
    (a, b) => b.length - a.length,
  ); // щоб +380 перевірялось раніше за +3 і т.д.

  function validateFullE164ByDial(value) {
    const v = (value || '').trim();
    if (v === '') return true; // телефон необов'язковий

    // залишаємо тільки + і цифри
    const cleaned = v.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) return false;

    // загальна м'яка перевірка E.164: + і 8..15 цифр
    const totalDigits = cleaned.replace(/\D/g, '').length;
    if (totalDigits < 8 || totalDigits > 15) return false; // м'який фільтр

    // якщо dial не з нашої таблиці — пропускаємо по м'якому правилу
    const dial = DIAL_CODES_SORTED.find(code => cleaned.startsWith(code));
    if (!dial) return true;

    // якщо dial є — тоді вже строгий контроль довжини національної частини
    const national = cleaned.slice(dial.length).replace(/\D/g, '');
    const allowed = PHONE_LENGTHS_BY_DIAL[dial];

    // якщо в таблиці раптом пусто — fallback на м'яке правило
    if (!allowed || allowed.length === 0) return true;

    return allowed.includes(national.length);
  }

  validator
    // Name: обов'язково + любі літери, пробіли/дефіс/апострофи між частинами
    .addField('#user-name-contact', [
      { rule: 'required', errorMessage: '&#8613 Please enter your name' },
      {
        validator: value => {
          const v = value.trim();
          return /^\p{L}[\p{L}\p{M}]{1,49}(?:[ '\-’]\p{L}[\p{L}\p{M}]{1,49})*$/u.test(
            v,
          );
        },
        errorMessage: '&#8613 Please enter a valid name',
      },
    ])

    // Email: обов'язково + валідний формат
    .addField('#user-email-contact', [
      { rule: 'required', errorMessage: '&#8613 Please enter your email' },
      {
        rule: 'email',
        errorMessage: '&#8613 Please enter a valid email address',
      },
    ])

    // Telephone: НЕобов'язковий, але якщо заповнено — має відповідати шаблону
    .addField(
      '#user-tel-full',
      [
        {
          validator: value => validateFullE164ByDial(value),
          errorMessage: '&#8613 Please enter a valid telephone number',
        },
      ],
      {
        errorsContainer: '.input__error--tel',
      },
    )

    // Message: мін/макс довжина
    .addField('#user-message-contact', [
      {
        rule: 'minLength',
        value: 10,
        errorMessage: '&#8613 Message is too short',
      },
      {
        rule: 'maxLength',
        value: 1000,
        errorMessage: '&#8613 Message is too long',
      },
    ]);

  // «Підштовхуємо» подію input для автозаповнення, щоб валідатор бачив зміни
  const autofillHackWhileFocused = selector => {
    const el = document.querySelector(selector);
    if (!el) return;

    let intervalId = null;

    const startWatching = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.activeElement === el && el.value.trim().length > 1) {
          const original = el.value;
          el.value = original + ' ';
          el.value = original;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 500);
    };

    const stopWatching = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    el.addEventListener('focus', startWatching);
    el.addEventListener('click', startWatching);
    el.addEventListener('blur', stopWatching);
  };

  // Можеш лишити тільки name/email, або додати й tel — не завадить
  [
    '#user-name-contact',
    '#user-email-contact',
    '#user-tel-contact',
    '#user-tel-full',
  ].forEach(autofillHackWhileFocused);

  // 3) Сабміт через fetch із прелоадером
  validator.onSuccess(event => {
    event.preventDefault();

    const formElement = document.querySelector('#contact-section-form');
    const formData = new FormData(formElement);

    document.getElementById('preloader').style.display = 'block';

    fetch('send_email.php', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.text())
      .then(() => {
        formElement.reset();
        document.getElementById('preloader').style.display = 'none';

        // форма лишається в DOM, просто ховаємо її візуально
        formElement.style.visibility = 'hidden';
        formElement.style.pointerEvents = 'none';

        // показуємо оверлей з повідомленням
        const thankYouEl = document.getElementById('thank-you-message');
        setTimeout(() => {
          thankYouEl.classList.add(
            'contact-section__thank-you-message--visible',
          );
        }, 200);
      })
      .catch(error => {
        console.error('Error:', error);
        alert(
          'An error occurred while sending your message. Please try again later.',
        );
        document.getElementById('preloader').style.display = 'none';
      });
  });
});
