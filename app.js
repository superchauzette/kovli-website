const observeReveals = () => {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));
};

const lazyLoadSpotify = () => {
  const embedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const iframe = entry.target;
        if (!iframe.src && iframe.dataset.src) iframe.src = iframe.dataset.src;
        embedObserver.unobserve(iframe);
      });
    },
    { rootMargin: "480px 0px" }
  );

  document.querySelectorAll(".deferred-embed").forEach((frame) => embedObserver.observe(frame));
};

const bindExclusiveSpotifyPlayback = () => {
  const embeds = Array.from(document.querySelectorAll(".deferred-embed"));
  if (embeds.length < 2) return;

  const resetEmbed = (iframe) => {
    const embedSrc = iframe.dataset.src || iframe.src;
    if (!embedSrc || iframe.src === "about:blank") return;

    iframe.src = "about:blank";
    window.setTimeout(() => {
      iframe.src = embedSrc;
    }, 40);
  };

  const stopOtherEmbeds = (activeIframe) => {
    embeds.forEach((iframe) => {
      if (iframe === activeIframe || !iframe.src) return;
      resetEmbed(iframe);
    });
  };

  window.addEventListener("blur", () => {
    const activeIframe = document.activeElement;
    if (activeIframe instanceof HTMLIFrameElement && embeds.includes(activeIframe)) {
      stopOtherEmbeds(activeIframe);
    }
  });
};

const bindTrackVisuals = () => {
  document.querySelectorAll(".track-visual-trigger").forEach((trigger) => {
    trigger.addEventListener(
      "click",
      () => {
        const videoSrc = trigger.dataset.video;
        if (!videoSrc) return;

        const video = document.createElement("video");
        video.className = "track-visual";
        video.controls = true;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "metadata";
        if (trigger.dataset.poster) video.poster = trigger.dataset.poster;

        const source = document.createElement("source");
        source.src = videoSrc;
        source.type = "video/mp4";
        video.appendChild(source);

        trigger.replaceWith(video);
        video.play().catch(() => {});
      },
      { once: true }
    );
  });
};

const generateTrackPosters = () => {
  const triggers = document.querySelectorAll('.track-visual-trigger[data-poster-from-video="true"]');
  if (!triggers.length) return;

  triggers.forEach((trigger) => {
    const videoSrc = trigger.dataset.video;
    const posterImage = trigger.querySelector('.track-visual-poster');
    if (!videoSrc || !posterImage) return;

    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    video.playsInline = true;
    video.src = videoSrc;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    const capture = () => {
      if (!video.videoWidth || !video.videoHeight) {
        cleanup();
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        posterImage.src = canvas.toDataURL('image/jpeg', 0.82);
      } catch (error) {
        // Ignore and keep fallback poster if the browser blocks canvas export.
      }

      cleanup();
    };

    video.addEventListener('loadeddata', () => {
      const targetTime = Math.min(0.2, Math.max(0, (video.duration || 0.2) - 0.01));
      if (targetTime <= 0) {
        capture();
        return;
      }

      video.addEventListener('seeked', capture, { once: true });
      video.currentTime = targetTime;
    }, { once: true });

    video.addEventListener('error', cleanup, { once: true });
  });
};

const bindTrackAccordion = () => {
  const toggles = document.querySelectorAll(".track-toggle");
  if (!toggles.length) return;

  toggles.forEach((toggle) => {
    const body = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!body) return;
    const card = toggle.closest(".track-card");

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      body.hidden = isOpen;
      card?.classList.toggle("is-open", !isOpen);

      if (!isOpen) {
        // Load the Spotify embed only the first time the row opens.
        body.querySelectorAll(".deferred-embed").forEach((frame) => {
          if (!frame.src && frame.dataset.src) frame.src = frame.dataset.src;
        });
      }
    });
  });
};

const bindDiaryMore = () => {
  const diarySection = document.getElementById("kovli");
  const moreButton = document.getElementById("diary-more");
  if (!diarySection || !moreButton) return;

  moreButton.addEventListener("click", () => {
    const isExpanded = diarySection.classList.toggle("diary-expanded");
    moreButton.textContent = isExpanded
      ? moreButton.dataset.labelLess || moreButton.textContent
      : moreButton.dataset.labelMore || moreButton.textContent;
  });
};

