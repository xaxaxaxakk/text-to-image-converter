import {extension_settings, getContext, loadExtensionSettings} from "../../../extensions.js";
import {saveSettingsDebounced} from "../../../../script.js";

const extensionName = "text-to-image-converter";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const defaultSettings = {
  fontFamily: "Pretendard-Regular",
  fontWeight: "normal",
  fontSize: "24px",
  fontColor: "#000000",
  strokeWidth: "0",
  selectedBackgroundImage: "bg40.png",
  imageRatio: "square",
  bgBlur: 0,
  bgGrayscale: false,
  bgNoise: 0,
  overlayOpacity: 0,
  overlayColor: "#ffffff",
  presets: {},
  currentPreset: null,
};

async function initSettings() {
  extension_settings[extensionName] = {...defaultSettings, ...extension_settings[extensionName]};
  const {
    fontFamily,
    fontSize,
    fontColor,
    strokeWidth,
    imageRatio,
    bgBlur,
    bgGrayscale,
    bgNoise,
    overlayOpacity,
    overlayColor,
    currentPreset,
  } = extension_settings[extensionName];

  $("#text_image_font_family").val(fontFamily);
  $("#text_image_font_size").val(fontSize);
  $("#text_image_font_color").val(fontColor);
  $("#text_image_stroke_width").val(strokeWidth);
  $("#text_image_ratio").val(imageRatio);
  $("#bg_blur").val(bgBlur);
  $("#bg_grayscale").prop("checked", bgGrayscale);
  $("#bg_noise").val(bgNoise);
  $("#overlay_opacity").val(overlayOpacity);
  $("#overlay_color").val(overlayColor);

  await Promise.all([loadFonts(), loadBG()]);

  if (currentPreset && extension_settings[extensionName].presets[currentPreset]) {
    applyPreset(currentPreset);
  } else {
    refreshPreview();
  }
}

