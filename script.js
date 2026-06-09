document.querySelectorAll("[data-assemble]").forEach((element) => {
  const text = element.textContent.trim();
  element.setAttribute("aria-label", text);
  element.textContent = "";

  [...text].forEach((letter, index) => {
    const span = document.createElement("span");
    const direction = index % 4;

    span.className = `assemble-letter fly-${direction}`;
    span.textContent = letter === " " ? "\u00a0" : letter;
    span.style.animationDelay = `${index * 0.07}s`;
    span.setAttribute("aria-hidden", "true");
    element.appendChild(span);
  });
});

function sayHello() {
  alert("The Force is strong with this website.");
}
