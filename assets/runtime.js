(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    const deck = document.querySelector(".deck");
    if (!deck) return;
    const slides = Array.from(deck.querySelectorAll(".slide"));
    if (!slides.length) return;

    let index = 0;
    const bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.innerHTML = "<span></span>";
    document.body.appendChild(bar);
    const fill = bar.querySelector("span");

    const notes = document.createElement("div");
    notes.className = "notes-overlay";
    document.body.appendChild(notes);

    const overview = document.createElement("div");
    overview.className = "overview";
    slides.forEach((slide, i) => {
      const button = document.createElement("button");
      const title = slide.getAttribute("data-title") || slide.querySelector("h1,h2,h3")?.textContent || `Slide ${i + 1}`;
      button.innerHTML = `<strong>${i + 1}</strong><br>${title}`;
      button.addEventListener("click", () => {
        go(i);
        overview.classList.remove("open");
      });
      overview.appendChild(button);
    });
    document.body.appendChild(overview);

    function activeNotes(slide) {
      const node = slide.querySelector(".notes, aside.notes");
      return node ? node.innerHTML : "";
    }

    function retriggerAnimations(slide) {
      slide.querySelectorAll("[data-anim]").forEach((el) => {
        const name = el.getAttribute("data-anim");
        el.classList.remove(`anim-${name}`);
        void el.offsetWidth;
        el.classList.add(`anim-${name}`);
      });
    }

    function go(next) {
      const previousSlide = slides[index];
      window.InspirationFX?.stop(previousSlide);
      index = Math.max(0, Math.min(slides.length - 1, next));
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
        slide.classList.toggle("is-prev", i < index);
      });
      fill.style.width = `${((index + 1) / slides.length) * 100}%`;
      notes.innerHTML = activeNotes(slides[index]);
      history.replaceState(null, "", `#/${index + 1}`);
      retriggerAnimations(slides[index]);
      window.InspirationFX?.start(slides[index]);
    }

    function fromHash() {
      const match = /^#\/(\d+)/.exec(location.hash || "");
      if (match) go(Number(match[1]) - 1);
    }

    document.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (["ArrowRight", " ", "PageDown", "Enter"].includes(event.key)) { go(index + 1); event.preventDefault(); }
      else if (["ArrowLeft", "PageUp", "Backspace"].includes(event.key)) { go(index - 1); event.preventDefault(); }
      else if (event.key === "Home") go(0);
      else if (event.key === "End") go(slides.length - 1);
      else if (event.key === "n" || event.key === "N") notes.classList.toggle("open");
      else if (event.key === "o" || event.key === "O") overview.classList.toggle("open");
      else if (event.key === "f" || event.key === "F") document.documentElement.requestFullscreen?.();
      else if (event.key === "Escape") { notes.classList.remove("open"); overview.classList.remove("open"); }
    });

    window.addEventListener("hashchange", fromHash);
    fromHash();
    go(index);
  });
})();