const bindMobileNav = () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;
  const openLabel = toggle.dataset.labelOpen || "Open navigation";
  const closeLabel = toggle.dataset.labelClose || "Close navigation";

  const closeNav = () => {
    document.body.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", openLabel);
  };

  const openNav = () => {
    document.body.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", closeLabel);
  };

  toggle.addEventListener("click", () => {
    if (document.body.classList.contains("nav-open")) closeNav();
    else openNav();
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("nav-open")) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    closeNav();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 720) closeNav();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });
};

const bindClaraLightbox = () => {
  const dialog = document.getElementById("image-lightbox");
  const dialogImage = document.getElementById("image-lightbox-asset");
  const dialogVideo = document.getElementById("image-lightbox-video");
  const dialogCaption = document.getElementById("image-lightbox-caption");
  const closeButton = dialog?.querySelector(".image-lightbox-close");
  const triggers = document.querySelectorAll(".gallery-lightbox-trigger");
  if (!dialog || !dialogImage || !dialogCaption || !closeButton || !triggers.length) return;

  const resetVideo = () => {
    if (!dialogVideo) return;
    dialogVideo.pause();
    dialogVideo.removeAttribute("src");
    dialogVideo.load();
    dialogVideo.hidden = true;
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      dialogCaption.textContent = trigger.dataset.caption || "";
      if (trigger.dataset.video && dialogVideo) {
        // Vidéo : son activé dans la lightbox
        dialogImage.hidden = true;
        dialogImage.src = "";
        dialogVideo.hidden = false;
        dialogVideo.src = trigger.dataset.video;
        dialogVideo.currentTime = 0;
        dialog.showModal();
        dialogVideo.play().catch(() => {});
      } else {
        resetVideo();
        dialogImage.hidden = false;
        dialogImage.src = trigger.dataset.image || "";
        dialogImage.alt = trigger.querySelector("img")?.alt || "Gallery image";
        dialog.showModal();
      }
    });
  });

  closeButton.addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    resetVideo();
    dialogImage.src = "";
  });
};

const bindLanguagePreference = () => {
  document.querySelectorAll('a[hreflang][lang]').forEach((link) => {
    link.addEventListener("click", () => {
      const locale = link.getAttribute("lang");
      if (!locale) return;

      document.cookie = [
        `nf_lang=${encodeURIComponent(locale)}`,
        "Path=/",
        `Max-Age=${60 * 60 * 24 * 365}`,
        "SameSite=Lax",
      ].join("; ");
    });
  });
};

const bindSectionNavHighlight = () => {
  const navLinks = Array.from(document.querySelectorAll(".nav-link-section[href^='#']"));
  if (!navLinks.length) return;

  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const section = id ? document.getElementById(id) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (activeLink) => {
    sections.forEach(({ link }) => {
      if (link === activeLink) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const updateActive = () => {
    const headerOffset = document.querySelector(".topbar")?.offsetHeight ?? 0;
    const marker = headerOffset + window.innerHeight * 0.24;
    let activeLink = null;

    sections.forEach(({ link, section }) => {
      if (section.getBoundingClientRect().top <= marker) activeLink = link;
    });

    setActive(activeLink);
  };

  window.addEventListener("scroll", updateActive, { passive: true });
  window.addEventListener("resize", updateActive);
  updateActive();
};

const bindParallax = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const shouldReduceMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches || connection?.saveData;
  if (shouldReduceMotion) return;

  const hero = document.querySelector(".hero-video");
  const softItems = document.querySelectorAll("[data-parallax='soft']");

  const update = () => {
    const scrollY = window.scrollY;
    if (hero) hero.style.transform = `translate3d(0, ${scrollY * 0.08}px, 0) scale(1.04)`;
    softItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const offset = (window.innerHeight / 2 - rect.top) * 0.018;
      item.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
};

const bindHeroMedia = () => {
  const hero = document.querySelector(".hero-video");
  if (!hero) return;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const shouldReduceMedia =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches || connection?.saveData;
  if (shouldReduceMedia) {
    hero.remove();
    return;
  }

  const loadHero = () => {
    if (!hero.src && hero.dataset.src) hero.src = hero.dataset.src;
  };

  const playHero = () => {
    loadHero();
    hero.play().catch(() => {});
  };

  const pauseHero = () => {
    hero.pause();
  };

  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !document.hidden) playHero();
        else pauseHero();
      });
    },
    { threshold: 0.35 }
  );

  heroObserver.observe(hero);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseHero();
    else playHero();
  });
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = () => window.matchMedia("(pointer: fine)").matches;

