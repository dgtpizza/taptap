import { getWebApp } from '@/shared/telegram'

type Lang = 'en' | 'ru'

const messages = {
  en: {
    needTelegram: 'Telegram required',
    openFromTelegram: 'Open the app from Telegram.',
    sessionExpired: 'Session expired',
    sessionExpiredBody: 'Your session is no longer valid. Reopen the app from Telegram.',
    somethingWentWrong: 'Something went wrong',
    reload: 'Reload',
    retry: 'Retry',
    appTitle: 'Tap tap',
    appSubtitle: 'and tap tap tap',
    saved: 'Saved',
    loadingLabel: 'Loading',
    totalClicks: 'Total clicks',
    recharging: 'Recharging',
    tap: 'Tap',
    energy: 'Energy',
    profileUnavailable: 'Profile unavailable',
    couldNotLoadProfile: 'We could not load your profile.',
    couldNotSyncClicks: 'Could not sync your clicks',
    leaders: 'Leaders',
    topN: 'Top {n}',
    sortClicks: 'Clicks',
    you: 'You',
    yourCurrentPosition: 'Your current position',
    leaderboardUnavailable: 'Leaderboard unavailable',
    checkConnection: 'Check your connection and try again.',
    couldNotLoadLeaderboard: 'Could not load the leaderboard',
    noPlayersYet: 'No players yet',
    emptyBody: 'Be the first to tap. Your rank will appear here.',
    tabPlay: 'Play',
    tabLeaders: 'Leaders',
    notFound: 'Page not found',
    notFoundBody: 'This screen does not exist.',
    backToGame: 'Back to the game',
  },
  ru: {
    needTelegram: 'Нужен Telegram',
    openFromTelegram: 'Откройте приложение из Telegram.',
    sessionExpired: 'Сессия истекла',
    sessionExpiredBody: 'Сессия больше недействительна. Откройте приложение из Telegram заново.',
    somethingWentWrong: 'Что-то пошло не так',
    reload: 'Обновить',
    retry: 'Повторить',
    appTitle: 'Тапай',
    appSubtitle: 'тап-тап-тап',
    saved: 'Сохранено',
    loadingLabel: 'Загрузка',
    totalClicks: 'Всего кликов',
    recharging: 'Восстановление',
    tap: 'Тап',
    energy: 'Энергия',
    profileUnavailable: 'Профиль недоступен',
    couldNotLoadProfile: 'Не удалось загрузить профиль.',
    couldNotSyncClicks: 'Не удалось синхронизировать клики',
    leaders: 'Лидеры',
    topN: 'Топ-{n}',
    sortClicks: 'Клики',
    you: 'Вы',
    yourCurrentPosition: 'Ваша текущая позиция',
    leaderboardUnavailable: 'Лидерборд недоступен',
    checkConnection: 'Проверьте соединение и попробуйте снова.',
    couldNotLoadLeaderboard: 'Не удалось загрузить лидерборд',
    noPlayersYet: 'Пока нет игроков',
    emptyBody: 'Кликни первым — твоё место появится здесь.',
    tabPlay: 'Играть',
    tabLeaders: 'Лидеры',
    notFound: 'Страница не найдена',
    notFoundBody: 'Такого экрана нет.',
    backToGame: 'Вернуться в игру',
  },
} as const satisfies Record<Lang, Record<string, string>>

export type MessageKey = keyof (typeof messages)['en']

export const keys = Object.fromEntries(Object.keys(messages.en).map((k) => [k, k])) as {
  readonly [K in MessageKey]: K
}

function detectLang(): Lang {
  const code = getWebApp()?.initDataUnsafe.user?.language_code
  return code?.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

const lang = detectLang()

export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  let text: string = messages[lang][key]
  if (vars) {
    for (const [name, value] of Object.entries(vars)) text = text.replace(`{${name}}`, String(value))
  }
  return text
}
