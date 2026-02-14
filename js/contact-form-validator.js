document.addEventListener('DOMContentLoaded', () => {
  // Валідація форми Contact
  const validator = new JustValidate('#contact-section-form', {
    errorFieldCssClass: 'input__control--error',
    successFieldCssClass: 'input__control--success',
    errorLabelCssClass: 'just-validate-error-label',
    focusInvalidField: true,
  });

  validator
    // Name: обов'язково + латинські літери, пробіли/дефіс між частинами
    .addField('#user-name-contact', [
      { rule: 'required', errorMessage: '&#8613 Please enter your name' },
      {
        rule: 'customRegexp',
        value:
          /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,30}([ -][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,30})*$/u,
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
    .addField('#user-tel-contact', [
      {
        validator: value => {
          const v = value.trim();
          if (v === '') return true; // дозволяємо пусте
          return /[0-9+ ()-]{8,20}/.test(v);
        },
        errorMessage: '&#8613 Please enter a valid telephone number',
      },
    ])

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
  ['#user-name-contact', '#user-email-contact', '#user-tel-contact'].forEach(
    autofillHackWhileFocused
  );

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
            'contact-section__thank-you-message--visible'
          );
        }, 200);
      })
      .catch(error => {
        console.error('Error:', error);
        alert(
          'An error occurred while sending your message. Please try again later.'
        );
        document.getElementById('preloader').style.display = 'none';
      });
  });
});
