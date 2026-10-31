(function () {
  var openBtn = document.getElementById("vw200-intro-open");
  var modal = document.getElementById("vw200-intro-modal");
  var video = document.getElementById("vw200-intro-video");
  if (!openBtn || !modal || !video) return;

  var lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    try {
      video.currentTime = 0;
      var p = video.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (e) {}
    var closeBtn = modal.querySelector(".video-modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    try { video.pause(); } catch (e) {}
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  openBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    openModal();
  });

  modal.addEventListener("click", function (e) {
    if (e.target && e.target.hasAttribute("data-close")) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });
})();
