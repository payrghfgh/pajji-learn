const items = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.14 }
);

items.forEach((el, i) => {
  el.style.transitionDelay = `${i * 90}ms`;
  observer.observe(el);
});
