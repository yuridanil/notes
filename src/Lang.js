const langs = new Map([
  ["en", {
    "lang": "en",
    "title": "Sticky notes",
    "placeholder": "Place your text here...",
    "delete": "Delete",
    "cancel": "Cancel",
  }],
  ["ru", {
    "lang": "ru",
    "title": "Стикеры",
    "placeholder": "Введите текст...",
    "delete": "Удалить",
    "cancel": "Отменить",
  }]
]);

let lang = navigator.language.substring(0, 2);

let result = langs.get(lang);

if (lang !== "en")
  for (let v in langs.get("en"))
    result[v] = langs.get(lang)[v] || langs.get("en")[v];

export const Lang = result;