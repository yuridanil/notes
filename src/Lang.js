const langs = new Map([
  ["en", {
    "lang": "en",
    "title": "Stickers",
    "placeholder": "Place your text here...",
    "delete": "Delete",
    "cancel": "Cancel",
    "doubleclick": "Double click to add note",
    "longtouch": "Long touch to add note",
    "email": "E-mail",
    "password": "Password",
    "authhint": "To save your stickers",
    "authorize": "authorize",
    "signin": "Sign in",
    "signup": "Sign up",
    "signout": "Sign out",
    "x": "✖",
    "unknownerror": "Unknown error",
    "userexists": "User already exists",
    "wrongemail": "Wrong email format",
    "shortpassword": "Password too short",
    "wronguserpass": "Wrong username or password",
    "captchaerror": "Captcha error",
    "saveerror": "Save error",
  }],
  ["ru", {
    "lang": "ru",
    "title": "Стикеры",
    "placeholder": "Введите текст...",
    "delete": "Удалить",
    "cancel": "Отменить",
    "doubleclick": "Двойной щелчок, чтоб добавить стикер",
    "longtouch": "Долгое нажатие, чтоб добавить стикер",
    "email": "E-mail",
    "password": "Пароль",
    "authhint": "Чтобы сохранять стикеры",
    "authorize": "авторизуйтесь",
    "signin": "Войти",
    "signup": "Регистрация",
    "signout": "Выйти",
    "x": "✖",
    "unknownerror": "Неизвестная ошибка",
    "userexists": "Пользователь уже существует",
    "wrongemail": "Неверный формат email",
    "shortpassword": "Пароль слишком короткий",
    "wronguserpass": "Неверный логин или пароль",
    "captchaerror": "Ошибка проверки кода",
    "saveerror": "Ошибка сохранения",
  }]
]);

let lang = navigator.language.substring(0, 2);

let result = langs.get(lang);

if (lang !== "en")
  for (let v in langs.get("en"))
    result[v] = langs.get(lang)[v] || langs.get("en")[v];

export const Lang = result;