window.addEventListener("load", () => {
  const intro = document.querySelector(".cinematic-intro");

  if (intro) {
    window.setTimeout(() => {
      intro.remove();
    }, 6400);
  }
});

function sayHello() {
  alert("Hello! Your website is working.");
}
