document.querySelectorAll("[data-assemble]").forEach((element) => {
  const text = element.textContent.trim();
  const assembleDelay = Number(element.dataset.assembleDelay || 0);

  element.setAttribute("aria-label", text);
  element.textContent = "";

  [...text].forEach((letter, index) => {
    const span = document.createElement("span");
    const direction = index % 4;

    span.className = `assemble-letter fly-${direction}`;
    span.textContent = letter === " " ? "\u00a0" : letter;
    span.style.animationDelay = `${assembleDelay + index * 70}ms`;
    span.setAttribute("aria-hidden", "true");
    element.appendChild(span);
  });
});

function sayHello() {
  alert("The Force is strong with this website.");
}
