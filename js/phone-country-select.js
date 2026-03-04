document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.phone-input-wrapper');
  if (!wrapper) return;

  const btn = wrapper.querySelector('.phone-input-wrapper__country-btn');
  const flagEl = wrapper.querySelector('.phone-input-wrapper__flag');
  const dialEl = wrapper.querySelector('.phone-input-wrapper__dial');
  const dropdown = wrapper.querySelector('.phone-input-wrapper__dropdown');
  const list = wrapper.querySelector('.phone-input-wrapper__list');
  const searchInput = wrapper.querySelector(
    '.phone-input-wrapper__search-input',
  );

  const numberInput = wrapper.querySelector('#user-tel-contact');
  const fullHidden = wrapper.querySelector('#user-tel-full');

  window.__phoneCountryDropdownOpen = false;

  // 100 країн
  const COUNTRIES = [
    { iso: 'UA', name: 'Ukraine', dial: '+380', flag: '🇺🇦' },
    { iso: 'AF', name: 'Afghanistan', dial: '+93', flag: '🇦🇫' },
    { iso: 'AL', name: 'Albania', dial: '+355', flag: '🇦🇱' },
    { iso: 'DZ', name: 'Algeria', dial: '+213', flag: '🇩🇿' },
    { iso: 'AD', name: 'Andorra', dial: '+376', flag: '🇦🇩' },
    { iso: 'AO', name: 'Angola', dial: '+244', flag: '🇦🇴' },
    { iso: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷' },
    { iso: 'AM', name: 'Armenia', dial: '+374', flag: '🇦🇲' },
    { iso: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
    { iso: 'AT', name: 'Austria', dial: '+43', flag: '🇦🇹' },
    { iso: 'AZ', name: 'Azerbaijan', dial: '+994', flag: '🇦🇿' },
    { iso: 'BH', name: 'Bahrain', dial: '+973', flag: '🇧🇭' },
    { iso: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
    { iso: 'BY', name: 'Belarus', dial: '+375', flag: '🇧🇾' },
    { iso: 'BE', name: 'Belgium', dial: '+32', flag: '🇧🇪' },
    { iso: 'BZ', name: 'Belize', dial: '+501', flag: '🇧🇿' },
    { iso: 'BJ', name: 'Benin', dial: '+229', flag: '🇧🇯' },
    { iso: 'BT', name: 'Bhutan', dial: '+975', flag: '🇧🇹' },
    { iso: 'BO', name: 'Bolivia', dial: '+591', flag: '🇧🇴' },
    { iso: 'BA', name: 'Bosnia and Herzegovina', dial: '+387', flag: '🇧🇦' },
    { iso: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
    { iso: 'BG', name: 'Bulgaria', dial: '+359', flag: '🇧🇬' },
    { iso: 'KH', name: 'Cambodia', dial: '+855', flag: '🇰🇭' },
    { iso: 'CM', name: 'Cameroon', dial: '+237', flag: '🇨🇲' },
    { iso: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
    { iso: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱' },
    { iso: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
    { iso: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴' },
    { iso: 'CR', name: 'Costa Rica', dial: '+506', flag: '🇨🇷' },
    { iso: 'HR', name: 'Croatia', dial: '+385', flag: '🇭🇷' },
    { iso: 'CU', name: 'Cuba', dial: '+53', flag: '🇨🇺' },
    { iso: 'CY', name: 'Cyprus', dial: '+357', flag: '🇨🇾' },
    { iso: 'CZ', name: 'Czech Republic', dial: '+420', flag: '🇨🇿' },
    { iso: 'DK', name: 'Denmark', dial: '+45', flag: '🇩🇰' },
    { iso: 'DO', name: 'Dominican Republic', dial: '+1', flag: '🇩🇴' },
    { iso: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨' },
    { iso: 'EG', name: 'Egypt', dial: '+20', flag: '🇪🇬' },
    { iso: 'SV', name: 'El Salvador', dial: '+503', flag: '🇸🇻' },
    { iso: 'EE', name: 'Estonia', dial: '+372', flag: '🇪🇪' },
    { iso: 'FI', name: 'Finland', dial: '+358', flag: '🇫🇮' },
    { iso: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
    { iso: 'GE', name: 'Georgia', dial: '+995', flag: '🇬🇪' },
    { iso: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
    { iso: 'GH', name: 'Ghana', dial: '+233', flag: '🇬🇭' },
    { iso: 'GR', name: 'Greece', dial: '+30', flag: '🇬🇷' },
    { iso: 'GT', name: 'Guatemala', dial: '+502', flag: '🇬🇹' },
    { iso: 'HK', name: 'Hong Kong', dial: '+852', flag: '🇭🇰' },
    { iso: 'HU', name: 'Hungary', dial: '+36', flag: '🇭🇺' },
    { iso: 'IS', name: 'Iceland', dial: '+354', flag: '🇮🇸' },
    { iso: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
    { iso: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
    { iso: 'IR', name: 'Iran', dial: '+98', flag: '🇮🇷' },
    { iso: 'IQ', name: 'Iraq', dial: '+964', flag: '🇮🇶' },
    { iso: 'IE', name: 'Ireland', dial: '+353', flag: '🇮🇪' },
    { iso: 'IL', name: 'Israel', dial: '+972', flag: '🇮🇱' },
    { iso: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
    { iso: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
    { iso: 'JO', name: 'Jordan', dial: '+962', flag: '🇯🇴' },
    { iso: 'KZ', name: 'Kazakhstan', dial: '+7', flag: '🇰🇿' },
    { iso: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
    { iso: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
    { iso: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
    { iso: 'KG', name: 'Kyrgyzstan', dial: '+996', flag: '🇰🇬' },
    { iso: 'LA', name: 'Laos', dial: '+856', flag: '🇱🇦' },
    { iso: 'LV', name: 'Latvia', dial: '+371', flag: '🇱🇻' },
    { iso: 'LB', name: 'Lebanon', dial: '+961', flag: '🇱🇧' },
    { iso: 'LT', name: 'Lithuania', dial: '+370', flag: '🇱🇹' },
    { iso: 'LU', name: 'Luxembourg', dial: '+352', flag: '🇱🇺' },
    { iso: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
    { iso: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
    { iso: 'MD', name: 'Moldova', dial: '+373', flag: '🇲🇩' },
    { iso: 'MN', name: 'Mongolia', dial: '+976', flag: '🇲🇳' },
    { iso: 'ME', name: 'Montenegro', dial: '+382', flag: '🇲🇪' },
    { iso: 'MA', name: 'Morocco', dial: '+212', flag: '🇲🇦' },
    { iso: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
    { iso: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
    { iso: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
    { iso: 'NO', name: 'Norway', dial: '+47', flag: '🇳🇴' },
    { iso: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
    { iso: 'PA', name: 'Panama', dial: '+507', flag: '🇵🇦' },
    { iso: 'PE', name: 'Peru', dial: '+51', flag: '🇵🇪' },
    { iso: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
    { iso: 'PL', name: 'Poland', dial: '+48', flag: '🇵🇱' },
    { iso: 'PT', name: 'Portugal', dial: '+351', flag: '🇵🇹' },
    { iso: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
    { iso: 'RO', name: 'Romania', dial: '+40', flag: '🇷🇴' },
    { iso: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
    { iso: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
    { iso: 'RS', name: 'Serbia', dial: '+381', flag: '🇷🇸' },
    { iso: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
    { iso: 'SK', name: 'Slovakia', dial: '+421', flag: '🇸🇰' },
    { iso: 'SI', name: 'Slovenia', dial: '+386', flag: '🇸🇮' },
    { iso: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
    { iso: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
    { iso: 'SE', name: 'Sweden', dial: '+46', flag: '🇸🇪' },
    { iso: 'CH', name: 'Switzerland', dial: '+41', flag: '🇨🇭' },
    { iso: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
    { iso: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
    { iso: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
    { iso: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
    { iso: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
    { iso: 'UY', name: 'Uruguay', dial: '+598', flag: '🇺🇾' },
    { iso: 'UZ', name: 'Uzbekistan', dial: '+998', flag: '🇺🇿' },
    { iso: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪' },
    { iso: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
  ];

  function renderList(items) {
    list.innerHTML = '';
    items.forEach(c => {
      const li = document.createElement('li');
      li.className = 'phone-input-wrapper__item';
      li.setAttribute('role', 'option');
      li.dataset.iso = c.iso;

      li.innerHTML = `
        <span aria-hidden="true">${c.flag}</span>
        <span class="phone-input-wrapper__name">${c.name}</span>
        <span class="phone-input-wrapper__code">${c.dial}</span>
      `;

      li.addEventListener('click', () => {
        setCountry(c);
        closeDropdown();
        syncFullPhone();

        if (
          window.__contactInputModalModeEnabled !== true &&
          window.__contactInputModalOpen !== true
        ) {
          try {
            numberInput.focus({ preventScroll: true });
          } catch {
            numberInput.focus();
          }
        }
      });

      list.appendChild(li);
    });
  }

  function setCountry(c) {
    flagEl.textContent = c.flag;
    dialEl.textContent = c.dial;
    wrapper.dataset.iso = c.iso;
    wrapper.dataset.dial = c.dial;
  }

  function openDropdown() {
    dropdown.hidden = false;
    window.__phoneCountryDropdownOpen = true;
    btn.setAttribute('aria-expanded', 'true');
    searchInput.value = '';
    renderList(COUNTRIES);
    setTimeout(() => {
      if (window.__contactInputModalModeEnabled === true) return;
      searchInput.focus();
    }, 0);
  }

  function closeDropdown() {
    dropdown.hidden = true;
    window.__phoneCountryDropdownOpen = false;
    btn.setAttribute('aria-expanded', 'false');
  }

  function toggleDropdown() {
    if (dropdown.hidden) openDropdown();
    else closeDropdown();
  }

  function normalizePhoneNumber(v) {
    // лишаємо + тільки якщо користувач вставив номер з +
    // але для "local" поля зазвичай + не потрібен
    return v.replace(/[^\d]/g, '');
  }

  function syncFullPhone() {
    if (!fullHidden) return;

    const dial = wrapper.dataset.dial || dialEl.textContent.trim();
    const local = normalizePhoneNumber(numberInput.value);
    fullHidden.value = local ? `${dial}${local}` : '';
    fullHidden.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // default country
  const defaultIso = (wrapper.dataset.defaultIso || 'UA').toUpperCase();
  const found = COUNTRIES.find(c => c.iso === defaultIso) || COUNTRIES[0];
  setCountry(found);
  syncFullPhone();

  btn.addEventListener('click', toggleDropdown);

  // пошук
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = COUNTRIES.filter(c =>
      `${c.name} ${c.iso} ${c.dial}`.toLowerCase().includes(q),
    );
    renderList(filtered);
  });

  // закрити по кліку зовні
  document.addEventListener('click', e => {
    if (window.__contactInputModalOpen === true) return;
    if (!wrapper.contains(e.target)) closeDropdown();
  });

  // ESC закриває
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDropdown();
  });

  // оновлювати full phone при введенні номера
  numberInput.addEventListener('input', syncFullPhone);
  numberInput.addEventListener('blur', syncFullPhone);
});
