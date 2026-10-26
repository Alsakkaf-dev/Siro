import React from 'react';
import { useGameStore } from '../../store/useGameStore.js';

export default function XpToast() {
  const toast = useGameStore((s) => s.toast);
  if (!toast) return null;
  return <div className={`xp-toast ${toast.kind}`}>{toast.msg}</div>;
}
