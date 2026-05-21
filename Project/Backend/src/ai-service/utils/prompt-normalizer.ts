export function normalizeTextPrompt(prompt: string): string {
  if (!prompt) return '';
  return (
    prompt
      // Xóa các ký tự Unicode không cần thiết (nếu không cần thiết cho lịch)
      .replace(
        /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g,
        '',
      )
      // Gộp khoảng trắng và tab
      .replace(/[^\S\r\n]+/g, ' ')
      // Gộp nhiều dòng trống thành 1 dấu phẩy hoặc khoảng trắng để tiết kiệm token xuống dòng (\n tốn 1 token)
      .replace(/(?:\r?\n\s*){2,}/g, '\n')
      .trim()
      .slice(0, 2000)
  );
}

// Hàm hỗ trợ tạo Context thời gian chuẩn cho AI
export function generateDateContext(): string {
  const now = new Date();
  const days = [
    'Chủ Nhật',
    'Thứ 2',
    'Thứ 3',
    'Thứ 4',
    'Thứ 5',
    'Thứ 6',
    'Thứ 7',
  ];
  const dayName = days[now.getDay()];
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `Hôm nay là ${dayName}, ngày ${dateStr}`;
}

export function normalizeOcrText(text: string): string {
  if (!text) return '';
  return (
    text
      // Sửa lỗi chữ O/o thay vì số 0 trong chỉ số giờ (ví dụ: 09hOO -> 09h00, 18hOo -> 18h00)
      .replace(/\b(\d{1,2})h[Oo0]{2}\b/g, '$1h00')
      .replace(/\b(\d{1,2})h([Oo]0|0[Oo]|[Oo]{2})\b/g, '$1h00')
      // Sửa các số giờ có chứa chữ O thay vì số 0 đứng lẻ (ví dụ: 09h3O -> 09h30, 8h3O -> 8h30)
      .replace(/\b(\d{1,2})h(\d)[Oo]\b/g, '$1h$20')
      .replace(/\b(\d{1,2})h[Oo](\d)\b/g, '$1h0$2')
      // Sửa lỗi chữ O/o thay vì số 0 ở đầu giờ (ví dụ: O9h00 -> 09h00, o8h30 -> 08h30)
      .replace(/\b[Oo](\d)[hH](\d{2})\b/g, '0$1h$2')
      // Sửa lỗi khoảng trắng thừa giữa chữ và số chỉ giờ (ví dụ: 09 h 00 -> 09h00)
      .replace(/(\d{1,2})\s*[hH]\s*(\d{2})/g, '$1h$2')
      // Loại bỏ nhiều khoảng trắng liên tiếp
      .replace(/[^\S\r\n]+/g, ' ')
      // Chuẩn hóa dòng trống thừa
      .replace(/(?:\r?\n\s*){2,}/g, '\n')
      .trim()
  );
}

export function resolveVietnameseDate(
  dateRef: string,
  todayStr: string,
): string {
  if (!dateRef) return todayStr;

  const cleanRef = dateRef.toLowerCase().trim();
  const baseDate = new Date(todayStr); // expected format YYYY-MM-DD
  if (isNaN(baseDate.getTime())) {
    return todayStr;
  }

  if (cleanRef.includes('hôm nay') || cleanRef.includes('nay')) {
    return todayStr;
  }
  if (cleanRef.includes('ngày mai') || cleanRef.includes('mai')) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  if (cleanRef.includes('ngày mốt') || cleanRef.includes('mốt')) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }

  // Weekday parsing
  let targetDayNum = -1; // 0: Sunday, 1: Monday, ..., 6: Saturday
  if (
    cleanRef.includes('thứ hai') ||
    cleanRef.includes('thứ 2') ||
    cleanRef.includes('t2')
  ) {
    targetDayNum = 1;
  } else if (
    cleanRef.includes('thứ ba') ||
    cleanRef.includes('thứ 3') ||
    cleanRef.includes('t3')
  ) {
    targetDayNum = 2;
  } else if (
    cleanRef.includes('thứ tư') ||
    cleanRef.includes('thứ 4') ||
    cleanRef.includes('t4')
  ) {
    targetDayNum = 3;
  } else if (
    cleanRef.includes('thứ năm') ||
    cleanRef.includes('thứ 5') ||
    cleanRef.includes('t5')
  ) {
    targetDayNum = 4;
  } else if (
    cleanRef.includes('thứ sáu') ||
    cleanRef.includes('thứ 6') ||
    cleanRef.includes('t6')
  ) {
    targetDayNum = 5;
  } else if (
    cleanRef.includes('thứ bảy') ||
    cleanRef.includes('thứ 7') ||
    cleanRef.includes('t7')
  ) {
    targetDayNum = 6;
  } else if (cleanRef.includes('chủ nhật') || cleanRef.includes('cn')) {
    targetDayNum = 0;
  }

  if (targetDayNum !== -1) {
    const todayDayNum = baseDate.getDay(); // 0: Sunday, 1: Monday, etc.
    let daysToAdd = targetDayNum - todayDayNum;
    const isNextWeek =
      cleanRef.includes('tuần tới') ||
      cleanRef.includes('tuần sau') ||
      cleanRef.includes('sau') ||
      cleanRef.includes('tới');

    if (daysToAdd <= 0) {
      daysToAdd += 7;
    } else if (isNextWeek) {
      daysToAdd += 7;
    }

    const targetDate = new Date(baseDate);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    return targetDate.toISOString().split('T')[0];
  }

  return todayStr;
}
