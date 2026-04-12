// ===== VIYA i18n — Language Support =====
const strings = {
  en: {
    // Navigation
    home: 'Home', money: 'Money', chat: 'Chat', habits: 'Habits', profile: 'Profile',
    // Home
    greeting_morning: 'Good Morning', greeting_afternoon: 'Good Afternoon', greeting_evening: 'Good Evening', greeting_night: 'Good Night',
    money_left_today: 'MONEY LEFT TODAY', daily_budget: 'daily budget', over_budget: 'Over budget by',
    income: 'INCOME', expenses: 'EXPENSES', saved: 'SAVED',
    // Actions
    add_expense: 'Add Expense', briefing: 'Briefing', earn_more: 'Earn More', goals: 'Goals',
    report: 'Report', tax_save: 'Tax Save', plan_day: 'Plan Day',
    // Expenses
    scan_bill: 'Scan Bill', add: 'Add', quick_add_expense: 'QUICK ADD EXPENSE',
    spent: 'SPENT', today: 'Today', yesterday: 'Yesterday',
    // Habits
    daily_habits: 'Daily Habits', streak: 'Streak', best: 'Best', done_today: 'Done Today',
    start_your_streak: 'Start Your Streak!',
    // Goals
    savings_goals: 'Savings Goals', new_goal: 'New Goal', total_saved: 'TOTAL SAVED',
    // Profile
    settings: 'Settings', appearance: 'Appearance', notifications: 'Notifications',
    reminders: 'Reminders', redo_setup: 'Redo Setup', privacy: 'Privacy & Security',
    help: 'Help & Support', sign_out: 'Sign Out', language: 'Language',
    invite_friends: 'Invite Friends, Earn Rewards', family_mode: 'Family Mode',
    // Chat
    ask_viya: 'Ask Viya anything...', send: 'Send',
    // General
    loading: 'Loading...', no_data: 'No data yet', cancel: 'Cancel', save: 'Save', delete: 'Delete',
    confirm: 'Confirm', share: 'Share',
  },
  hi: {
    // Navigation
    home: 'होम', money: 'पैसा', chat: 'चैट', habits: 'आदतें', profile: 'प्रोफाइल',
    // Home
    greeting_morning: 'सुप्रभात', greeting_afternoon: 'नमस्ते', greeting_evening: 'शुभ संध्या', greeting_night: 'शुभ रात्रि',
    money_left_today: 'आज बचे पैसे', daily_budget: 'दैनिक बजट', over_budget: 'बजट से ज़्यादा',
    income: 'आय', expenses: 'खर्च', saved: 'बचत',
    // Actions
    add_expense: 'खर्च जोड़ें', briefing: 'ब्रीफिंग', earn_more: 'और कमाएं', goals: 'लक्ष्य',
    report: 'रिपोर्ट', tax_save: 'टैक्स बचाएं', plan_day: 'दिन प्लान करें',
    // Expenses
    scan_bill: 'बिल स्कैन', add: 'जोड़ें', quick_add_expense: 'जल्दी खर्च जोड़ें',
    spent: 'खर्च', today: 'आज', yesterday: 'कल',
    // Habits
    daily_habits: 'दैनिक आदतें', streak: 'स्ट्रीक', best: 'सर्वश्रेष्ठ', done_today: 'आज पूरा',
    start_your_streak: 'अपनी स्ट्रीक शुरू करें!',
    // Goals
    savings_goals: 'बचत लक्ष्य', new_goal: 'नया लक्ष्य', total_saved: 'कुल बचत',
    // Profile
    settings: 'सेटिंग्स', appearance: 'दिखावट', notifications: 'सूचनाएं',
    reminders: 'रिमाइंडर', redo_setup: 'दोबारा सेटअप', privacy: 'गोपनीयता',
    help: 'मदद और सपोर्ट', sign_out: 'साइन आउट', language: 'भाषा',
    invite_friends: 'दोस्तों को बुलाएं, इनाम पाएं', family_mode: 'फैमिली मोड',
    // Chat
    ask_viya: 'Viya से कुछ भी पूछो...', send: 'भेजें',
    // General
    loading: 'लोड हो रहा है...', no_data: 'अभी कोई डेटा नहीं', cancel: 'रद्द करें', save: 'सेव करें', delete: 'हटाएं',
    confirm: 'पक्का करें', share: 'शेयर करें',
  }
}

export function t(key) {
  const lang = localStorage.getItem('mv_lang') || 'en'
  return strings[lang]?.[key] || strings.en[key] || key
}

export function getLang() {
  return localStorage.getItem('mv_lang') || 'en'
}

export function setLang(lang) {
  localStorage.setItem('mv_lang', lang)
}
