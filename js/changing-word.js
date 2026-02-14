/* document.addEventListener('DOMContentLoaded', () => {
  const words = [
    'bold...',
    'visual...',
    'iconic...',
    'digital...',
    'pixel-perfect...',
  ];
  const span = document.querySelector('.changing-word');
  const staticText = 'Your brand is ';
  let wordIndex = 0;

  // КРОК 1: надрукувати всю фразу вперше
  function typeFullSentence(sentence, onComplete) {
    let i = 0;
    const typing = setInterval(() => {
      span.textContent += sentence[i];
      i++;
      if (i === sentence.length) {
        clearInterval(typing);
        setTimeout(() => eraseWord(onComplete), 2000);
      }
    }, 100);
  }

  // КРОК 2: стерти лише останнє слово
  function eraseWord(onComplete) {
    let currentText = span.textContent;
    let startIndex = staticText.length;
    let charIndex = currentText.length;

    const erasing = setInterval(() => {
      span.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex === startIndex) {
        clearInterval(erasing);
        onComplete();
      }
    }, 60);
  }

  // КРОК 3: друкувати тільки останнє слово
  function typeChangingWord(word, onComplete) {
    let charIndex = 0;
    span.textContent = staticText;
    const typing = setInterval(() => {
      span.textContent += word[charIndex];
      charIndex++;
      if (charIndex === word.length) {
        clearInterval(typing);
        setTimeout(() => eraseWord(onComplete), 2000);
      }
    }, 100);
  }

  // КРОК 4: керувати циклом
  function cycleWords() {
    wordIndex = (wordIndex + 1) % words.length;
    typeChangingWord(words[wordIndex], cycleWords);
  }

  // ЗАПУСК
  typeFullSentence(staticText + words[0], cycleWords);
}); */

document.addEventListener('DOMContentLoaded', () => {
  const words = [
    'bold...',
    'visual...',
    'iconic...',
    'digital...',
    'pixel-perfect...',
  ];
  const staticSpan = document.querySelector('.static-text');
  const changingSpan = document.querySelector('.changing-word');

  const staticText = 'Your brand is';
  let wordIndex = 0;

  function typeText(targetElement, text, onComplete) {
    let i = 0;
    const typing = setInterval(() => {
      const char = document.createElement('span');
      const letter = document.createTextNode(text[i]);
      char.classList.add('fade-char');
      char.appendChild(letter);
      targetElement.appendChild(char);

      // дворазовий requestAnimationFrame — ключ до fade-in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          char.classList.add('show');
        });
      });

      i++;
      if (i === text.length) {
        clearInterval(typing);
        if (onComplete) setTimeout(onComplete, 400);
      }
    }, 50 + Math.random() * 20);
  }

  function clearChangingSpan() {
    changingSpan.innerHTML = '';
  }

  function eraseWord(onComplete) {
    const chars = changingSpan.querySelectorAll('span');
    let index = chars.length - 1;

    const erasing = setInterval(() => {
      if (index >= 0) {
        chars[index].style.opacity = '0';
        chars[index].style.transform = 'translateY(-8px)';
        index--;
      } else {
        clearInterval(erasing);
        setTimeout(onComplete, 300);
      }
    }, 40);
  }

  function typeChangingWord(word, onComplete) {
    clearChangingSpan();
    let i = 0;
    const typing = setInterval(() => {
      const char = document.createElement('span');
      const letter = document.createTextNode(word[i]);
      char.classList.add('fade-char');
      char.appendChild(letter);
      changingSpan.appendChild(char);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          char.classList.add('show');
        });
      });

      i++;
      if (i === word.length) {
        clearInterval(typing);
        setTimeout(() => eraseWord(onComplete), 1000);
      }
    }, 50 + Math.random() * 20);
  }

  function cycleWords() {
    wordIndex = (wordIndex + 1) % words.length;
    typeChangingWord(words[wordIndex], cycleWords);
  }

  // стартуємо: друк "Your brand is ", потім — перше слово
  typeText(staticSpan, staticText, () => {
    typeChangingWord(words[0], cycleWords);
  });
});
