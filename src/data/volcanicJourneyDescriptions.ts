/**
 * 火山旅梦CG图片特殊简介配置
 */

export interface VolcanicJourneyDescription {
  id: string;
  description: string;
  isMultiline?: boolean;
}

export const volcanicJourneyDescriptions: VolcanicJourneyDescription[] = [
  {
    id: 'in_the_night',
    description: '烂漫的灯光中，绒毛像是飞絮，飘散在空中。又像是星火，被吹落在这个无人知晓的夏夜。'
  },
  {
    id: 'sing_with_me',
    description: '这是一场漫长的流浪，我在折断桅杆的船上写信（♪）故乡被我扔在一百里外的身后，夏日的太阳难道不令人着迷吗（♪） 北风绵延百里，造访第一座火山（♪）延荒芜的小径走吧，总会重逢（♪）',
    isMultiline: true
  },
  {
    id: 'ill_miss_you',
    description: 'You know, you know, I\'ve always needed you.\nYou know, you know, I really really miss you.',
    isMultiline: true
  },
  {
    id: 'rain_rain_go_away',
    description: '但在这无比短暂的时间里，我很愿意注视着眼前美丽的风景，还有你，阿黛尔……流淌过大地的岩浆啊，请你，慢些走。'
  },
  {
    id: 'dancing_in_the_lava',
    description: '感到疲惫的话，就停下来休息休息，或者大哭一场。很简单，毕竟这世上像你这样可爱的女孩可不多见。虽然不幸总是找上你，但要记住，阿黛尔，你拥有的爱一点也不比别人少。',
    isMultiline: true
  },
  {
    id: 'last_not_last',
    description: '一切过去的事情都不会真的过去，它们总会换一种方式陪在你的身边。'
  },
  {
    id: 'enjoy_summer',
    description: '阿黛尔：多利先生，你真的已经和小黑羊们说清楚了，不能再这样捣乱了吗？\n多利：嗯......再捣乱的话，我会否认他们是我的一部分。',
    isMultiline: true
  },
  {
    id: 'so_long_adele',
    description: '汐斯塔迁移了一百公里，站在新址的地块边缘向东遥望，还能看到远处的火山。\n傍晚灯光亮起，晚霞将天染成粉红色，\n星星连成一串，霓虹的梦从草叶中升起，\n不论是远行的旅客还是归乡的人，都请安静坐下来，在晚风中听一曲木吉他吧。',
    isMultiline: true
  },
  {
    id: 'misty_memory_day',
    description: 'You\'re the one\nThe setting sun I\'ll long for, \'til kingdom come\nPlease don\'t leave me lonely\nPlease don\'t just fade away with my stolen heart',
    isMultiline: true
  },
  {
    id: 'misty_memory_night',
    description: 'Anywhere\nAnywhere\nAnywhere I go\nAnywhere\nAnywhere\nAnywhere I go I\'ll miss you',
    isMultiline: true
  }
];

/**
 * 根据拼图名称获取火山旅梦的特殊简介
 * @param puzzleName 拼图名称
 * @returns 特殊简介文本，如果不是火山旅梦图片则返回null
 */
export function getVolcanicJourneyDescription(puzzleName: string): string | null {
  // 处理可能的ID匹配
  let targetId = '';
  
  // 根据拼图名称映射到对应的ID
  switch (puzzleName.toLowerCase()) {
    case 'inthenight':
      targetId = 'in_the_night';
      break;
    case 'singwithme':
      targetId = 'sing_with_me';
      break;
    case 'i\'llmissyou':
      targetId = 'ill_miss_you';
      break;
    case 'rainraingoaway':
      targetId = 'rain_rain_go_away';
      break;
    case 'dancinginthelava':
      targetId = 'dancing_in_the_lava';
      break;
    case 'lastnotlast':
      targetId = 'last_not_last';
      break;
    case 'enjoysummer':
      targetId = 'enjoy_summer';
      break;
    case 'solongadele':
      targetId = 'so_long_adele';
      break;
    case 'mistymemory_day':
      targetId = 'misty_memory_day';
      break;
    case 'mistymemory_night':
      targetId = 'misty_memory_night';
      break;
    default:
      return null;
  }
  
  const description = volcanicJourneyDescriptions.find(desc => desc.id === targetId);
  return description ? description.description : null;
}

/**
 * 检查是否为火山旅梦图片
 * @param puzzleName 拼图名称
 * @returns 是否为火山旅梦图片
 */
export function isVolcanicJourneyPuzzle(puzzleName: string): boolean {
  return getVolcanicJourneyDescription(puzzleName) !== null;
}
