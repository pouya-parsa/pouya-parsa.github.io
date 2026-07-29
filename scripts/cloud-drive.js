(function initCloudDriveController(globalScope) {
  "use strict";

  const HASH_FIELDS = Object.freeze([
    "model",
    "strategy",
    "generation",
    "budgetMs",
    "penetration",
    "utilization",
    "year",
  ]);
  const NUMERIC_FIELDS = new Set([
    "budgetMs",
    "penetration",
    "utilization",
    "year",
  ]);

  function serializeScenario(input) {
    const serialized = HASH_FIELDS.map((field) => input[field]).join("|");
    return `#scenario=${encodeURIComponent(serialized)}`;
  }

  function parseScenarioHash(hash) {
    if (typeof hash !== "string" || !hash.startsWith("#scenario=")) {
      return null;
    }

    try {
      const values = decodeURIComponent(
        hash.slice("#scenario=".length)
      ).split("|");
      if (values.length !== HASH_FIELDS.length) return null;

      const input = {};
      HASH_FIELDS.forEach((field, index) => {
        input[field] = NUMERIC_FIELDS.has(field)
          ? Number(values[index])
          : values[index];
      });

      if (
        HASH_FIELDS.some(
          (field) =>
            NUMERIC_FIELDS.has(field) && !Number.isFinite(input[field])
        )
      ) {
        return null;
      }

      return Object.freeze(input);
    } catch {
      return null;
    }
  }

  const controller = Object.freeze({
    HASH_FIELDS,
    serializeScenario,
    parseScenarioHash,
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = controller;
  }
  globalScope.CloudDriveController = controller;

  if (!globalScope.document) return;
  const document = globalScope.document;

  document.documentElement.classList.add("has-js");
  initFigureFilters();
  initFigureDialog();
  initCitationCopy();
  initSectionNavigation();

  const model = globalScope.CloudDriveModel;
  const form = document.querySelector("#scenario-form");
  const resultRegion = document.querySelector("#scenario-result");

  if (!model || !form || !resultRegion) return;

  const yearInput = form.querySelector('[name="year"]');
  const yearOutput = form.querySelector('output[for="scenario-year"]');
  const selection = document.querySelector("#scenario-selection");
  const summary = document.querySelector("#binding-summary");
  const caveats = document.querySelector("#scenario-caveats");

  const number = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  });
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  function initFigureFilters() {
    const buttons = Array.from(
      document.querySelectorAll(".figure-filters [data-filter]")
    );
    const figures = Array.from(document.querySelectorAll(".figure-card"));
    const status = document.querySelector("#figure-filter-status");

    if (!buttons.length || !figures.length) return;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        let visibleCount = 0;

        buttons.forEach((candidate) => {
          candidate.setAttribute(
            "aria-pressed",
            String(candidate === button)
          );
        });

        figures.forEach((figure) => {
          const categories = (figure.dataset.category || "").split(" ");
          const visible = filter === "all" || categories.includes(filter);
          figure.hidden = !visible;
          if (visible) visibleCount += 1;
        });

        if (status) {
          status.textContent =
            filter === "all"
              ? `Showing all ${visibleCount} figures.`
              : `Showing ${visibleCount} ${filter} figure${visibleCount === 1 ? "" : "s"}.`;
        }
      });
    });
  }

  function initFigureDialog() {
    const dialog = document.querySelector("#figure-dialog");
    const closeButton = document.querySelector("#figure-dialog-close");
    const title = document.querySelector("#figure-dialog-title");
    const dialogImage = document.querySelector("#figure-dialog-image");
    const dialogCaption = document.querySelector("#figure-dialog-caption");
    const triggers = Array.from(document.querySelectorAll("[data-enlarge]"));
    let launchButton = null;

    if (!dialog || !closeButton || !title || !dialogImage || !dialogCaption) {
      return;
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const figure = trigger.closest(".figure-card");
        const image = figure && figure.querySelector("img");
        const caption = figure && figure.querySelector("figcaption");
        if (!figure || !image || !caption) return;

        if (typeof dialog.showModal !== "function") {
          globalScope.open(image.src, "_blank", "noopener");
          return;
        }

        launchButton = trigger;
        title.textContent = `Figure ${figure.id.replace("figure-", "")}`;
        dialogImage.src = image.src;
        dialogImage.alt = image.alt;
        dialogCaption.textContent = caption.textContent.trim();
        dialog.showModal();
      });
    });

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      dialogImage.removeAttribute("src");
      if (launchButton) launchButton.focus();
    });
  }

  function initCitationCopy() {
    const button = document.querySelector("#copy-citation");
    const citation = document.querySelector("#bibtex");
    const status = document.querySelector("#citation-status");
    if (!button || !citation || !status) return;

    button.addEventListener("click", async () => {
      const citationText = citation.textContent.trim();

      try {
        if (
          globalScope.navigator.clipboard &&
          globalScope.navigator.clipboard.writeText
        ) {
          await globalScope.navigator.clipboard.writeText(citationText);
        } else {
          const range = document.createRange();
          const selection = globalScope.getSelection();
          range.selectNodeContents(citation);
          selection.removeAllRanges();
          selection.addRange(range);
          if (!document.execCommand("copy")) throw new Error("Copy failed");
          selection.removeAllRanges();
        }
        status.textContent = "Citation copied.";
      } catch {
        status.textContent =
          "Select the BibTeX text and copy it manually.";
      }
    });
  }

  function initSectionNavigation() {
    const links = Array.from(
      document.querySelectorAll('.paper-nav a[href^="#"]')
    );
    if (!links.length || !("IntersectionObserver" in globalScope)) return;

    const linksById = new Map();
    links.forEach((link) => {
      const id = link.getAttribute("href").slice(1);
      const section = document.getElementById(id);
      if (section) linksById.set(id, link);
    });
    if (!linksById.size) return;

    const setCurrent = (id) => {
      links.forEach((link) => link.removeAttribute("aria-current"));
      const currentLink = linksById.get(id);
      if (currentLink) currentLink.setAttribute("aria-current", "location");
    };

    const observer = new globalScope.IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              Math.abs(left.boundingClientRect.top) -
              Math.abs(right.boundingClientRect.top)
          );
        if (visible.length) setCurrent(visible[0].target.id);
      },
      {
        rootMargin: "-18% 0px -68% 0px",
        threshold: 0,
      }
    );

    linksById.forEach((_link, id) => {
      observer.observe(document.getElementById(id));
    });
  }

  function readScenario() {
    const data = new globalScope.FormData(form);
    return {
      model: data.get("model"),
      strategy: data.get("strategy"),
      generation: data.get("generation"),
      budgetMs: Number(data.get("budgetMs")),
      penetration: Number(data.get("penetration")),
      utilization: Number(data.get("utilization")),
      year: Number(data.get("year")),
    };
  }

  function setGate(id, state, title, detail) {
    const gate = document.querySelector(id);
    gate.dataset.state = state;
    gate.querySelector(".gate-status").textContent = title;
    gate.querySelector(".gate-detail").textContent = detail;
  }

  function renderScenario(result) {
    const input = result.input;
    yearOutput.textContent = input.year;
    selection.textContent =
      `${input.model} · ${input.strategy} · ${input.generation} · ` +
      `${input.penetration}% penetration · ` +
      `${number.format(input.utilization * 100)}% utilization · ${input.year}`;

    const communicationDetail = result.communicationPass
      ? `${number.format(result.activeVehiclesPerCell)} active vehicles/cell; ` +
        `${result.uplinkMbps} Mbps target. ${input.generation} meets the ` +
        `${result.minimumGeneration} minimum for this evaluated grid cell.`
      : `${number.format(result.activeVehiclesPerCell)} active vehicles/cell; ` +
        `${result.uplinkMbps} Mbps target. This cell requires ` +
        `${result.minimumGeneration === "infeasible" ? "more than the evaluated 6G envelope" : result.minimumGeneration}.`;

    setGate(
      "#gate-communication",
      result.communicationPass ? "pass" : "fail",
      result.communicationPass ? "Pass" : "Does not pass",
      communicationDetail
    );

    let computeDetail =
      `${number.format(result.deterministicFloorMs)} ms deterministic floor; ` +
      `${number.format(result.estimatedTailMs)} ms estimated stochastic tail ` +
      `inside a ${input.budgetMs} ms tier.`;
    if (!result.deterministicPass) {
      computeDetail =
        `${number.format(result.deterministicFloorMs)} ms deterministic floor ` +
        `already exceeds the ${input.budgetMs} ms tier.`;
    } else if (!result.communicationPass) {
      computeDetail =
        "Not evaluated because the selected access network cannot admit the workload.";
    }

    setGate(
      "#gate-compute",
      !result.communicationPass
        ? "blocked"
        : result.latencyPass
          ? "pass"
          : "fail",
      !result.communicationPass
        ? "Not evaluated"
        : result.latencyPass
          ? "Pass"
          : "Does not pass",
      computeDetail
    );

    const costDetail = result.jointlyFeasible
      ? `${currency.format(result.hybridAnnualUsd)} hybrid estimate vs. ` +
        `${currency.format(result.onboardAnnualUsd)} onboard per vehicle-year.`
      : "Cost is withheld until communication and latency both pass.";

    setGate(
      "#gate-cost",
      !result.jointlyFeasible
        ? "blocked"
        : result.cloudCheaper
          ? "pass"
          : "fail",
      !result.jointlyFeasible
        ? "Not evaluated"
        : result.cloudCheaper
          ? "Cloud estimate is lower"
          : "Onboard estimate is lower",
      costDetail
    );

    const bindingCopy = {
      communication: "Communication is the first binding gate.",
      compute: "Compute and tail latency are the first binding gate.",
      cost: "Cost is the first binding gate.",
      none: "This branch clears all three gates.",
    };
    summary.textContent = bindingCopy[result.firstBindingGate];
    caveats.textContent = result.caveats.join(" ");
  }

  function writeScenarioHash(result) {
    const hash = serializeScenario(result.input);
    globalScope.history.replaceState(null, "", hash);
    return hash;
  }

  function setControlValue(name, value) {
    const control = form.elements.namedItem(name);
    if (!control) return;

    if (control.tagName === "SELECT") {
      const normalizedValue = String(value);
      const exists = Array.from(control.options).some(
        (option) => option.value === normalizedValue
      );
      if (exists) control.value = normalizedValue;
      return;
    }

    if (control.tagName === "INPUT") {
      const numeric = Number(value);
      const minimum = Number(control.min);
      const maximum = Number(control.max);
      if (
        Number.isInteger(numeric) &&
        numeric >= minimum &&
        numeric <= maximum
      ) {
        control.value = String(numeric);
      }
    }
  }

  function setScenarioControls(input) {
    HASH_FIELDS.forEach((field) => setControlValue(field, input[field]));
  }

  function readScenarioHash() {
    const parsed = parseScenarioHash(globalScope.location.hash);
    if (parsed) setScenarioControls(parsed);
  }

  function presetKeyForScenario(input) {
    const presets = model.SCENARIO_PRESETS || {};
    return (
      Object.keys(presets).find((key) =>
        HASH_FIELDS.every(
          (field) => presets[key].input[field] === input[field]
        )
      ) || null
    );
  }

  function initPresetControls() {
    const buttons = Array.from(
      document.querySelectorAll("[data-preset]")
    );
    const description = document.querySelector("#preset-description");
    const presets = model.SCENARIO_PRESETS || {};

    if (!buttons.length) return () => {};

    const sync = () => {
      const activeKey = presetKeyForScenario(readScenario());
      buttons.forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.preset === activeKey)
        );
      });
      if (description) {
        description.textContent = activeKey
          ? presets[activeKey].description
          : "Custom scenario selected from the paper’s evaluated grid.";
      }
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const preset = presets[button.dataset.preset];
        if (!preset) return;
        setScenarioControls(preset.input);
        update(true);
        sync();
      });
    });

    return sync;
  }

  function initScenarioCopy() {
    const button = document.querySelector("#copy-scenario");
    const status = document.querySelector("#scenario-link-status");
    if (!button || !status) return;

    button.addEventListener("click", async () => {
      const result = model.evaluateScenario(readScenario());
      const hash = writeScenarioHash(result);
      const scenarioUrl = `${globalScope.location.href.split("#")[0]}${hash}`;

      try {
        if (
          globalScope.navigator.clipboard &&
          globalScope.navigator.clipboard.writeText
        ) {
          await globalScope.navigator.clipboard.writeText(scenarioUrl);
        } else {
          const temporaryInput = document.createElement("textarea");
          temporaryInput.value = scenarioUrl;
          temporaryInput.setAttribute("readonly", "");
          temporaryInput.style.position = "fixed";
          temporaryInput.style.opacity = "0";
          document.body.appendChild(temporaryInput);
          temporaryInput.select();
          if (!document.execCommand("copy")) throw new Error("Copy failed");
          temporaryInput.remove();
        }
        status.textContent = "Scenario link copied.";
      } catch {
        status.textContent =
          "Scenario URL is ready in the browser address bar.";
      }
    });
  }

  function update(share) {
    const result = globalScope.CloudDriveModel.evaluateScenario(readScenario());
    renderScenario(result);
    if (share) writeScenarioHash(result);
  }

  readScenarioHash();
  const syncPresetState = initPresetControls();
  initScenarioCopy();
  form.addEventListener("input", () => {
    update(true);
    syncPresetState();
  });
  yearInput.addEventListener("input", () => {
    yearOutput.textContent = yearInput.value;
  });
  update(false);
  syncPresetState();
})(typeof globalThis !== "undefined" ? globalThis : this);
