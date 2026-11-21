// src/logic/MYSaveRepository.js

const MY_SAVE_KEY = 'COMGONG_SAVE_CHECKPOINT_V1';
const MY_SCHEMA_VERSION = 1;

export class MYSaveRepository {
  // 주간 완료 상태 저장
  MYSaveCheckpoint(stateObject) {
    try {
      const payload = {
        schemaVersion: MY_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        data: stateObject,
      };
      const serialized = JSON.stringify(payload);
      localStorage.setItem(MY_SAVE_KEY, serialized);
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: '저장 공간 부족 또는 직렬화 오류로 저장에 실패했습니다.' };
    }
  }

  // 저장된 체크포인트 불러오기 및 유효성 검사
  MYLoadCheckpoint() {
    try {
      const raw = localStorage.getItem(MY_SAVE_KEY);
      if (!raw) return { ok: false, reason: '저장된 기록이 없습니다.' };

      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== MY_SCHEMA_VERSION || !parsed.data || !parsed.data.player) {
        return { ok: false, reason: '저장 데이터 형식이 손상되었거나 버전이 일치하지 않습니다.' };
      }

      const { player, elapsedWeek } = parsed.data;
      if (
        typeof player.money !== 'number' ||
        player.money < 0 ||
        typeof elapsedWeek !== 'number' ||
        elapsedWeek < 0 ||
        elapsedWeek > 192
      ) {
        return { ok: false, reason: '저장 데이터 수치가 유효 범위를 벗어났습니다.' };
      }

      return { ok: true, data: parsed.data };
    } catch (error) {
      return { ok: false, reason: '손상된 JSON 데이터로 인해 불러올 수 없습니다.' };
    }
  }

  // 저장 기록 삭제 (새 게임 덮어쓰기용)
  MYClearCheckpoint() {
    localStorage.removeItem(MY_SAVE_KEY);
  }
}