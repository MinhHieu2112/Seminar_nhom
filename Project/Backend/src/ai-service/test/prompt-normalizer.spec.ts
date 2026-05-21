import {
  normalizeOcrText,
  resolveVietnameseDate,
} from '../utils/prompt-normalizer';

describe('PromptNormalizer & DateResolver', () => {
  describe('normalizeOcrText', () => {
    it('should correct letter O/o to digit 0 in times', () => {
      expect(normalizeOcrText('09hOO')).toBe('09h00');
      expect(normalizeOcrText('18hOo')).toBe('18h00');
      expect(normalizeOcrText('8h3O')).toBe('8h30');
      expect(normalizeOcrText('O9h00')).toBe('09h00');
      expect(normalizeOcrText('o8h30')).toBe('08h30');
    });

    it('should remove extra whitespaces around time indicators', () => {
      expect(normalizeOcrText('09 h 00')).toBe('09h00');
      expect(normalizeOcrText('18  h  30')).toBe('18h30');
    });

    it('should trim and normalize duplicate newlines', () => {
      expect(normalizeOcrText('Line 1\n\n\nLine 2')).toBe('Line 1\nLine 2');
    });
  });

  describe('resolveVietnameseDate', () => {
    const today = '2026-05-20'; // Wednesday (base date)

    it('should resolve relative terms today and tomorrow', () => {
      expect(resolveVietnameseDate('hôm nay', today)).toBe('2026-05-20');
      expect(resolveVietnameseDate('ngày mai', today)).toBe('2026-05-21');
      expect(resolveVietnameseDate('ngày mốt', today)).toBe('2026-05-22');
    });

    it('should resolve weekday CN/chủ nhật and thứ 2-7 in current week', () => {
      // Wednesday is May 20, Saturday is May 23
      expect(resolveVietnameseDate('Thứ 7 này', today)).toBe('2026-05-23');
      // Thursday is May 21
      expect(resolveVietnameseDate('Thứ 5', today)).toBe('2026-05-21');
    });

    it('should resolve weekdays pushing to next week if target day is passed or explicitly next week', () => {
      // Monday May 18 has passed, so "Thứ 2" or "Thứ 2 tuần tới" is May 25
      expect(resolveVietnameseDate('Thứ 2 tuần tới', today)).toBe('2026-05-25');
      expect(resolveVietnameseDate('Thứ 2', today)).toBe('2026-05-25');
      // Friday May 22 is in current week, but "Thứ 6 tuần tới" pushes it to May 29
      expect(resolveVietnameseDate('Thứ 6 tuần tới', today)).toBe('2026-05-29');
    });
  });
});
