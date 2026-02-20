document.querySelectorAll('.hosts button').forEach((button) => {
  button.addEventListener('click', () => {
    button.textContent = 'Opened';
    setTimeout(() => {
      button.textContent = 'Open';
    }, 1000);
  });
});
