export enum AppMode {
  HUB_PAGE = 'HUB_PAGE',
  ARTICLE_PLAN = 'ARTICLE_PLAN',
  ARTICLE = 'ARTICLE',
  TREND_ARTICLE = 'TREND_ARTICLE'
}

export enum ArticleCategory {
  DAILY_WELLBEING = '日常保養・Daily Wellbeing',
  SEASONAL_LIVING = '季節調整・Seasonal Living',
  ACTIVE_LIVING = '運動與動能・Active Living',
  NUTRITION_BASICS = '飲食與補給基礎知識・Nutrition Basics',
  PLANT_NOTES = '自然植物 × 生活萃取・Plant Notes',
  FEEL_GOOD_NOTES = '心情 × 情緒價值・Feel Good Notes',
  TREND_NOTES = '時事生活・Trend Notes'
}

export interface GeneratorInputs {
  category: ArticleCategory | string;
  topic: string;
  wordCount: string; // e.g., "800-1000"
  quantity: number; // For Article Plan
  trendTopic: string; // For Trend Article
}

export interface HistoryItem {
  id: string;
  mode: AppMode;
  timestamp: number;
  title: string;
  content: string;
}