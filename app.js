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

  embeds.forEach((iframe) => {
    const handleIntent = () => stopOtherEmbeds(iframe);
    iframe.addEventListener("mouseenter", handleIntent, { passive: true });
    iframe.addEventListener("touchstart", handleIntent, { passive: true });
    iframe.addEventListener("focus", handleIntent);
  });

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

const bindDiaryMore = () => {
  const diarySection = document.getElementById("diary");
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
  const dialogCaption = document.getElementById("image-lightbox-caption");
  const closeButton = dialog?.querySelector(".image-lightbox-close");
  const triggers = document.querySelectorAll(".clara-photo-button");
  if (!dialog || !dialogImage || !dialogCaption || !closeButton || !triggers.length) return;

  const close = () => {
    if (dialog.open) dialog.close();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      dialogImage.src = trigger.dataset.image || "";
      dialogImage.alt = trigger.querySelector("img")?.alt || "Gallery image";
      dialogCaption.textContent = trigger.dataset.caption || "";
      dialog.showModal();
    });
  });

  closeButton.addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
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

observeReveals();
lazyLoadSpotify();
bindExclusiveSpotifyPlayback();
bindTrackVisuals();
bindDiaryMore();
bindMobileNav();
bindClaraLightbox();
bindLanguagePreference();
bindParallax();
bindHeroMedia();
