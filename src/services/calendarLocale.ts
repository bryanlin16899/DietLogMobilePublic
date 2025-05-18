import { I18nConfig, NativeDateService } from "@ui-kitten/components";

const i18n: I18nConfig = {
  dayNames: {
    short: ['日', '一', '二', '三', '四', '五', '六'],
    long: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  },
  monthNames: {
    short: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    long: [
      '一月',
      '二月', 
      '三月',
      '四月',
      '五月',
      '六月',
      '七月',
      '八月',
      '九月',
      '十月',
      '十一月',
      '十二月',
    ],
  },
};
export const localeDateService = new NativeDateService('zh', { i18n, startDayOfWeek: 1, format: 'YYYY / MM / DD' });