function presetUI() {
  $("#create_preset").on("click", createPreset);
  $("#save_preset").on("click", savePreset);
  $("#delete_preset").on("click", deletePreset);
  $("#preset_selector").on("change", selectPreset);

  loadPresetList();
}
function getPresetSettings() {
  const settings = {...extension_settings[extensionName]};
  delete settings.presets;
  delete settings.currentPreset;
  settings.originalWord1 = $("#original_word_1").val();
  settings.replacementWord1 = $("#replacement_word_1").val();
  settings.originalWord2 = $("#original_word_2").val();
  settings.replacementWord2 = $("#replacement_word_2").val();

  return settings;
}
function createPreset() {
  const presetName = $("#preset_name").val().trim();

  const presets = extension_settings[extensionName].presets || {};
  if (presets[presetName]) {
    const confirmOverwrite = confirm("같은 이름의 프리셋이 이미 존재합니다. 덮어쓰시겠습니까?");
    if (!confirmOverwrite) return;
  }
  const currentSettings = getPresetSettings();
  presets[presetName] = currentSettings;
  extension_settings[extensionName].presets = presets;
  extension_settings[extensionName].currentPreset = presetName;
  updatePresetSelector(presetName);
  saveSettingsDebounced();
}
function savePreset() {
  const presetName = $("#preset_selector").val();
  const currentSettings = getPresetSettings();
  extension_settings[extensionName].presets[presetName] = currentSettings;
  saveSettingsDebounced();
}
function deletePreset() {
  const presetName = $("#preset_selector").val();
  const presets = extension_settings[extensionName].presets;
  delete presets[presetName];
  if (extension_settings[extensionName].currentPreset === presetName) {
    extension_settings[extensionName].currentPreset = null;
  }
  saveSettingsDebounced();
  updatePresetSelector();
}
function selectPreset() {
  const presetName = $(this).val();
  if (presetName === "nonePreset") {
    extension_settings[extensionName] = {
      ...defaultSettings,
      presets: extension_settings[extensionName].presets,
      currentPreset: null,
    };

    $("#text_image_font_family").val(defaultSettings.fontFamily);
    $("#text_image_font_size").val(defaultSettings.fontSize);
    $("#text_image_font_color").val(defaultSettings.fontColor);
    $("#text_image_stroke_width").val(defaultSettings.strokeWidth);
    $("#text_image_ratio").val(defaultSettings.imageRatio);
    $("#bg_blur").val(defaultSettings.bgBlur);
    $("#bg_grayscale").prop("checked", defaultSettings.bgGrayscale);
    $("#bg_noise").val(defaultSettings.bgNoise);
    $("#overlay_opacity").val(defaultSettings.overlayOpacity);
    $("#overlay_color").val(defaultSettings.overlayColor);

    $(".bg-image-item").removeClass("selected");
    $(`.bg-image-item[data-path="${defaultSettings.selectedBackgroundImage}"]`).addClass(
      "selected"
    );

    refreshPreview();
  } else if (presetName) {
    extension_settings[extensionName].currentPreset = presetName;
    applyPreset(presetName);
  } else {
    extension_settings[extensionName].currentPreset = null;
  }
  saveSettingsDebounced();
}
function applyPreset(presetName) {
  const presets = extension_settings[extensionName].presets;
  const preset = presets[presetName];

  if (preset.originalWord1 !== undefined) {
    $("#original_word_1").val(preset.originalWord1);
  }
  if (preset.replacementWord1 !== undefined) {
    $("#replacement_word_1").val(preset.replacementWord1);
  }
  if (preset.originalWord2 !== undefined) {
    $("#original_word_2").val(preset.originalWord2);
  }
  if (preset.replacementWord2 !== undefined) {
    $("#replacement_word_2").val(preset.replacementWord2);
  }

  for (const [key, value] of Object.entries(preset)) {
    if (["originalWord1", "replacementWord1", "originalWord2", "replacementWord2"].includes(key)) {
      continue;
    }
    extension_settings[extensionName][key] = value;

    switch (key) {
      case "fontFamily":
        $("#text_image_font_family").val(value);
        break;
      case "fontSize":
        $("#text_image_font_size").val(value);
        break;
      case "fontColor":
        $("#text_image_font_color").val(value);
        break;
      case "strokeWidth":
        $("#text_image_stroke_width").val(value);
        break;
      case "imageRatio":
        $("#text_image_ratio").val(value);
        break;
      case "bgBlur":
        $("#bg_blur").val(value);
        break;
      case "bgGrayscale":
        $("#bg_grayscale").prop("checked", value);
        break;
      case "bgNoise":
        $("#bg_noise").val(value);
        break;
      case "overlayOpacity":
        $("#overlay_opacity").val(value);
        break;
      case "overlayColor":
        $("#overlay_color").val(value);
        break;
      case "selectedBackgroundImage":
        $(".bg-image-item").removeClass("selected");
        $(`.bg-image-item[data-path="${value}"]`).addClass("selected");
        break;
    }
  }
  saveSettingsDebounced();
  refreshPreview();
}
function loadPresetList() {
  const presets = extension_settings[extensionName].presets || {};
  updatePresetSelector(extension_settings[extensionName].currentPreset);
}
function updatePresetSelector(selectedPreset = null) {
  const presets = extension_settings[extensionName].presets || {};
  const $selector = $("#preset_selector").empty();

  $selector.append('<option value="nonePreset">선택된 프리셋 없음</option>');

  Object.keys(presets)
    .sort()
    .forEach((name) => {
      $selector.append(`<option value="${name}">${name}</option>`);
    });

  if (selectedPreset && presets[selectedPreset]) {
    $selector.val(selectedPreset);
  } else if (extension_settings[extensionName].currentPreset) {
    $selector.val(extension_settings[extensionName].currentPreset);
  }
}

async function loadFonts() {
  try {
    const response = await fetch(`${extensionFolderPath}/font-family.json`);
    const fonts = await response.json();
    const select = $("#text_image_font_family").empty();
    fonts.forEach((font) => select.append(`<option value="${font.value}">${font.label}</option>`));
    select.val(extension_settings[extensionName].fontFamily);
  } catch (error) {
    console.error("Failed to load font families:", error);
  }
}