// 🔦 Halo lumineux qui suit le curseur — "lampe dans la nuit".
const bindCursorGlow = () => {
  if (prefersReducedMotion() || !hasFinePointer()) return;

  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let targetX = x;
  let targetY = y;
  let raf = null;

  const render = () => {
    x += (targetX - x) * 0.16;
    y += (targetY - y) * 0.16;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (Math.abs(targetX - x) > 0.4 || Math.abs(targetY - y) > 0.4) {
      raf = requestAnimationFrame(render);
    } else {
      raf = null;
    }
  };

  window.addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    glow.style.opacity = "1";
    if (!raf) raf = requestAnimationFrame(render);
  });
  document.addEventListener("mouseleave", () => {
    glow.style.opacity = "0";
  });
};

// 🧲 Boutons attirés par le curseur.
const bindMagneticButtons = () => {
  if (prefersReducedMotion() || !hasFinePointer()) return;

  document.querySelectorAll(".button-spotify").forEach((btn) => {
    const strength = 0.28;
    btn.addEventListener("mousemove", (event) => {
      const rect = btn.getBoundingClientRect();
      const mx = event.clientX - (rect.left + rect.width / 2);
      const my = event.clientY - (rect.top + rect.height / 2);
      btn.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
};

// ⌁ Le wordmark KØVLI se recompose par brouillage — "chair et code".
const bindTextScramble = () => {
  const el = document.querySelector(".hero h1");
  if (!el) return;
  const finalText = el.textContent;
  if (prefersReducedMotion()) return;

  const glyphs = "AÆBCDEFGHIJKLMNØPQRSTUVWXYZ0123456789/#*<>[]{}";
  const totalFrames = 36;
  let frame = 0;

  el.classList.add("is-scrambling");

  const tick = () => {
    frame++;
    const revealCount = Math.floor((frame / totalFrames) * finalText.length);
    let out = "";
    for (let i = 0; i < finalText.length; i++) {
      out +=
        i < revealCount
          ? finalText[i]
          : glyphs[Math.floor(Math.random() * glyphs.length)];
    }
    el.textContent = out;
    if (frame < totalFrames) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = finalText;
      el.classList.remove("is-scrambling");
    }
  };

  window.setTimeout(() => requestAnimationFrame(tick), 240);
};

// Formulaire capture Brevo : envoi no-cors (on reste sur la page) + message inline.
const bindCaptureForm = () => {
  const form = document.getElementById("capture-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    // Honeypot : si ce champ est rempli, c'est un bot -> on ignore silencieusement.
    if (form.querySelector('[name="email_address_check"]')?.value) return;
    const email = form.querySelector('[name="EMAIL"]');
    if (email && !email.checkValidity()) {
      email.reportValidity();
      return;
    }

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      mode: "no-cors",
    }).catch(() => {});

    const card = form.closest(".capture-card");
    form.hidden = true;
    const note = card?.querySelector(".capture-note");
    if (note) note.hidden = true;
    const success = card?.querySelector("[data-capture-success]");
    if (success) success.hidden = false;
  });
};

observeReveals();
bindCursorGlow();
bindMagneticButtons();
bindTextScramble();
bindCaptureForm();
lazyLoadSpotify();
bindExclusiveSpotifyPlayback();
bindTrackVisuals();
generateTrackPosters();
bindTrackAccordion();
bindDiaryMore();
bindMobileNav();
bindClaraLightbox();
bindLanguagePreference();
bindSectionNavHighlight();
bindParallax();
bindHeroMedia();
