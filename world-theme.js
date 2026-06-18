(function () {
  try {
    document.documentElement.dataset.world = localStorage.getItem("rasultechWorld") || "space";
  } catch (error) {
    document.documentElement.dataset.world = "space";
  }
}());