async function loadBG() {
  try {
    const response = await fetch(`${extensionFolderPath}/backgrounds-list.json`);
    const backgrounds = await response.json();
    const gallery = $("#background_image_gallery").empty();
    backgrounds.forEach((bg) => {
      const bgPath = `${extensionFolderPath}/default-backgrounds/${bg}`;
      const isSelected = extension_settings[extensionName].selectedBackgroundImage === bgPath;
      gallery.append(`
        <div class="bg-image-item ${isSelected ? "selected" : ""}" data-path="${bgPath}">
          <img src="${bgPath}" alt="${bg}" />
        </div>
      `);
    });
    $(".bg-image-item").on("click", selectCanvasBG);
  } catch (error) {
    console.error("Failed to load background images:", error);
  }
}
function storeBackground(name, imageData) {
  const customBackgrounds = JSON.parse(localStorage.getItem("textToImageCustomBgs") || "{}");
  customBackgrounds[name] = imageData;
  localStorage.setItem("textToImageCustomBgs", JSON.stringify(customBackgrounds));
}
function deleteBackground(name) {
  const customBackgrounds = JSON.parse(localStorage.getItem("textToImageCustomBgs") || "{}");
  delete customBackgrounds[name];
  localStorage.setItem("textToImageCustomBgs", JSON.stringify(customBackgrounds));
}
function loadCustomBG() {
  const customBackgrounds = JSON.parse(localStorage.getItem("textToImageCustomBgs") || "{}");
  const gallery = $("#custom_background_gallery").empty();
  Object.entries(customBackgrounds).forEach(([name, imageData]) => addBGtoGallery(name, imageData));
}
function customBG() {
  $("#bg_image_upload").on("change", uploadImage);
  loadCustomBG();
}
function addBGtoGallery(name, imageData) {
  const isSelected = extension_settings[extensionName].selectedBackgroundImage === imageData;
  const bgElement = $(`
    <div class="bg-image-item ${
      isSelected ? "selected" : ""
    }" data-path="${imageData}" data-name="${name}">
      <img src="${imageData}" alt="${name}" />
      <div class="delete-bg-btn">×</div>
    </div>
  `);
  $("#custom_background_gallery").append(bgElement);
  bgElement.on("click", selectCanvasBG);
  bgElement.find(".delete-bg-btn").on("click", removeCustomBg);
}
function uploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageData = e.target.result;
    storeBackground(file.name, imageData);
    addBGtoGallery(file.name, imageData);
    $("#bg_image_upload").val("");
  };
  reader.readAsDataURL(file);
}
function removeCustomBg(event) {
  event.stopPropagation();
  const bgItem = $(this).closest(".bg-image-item");
  deleteBackground(bgItem.data("name"));
  bgItem.remove();
  if (bgItem.hasClass("selected")) {
    extension_settings[extensionName].selectedBackgroundImage = null;
    saveSettingsDebounced();
    refreshPreview();
  }
}

function addBlur(event) {
  extension_settings[extensionName].bgBlur = parseFloat(event.target.value);
  saveSettingsDebounced();
  refreshPreview();
}
function grayScale(event) {
  extension_settings[extensionName].bgGrayscale = event.target.checked;
  saveSettingsDebounced();
  refreshPreview();
}
function addNoise(event) {
  extension_settings[extensionName].bgNoise = parseInt(event.target.value);
  saveSettingsDebounced();
  refreshPreview();
}
function addOverlay(event) {
  extension_settings[extensionName].overlayOpacity = parseFloat(event.target.value);
  saveSettingsDebounced();
  refreshPreview();
}
function overlayColor(event) {
  extension_settings[extensionName].overlayColor = event.target.value;
  saveSettingsDebounced();
  refreshPreview();
}

