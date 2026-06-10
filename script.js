window.addEventListener("load", () => {
  const intro = document.querySelector(".cinematic-intro");

  if (intro) {
    window.setTimeout(() => {
      intro.remove();
    }, 7400);
  }
});

function sayHello() {
  window.location.href = "mailto:baidaev.rasul00@gmail.com?subject=Contact%20from%20Website";
}
