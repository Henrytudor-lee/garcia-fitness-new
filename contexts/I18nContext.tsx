'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Locale = 'en' | 'zh';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Nav & Common
    'app.name': 'GFIT',
    'nav.training': 'Training',
    'nav.library': 'Library',
    'nav.stats': 'Stats',
    'nav.profile': 'Profile',
    // Timer
    'timer.duration': 'Duration',
    'timer.volume': 'Volume',
    'timer.exercises': 'Exercises',
    'timer.rest': 'Rest',
    'timer.start': 'Start Training',
    'timer.starting': 'Starting...',
    'timer.end_training': 'End Training',
    'timer.quick_start': 'Quick Start',
    // Workout
    'workout.current': 'Current Workout',
    'workout.in_progress': 'In Progress',
    'workout.ready': 'Ready',
    'workout.tap_plus': 'Tap + to add exercises',
    'workout.no_active': 'No active workout',
    'workout.no_workouts': 'Start training to see exercises',
    'workout.sets': 'sets',
    'workout.set': 'set',
    'workout.total_vol': 'total volume',
    'workout.reps': 'reps',
    // History
    'history.title': 'History',
    'history.today': 'Today',
    'history.yesterday': 'Yesterday',
    'history.monthly_vol': 'Monthly Volume',
    'history.start_tracking': 'Start training to track progress',
    'history.completed': 'Completed',
    'history.in_progress': 'In Progress',
    'history.session_detail': 'Session Detail',
    'history.duration': 'Duration',
    'history.volume': 'Volume',
    'history.sets': 'Sets',
    'history.no_exercises': 'No exercises recorded',
    // Edit modal
    'edit.title': 'Edit Exercise',
    'edit.add_set': 'Add Set',
    'edit.delete_set': 'Delete',
    'edit.save': 'Save',
    'edit.cancel': 'Cancel',
    'edit.weight': 'Weight',
    'edit.reps': 'Reps',
    'edit.unit': 'Unit',
    'edit.set_num': 'Set {n}',
    // Add exercise modal
    'add.select_muscle': 'Select Muscle',
    'add.select_equip': 'Select Equipment',
    'add.search': 'Search exercises...',
    'add.all': 'All',
    // Theme & i18n
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    // Profile
    'profile.logout': 'Log Out',
    'profile.login_required': 'Login Required',
    'profile.login_hint': 'Please login to view your profile',
    'profile.login_btn': 'Go to Login',
    'profile.active_streak': 'Active Streak',
    'profile.days': 'DAYS',
    'profile.level': 'Level',
    'profile.lv': 'LV',
    'profile.language': 'Language',
    'profile.ai_coach': 'AI Coach',
    'profile.soon': 'Soon',
    'profile.ai_subtitle': 'Personalized insights',
    'profile.settings': 'Settings',
    'profile.settings_sub': 'Preferences & Privacy',
    'profile.logout_sub': 'Switch account or exit',
    'profile.theme': 'Theme',
    // Login
    'login.welcome': 'Welcome Back',
    'login.subtitle': 'Unleash your peak potential today.',
    'login.email': 'Email address',
    'login.password': 'Password',
    'login.login_btn': 'Login',
    'login.or_continue': 'Or continue with',
    'login.new_user': 'New to the grit?',
    'login.create': 'Create account',
    // Library
    'library.title': 'Exercise Library',
    'library.subtitle': 'Access over 500+ professional movements with form guidance and performance data.',
    'library.search': 'Search exercises...',
    'library.equip': 'Select Equipment',
    'library.muscle': 'Muscle Focus',
    // Stats
    'stats.title': 'Statistics',
    'stats.subtitle': 'Track your progress',
    'stats.sessions': 'Sessions',
    'stats.volume': 'Volume',
    'stats.avg_sets': 'Avg Sets',
    'stats.weekly_volume': 'Weekly Volume',
    'stats.last_8_weeks': 'Last 8 weeks',
    'stats.muscle_distribution': 'Muscle Distribution',
    'stats.most_trained': 'Most Trained',
    'stats.select_exercise': 'Select Exercise',
    'stats.max_weight': 'Max Weight',
    'stats.total_sets': 'Total Sets',
    'stats.recorded': 'recorded',
    'stats.weight_progress': 'Weight Progress',
    'stats.records': 'records',
    'stats.no_history': 'No exercise history yet. Start training to see stats.',
    'stats.select_above': 'Select an exercise above to view your progress',
    // Guest prompt
    'guest.start_training_title': 'Ready to Train?',
    'guest.prompt_subtitle': 'Guest Mode',
    'guest.start_training_hint': 'Create a free account to save your workout progress and track your gains over time.',
    'guest.login_btn': 'Login',
    'guest.register_btn': 'Create Account',
    'guest.later': 'Maybe Later',
  },
  zh: {
    // Nav & Common
    'app.name': 'GFIT',
    'nav.training': '训练',
    'nav.library': '动作库',
    'nav.stats': '数据',
    'nav.profile': '我的',
    // Timer
    'timer.duration': '时长',
    'timer.volume': '总量',
    'timer.exercises': '动作数',
    'timer.rest': '休息',
    'timer.start': '开始训练',
    'timer.starting': '启动中...',
    'timer.end_training': '结束训练',
    'timer.quick_start': '快速开始',
    // Workout
    'workout.current': '当前训练',
    'workout.in_progress': '进行中',
    'workout.ready': '准备就绪',
    'workout.tap_plus': '点击 + 添加动作',
    'workout.no_active': '暂无进行中的训练',
    'workout.no_workouts': '开始训练后即可查看动作',
    'workout.sets': '组',
    'workout.set': '组',
    'workout.total_vol': '总重量',
    'workout.reps': '次',
    // History
    'history.title': '历史记录',
    'history.today': '今天',
    'history.yesterday': '昨天',
    'history.monthly_vol': '月训练量',
    'history.start_tracking': '开始训练以追踪进度',
    'history.completed': '已完成',
    'history.in_progress': '进行中',
    'history.session_detail': '训练详情',
    'history.duration': '时长',
    'history.volume': '训练量',
    'history.sets': '组数',
    'history.no_exercises': '暂无动作记录',
    // Edit modal
    'edit.title': '编辑动作',
    'edit.add_set': '添加组',
    'edit.delete_set': '删除',
    'edit.save': '保存',
    'edit.cancel': '取消',
    'edit.weight': '重量',
    'edit.reps': '次数',
    'edit.unit': '单位',
    'edit.set_num': '第 {n} 组',
    // Add exercise modal
    'add.select_muscle': '选择肌群',
    'add.select_equip': '选择器械',
    'add.search': '搜索动作...',
    'add.all': '全部',
    // Theme & i18n
    'theme.dark': '深色',
    'theme.light': '浅色',
    // Profile
    'profile.logout': '退出登录',
    'profile.login_required': '请先登录',
    'profile.login_hint': '登录后可查看您的个人资料',
    'profile.login_btn': '去登录',
    'profile.active_streak': '连续训练',
    'profile.days': '天',
    'profile.level': '等级',
    'profile.lv': 'LV',
    'profile.language': '语言',
    'profile.ai_coach': 'AI 教练',
    'profile.soon': '即将推出',
    'profile.ai_subtitle': '个性化洞察',
    'profile.settings': '设置',
    'profile.settings_sub': '偏好与隐私',
    'profile.logout_sub': '切换账号或退出',
    'profile.theme': '主题',
    // Login
    'login.welcome': '欢迎回来',
    'login.subtitle': '今天就释放你的巅峰潜力。',
    'login.email': '电子邮箱',
    'login.password': '密码',
    'login.login_btn': '登录',
    'login.or_continue': '或以下方式继续',
    'login.new_user': '新来的？',
    'login.create': '创建账号',
    // Library
    'library.title': '动作库',
    'library.subtitle': '访问 500+ 专业动作，含动作指导与表现数据。',
    'library.search': '搜索动作...',
    'library.equip': '选择器械',
    'library.muscle': '肌群选择',
    // Stats
    'stats.title': '数据统计',
    'stats.subtitle': '追踪你的训练进度',
    'stats.sessions': '训练次数',
    'stats.avg_sets': '平均组数',
    'stats.weekly_volume': '每周容量',
    'stats.last_8_weeks': '近8周',
    'stats.muscle_distribution': '肌肉分布',
    'stats.most_trained': '最常训练',
    'stats.select_exercise': '选择动作',
    'stats.max_weight': '最大重量',
    'stats.total_sets': '总组数',
    'stats.recorded': '条记录',
    'stats.weight_progress': '重量进步',
    'stats.records': '条记录',
    'stats.no_history': '暂无训练记录，开始训练来查看数据。',
    'stats.select_above': '在上方选择一个动作来查看进度',
    // Guest prompt
    'guest.start_training_title': '准备好训练了吗？',
    'guest.prompt_subtitle': '游客模式',
    'guest.start_training_hint': '创建免费账号来保存训练记录，持续追踪你的进步。',
    'guest.login_btn': '登录',
    'guest.register_btn': '创建账号',
    'guest.later': '稍后再说',
  },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem('locale') as Locale | null;
    if (stored) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('locale', l);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[locale][key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