function setupWordReplacer() {
  let originalText = "";

  $("#apply_replacement").on("click", () => {
    originalText = $("#text_to_image").val();
    replaceWords();
  });

  $("#restore_text").on("click", () => {
    if (originalText !== "") {
      $("#text_to_image").val(originalText);
      refreshPreview();
    }
  });
}
function replaceWords() {
  let text = $("#text_to_image").val();

  const wordPairs = [
    {
      original: $("#original_word_1").val().trim(),
      replacement: $("#replacement_word_1").val().trim(),
    },
    {
      original: $("#original_word_2").val().trim(),
      replacement: $("#replacement_word_2").val().trim(),
    },
  ];

  wordPairs.forEach(({original, replacement}) => {
    if (original && replacement) {
      const containsKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(original);
      text = containsKorean
        ? findKoreanWord(text, original, replacement)
        : text.replace(new RegExp(`\\b${escapeRegExp(original)}\\b`, "gi"), replacement);
    }
  });

  $("#text_to_image").val(text);
  refreshPreview();
}
function findKoreanWord(text, originalWord, replacementWord) {
  const originalLower = originalWord.toLowerCase();
  const josaPattern =
    /[은는이가의을를로으로과와께에게에서한테하고랑이랑도이도만까지마저조차부터밖에야말로]|\([^()]*\)/g;
  const wordBoundaryPattern = /[\s\.,;:!?\(\)\[\]{}"'<>\/\\\-_=\+\*&\^%\$#@~`|]/;
  let result = "";

  for (let i = 0; i < text.length; i++) {
    if (
      i <= text.length - originalWord.length &&
      text.slice(i, i + originalWord.length).toLowerCase() === originalLower
    ) {
      const isStartBoundary = i === 0 || wordBoundaryPattern.test(text[i - 1]);

      const endPos = i + originalWord.length;
      const isEndBoundary =
        endPos === text.length ||
        wordBoundaryPattern.test(text[endPos]) ||
        josaPattern.test(text[endPos]);

      if (isStartBoundary && isEndBoundary) {
        const restStart = endPos;
        const josaMatch = text.slice(restStart).match(josaPattern);
        const josa = josaMatch && josaMatch[0].startsWith(text[restStart]) ? josaMatch[0] : "";

        result += replacementWord + josa;
        i = restStart + josa.length - 1;
        continue;
      }
    }
    result += text[i];
  }
  return result;
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fontFamily(event) {
  extension_settings[extensionName].fontFamily = event.target.value;
  saveSettingsDebounced();
  refreshPreview();
}

function fontWeight(event) {
  extension_settings[extensionName].strokeWidth = event.target.value;
  saveSettingsDebounced();
  refreshPreview();
}
function fontSize(event) {
  extension_settings[extensionName].fontSize = event.target.value;
  saveSettingsDebounced();
  refreshPreview();
}
function fontColor(event) {
  extension_settings[extensionName].fontColor = event.target.value;
  saveSettingsDebounced();
  refreshPreview();
}
function aspectRatio(event) {
  extension_settings[extensionName].imageRatio = event.target.value;
  saveSettingsDebounced();
  refreshPreview();
}

function selectCanvasBG(event) {
  if ($(event.target).hasClass("delete-bg-btn")) return;
  const path = $(this).data("path");
  $(".bg-image-item").removeClass("selected");
  $(this).addClass("selected");
  extension_settings[extensionName].selectedBackgroundImage = path;
  saveSettingsDebounced();
  refreshPreview();
}
function getCanvasSize() {
  return extension_settings[extensionName].imageRatio === "rectangular"
    ? {width: 700, height: 1100}
    : {width: 700, height: 700};
}
function refreshPreview() {
  const text = $("#text_to_image").val() || "";
  const chunks = wrappingTexts(text);
  const $container = $("#image_preview_container").empty();

  chunks.forEach((chunk, i) => {
    $container.append(generateTextImage(chunk, i));
  });
}

function enableMarkdown(text) {
  const spans = [];
  let currentText = "";
  let bold = false;
  let italic = false;

  for (let i = 0; i < text.length; i++) {
    if (text.slice(i, i + 2) === "**") {
      if (currentText) spans.push({text: currentText, bold, italic});
      bold = !bold;
      currentText = "";
      i++;
    } else if (text[i] === "*" && text[i + 1] !== "*") {
      if (currentText) spans.push({text: currentText, bold, italic});
      italic = !italic;
      currentText = "";
    } else {
      currentText += text[i];
    }
  }
  if (currentText) spans.push({text: currentText, bold, italic});
  return spans;
}

function wrappingTexts(text) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const {width, height} = getCanvasSize();
  const maxWidth = width - 80;
  const fontSize = parseInt(extension_settings[extensionName].fontSize);
  const lineHeight = fontSize * 1.5;
  const maxLines = Math.floor((height - 80 - lineHeight) / lineHeight);

  const pages = [];
  let currentPage = [];
  let lineCount = 0;

  text.split("\n").forEach((paragraph) => {
    if (!paragraph.trim()) {
      if (lineCount + 1 > maxLines && currentPage.length) {
        pages.push(currentPage);
        currentPage = [];
        lineCount = 0;
      }
      currentPage.push([{text: "", bold: false, italic: false}]);
      lineCount++;
      return;
    }

    const spans = enableMarkdown(paragraph);
    let currentLine = [];
    let currentLineText = "";

    spans.forEach((span) => {
      span.text.split(" ").forEach((word) => {
        const testText = currentLineText ? `${currentLineText} ${word}` : word;
        ctx.font = `${
          span.bold ? "bold" : span.italic ? "italic" : extension_settings[extensionName].fontWeight
        } ${fontSize}px ${extension_settings[extensionName].fontFamily}`;

        if (ctx.measureText(testText).width <= maxWidth) {
          currentLineText = testText;
          currentLine.push({text: word, bold: span.bold, italic: span.italic});
        } else {
          if (lineCount >= maxLines && currentPage.length) {
            pages.push(currentPage);
            currentPage = [];
            lineCount = 0;
          }
          if (currentLine.length) {
            currentPage.push(currentLine);
            lineCount++;
          }
          currentLine = [{text: word, bold: span.bold, italic: span.italic}];
          currentLineText = word;
        }
      });
    });

    if (currentLine.length) {
      if (lineCount >= maxLines && currentPage.length) {
        pages.push(currentPage);
        currentPage = [];
        lineCount = 0;
      }
      currentPage.push(currentLine);
      lineCount++;
    }
  });

  if (currentPage.length) pages.push(currentPage);
  return pages;
}

function generateTextImage(chunk, index) {
  const {width, height} = getCanvasSize();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const fontSize = parseInt(extension_settings[extensionName].fontSize);
  const lineHeight = fontSize * 1.5;
  const settings = extension_settings[extensionName];

  const drawText = () => {
    ctx.fillStyle = settings.fontColor || "#000000";
    const strokeWidth = parseFloat(settings.strokeWidth) || 0;
    if (strokeWidth > 0) {
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = strokeWidth;
    }

    const totalTextHeight = chunk.length * lineHeight;
    let y = Math.max((height - totalTextHeight) / 2 + lineHeight, 40 + lineHeight / 2);

    chunk.forEach((line) => {
      let x = 40;
      line.forEach((span) => {
        ctx.font = `${
          span.bold ? "bold" : span.italic ? "italic" : settings.fontWeight
        } ${fontSize}px ${settings.fontFamily}`;
        const textWidth = ctx.measureText(span.text + " ").width;
        if (strokeWidth > 0) ctx.strokeText(span.text, x, y);
        ctx.fillText(span.text, x, y);
        x += textWidth;
      });
      y += lineHeight;
    });
  };

  const textWallpaper = (img) => {
    let drawWidth,
      drawHeight,
      offsetX = 0,
      offsetY = 0;
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;

    if (imgRatio > canvasRatio) {
      drawHeight = height;
      drawWidth = img.width * (height / img.height);
      offsetX = (width - drawWidth) / 2;
    } else {
      drawWidth = width;
      drawHeight = img.height * (width / img.width);
      offsetY = (height - drawHeight) / 2;
    }
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    if (settings.bgBlur > 0) {
      ctx.filter = `blur(${settings.bgBlur}px)`;
      ctx.drawImage(canvas, 0, 0, width, height);
      ctx.filter = "none";
    }

    if (settings.bgGrayscale) {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    if (settings.bgNoise > 0) {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const noiseLevel = settings.bgNoise / 100;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 255 * noiseLevel;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      ctx.putImageData(imageData, 0, 0);
    }

    if (settings.overlayOpacity > 0) {
      ctx.fillStyle = `${settings.overlayColor}${Math.round(settings.overlayOpacity * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.fillRect(20, 20, width - 40, height - 40);
    }
  };

  const $preview = $("<div>").addClass("image-preview-item");
  const $img = $("<img>").attr({alt: `Generated Image ${index + 1}`});
  const $downloadBtn = $("<button>")
    .addClass("download-btn")
    .text("Download")
    .on("click", () => saveImage(canvas.toDataURL("image/png"), `${index + 1}.png`));

  const bgImage = settings.selectedBackgroundImage;
  if (bgImage) {
    const img = new Image();
    img.onload = () => {
      textWallpaper(img);
      drawText();
      $img.attr("src", canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      drawText();
      $img.attr("src", canvas.toDataURL("image/png"));
    };
    img.src = bgImage;
  } else {
    ctx.fillRect(0, 0, width, height);
    drawText();
    $img.attr("src", canvas.toDataURL("image/png"));
  }

  if (settings.imageRatio === "rectangular") $img.addClass("rectangular");
  $preview.append($img, $downloadBtn);
  return $preview;
}

function saveImage(dataUrl, filename) {
  const now = new Date();
  const dateString = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${dateString}.png`;
  link.click();
}

function setupImageConvertButton() {
  let selectedText = "";
  let selectedMesBlock = null;
  $(document).on("mouseup touchend", ".mes_text", function () {
    const selection = window.getSelection().toString().trim();
    if (selection) {
      selectedText = selection;
      selectedMesBlock = $(this).closest(".mes");
    } else {
      selectedText = "";
      selectedMesBlock = null;
    }
  });

  function createImageConvertButton($mesBlock) {
    const $button = $("<div>")
      .addClass("mes_button mes_to_image fa-solid fa-camera-retro interactable")
      .attr({
        title: "로그 발췌",
        "data-i18n": "[title]로그 발췌",
        tabindex: "0",
      })
      .on("click", (e) => {
        e.preventDefault();
        const text =
          selectedText && selectedMesBlock?.is($mesBlock)
            ? selectedText
            : $mesBlock.find(".mes_text").text().trim();
        if (text) {
          setExtractText(text);
        }
        selectedText = "";
        selectedMesBlock = null;
      });

    $mesBlock.find(".extraMesButtons").prepend($button);
  }

  $("#chat .mes:not(:has(.mes_to_image))").each(function () {
    createImageConvertButton($(this));
  });
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const $newMes = $(mutation.addedNodes).filter(".mes:not(:has(.mes_to_image))");
      $newMes.each(function () {
        createImageConvertButton($(this));
      });
    });
  });
  observer.observe($("#chat")[0], {childList: true, subtree: true});
}
function setExtractText(text) {
  $("#text_to_image").val(text);

  const original1 = $("#original_word_1").val().trim();
  const replacement1 = $("#replacement_word_1").val().trim();
  const original2 = $("#original_word_2").val().trim();
  const replacement2 = $("#replacement_word_2").val().trim();

  if (original1 && replacement1) {
    replaceWords();
  }
  if (original2 && replacement2) {
    replaceWords();
  }

  refreshPreview();

  setTimeout(() => {
    const downloadButtons = $("#image_preview_container .download-btn");
    let index = 0;

    function controlDL() {
      if (index < downloadButtons.length) {
        $(downloadButtons[index]).trigger("click");
        index++;
        setTimeout(controlDL, 500);
      }
    }

    if (downloadButtons.length > 0) {
      controlDL();
    }
  }, 1000);
}

jQuery(async () => {
  $("#extensions_settings2").append(await $.get(`${extensionFolderPath}/settings.html`));
  $("#text_image_font_family").on("change", fontFamily);
  $("#text_image_font_size").on("change", fontSize);
  $("#text_image_font_color").on("change", fontColor);
  $("#text_image_stroke_width").on("change", fontWeight);
  $("#text_image_ratio").on("change", aspectRatio);
  $("#text_to_image").on("input", refreshPreview);
  $("#bg_blur").on("input", addBlur);
  $("#bg_grayscale").on("change", grayScale);
  $("#bg_noise").on("input", addNoise);
  $("#overlay_opacity").on("input", addOverlay);
  $("#overlay_color").on("change", overlayColor);

  $("#clear_text_btn").on("click", () => {
    $("#text_to_image").val("");
    refreshPreview();
  });

  $("h4.toggle").each(function () {
    const $this = $(this);
    const $siblings = $this.siblings();
    $siblings.hide();
    $this.on("click", function () {
      $siblings.slideToggle();
    });
  });

  presetUI();

  await initSettings();
  customBG();
  setupWordReplacer();
  setupImageConvertButton();
});
