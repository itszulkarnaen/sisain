'use client';

import React from 'react';
import { Delete } from 'lucide-react';

interface NumpadProps {
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
}

export const Numpad: React.FC<NumpadProps> = ({
  onDigitPress,
  onBackspace,
}) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['000', '0', 'backspace'],
  ];

  return (
    <div className="grid grid-cols-3 gap-2 px-1">
      {keys.flat().map((key, idx) => {
        if (key === 'backspace') {
          return (
            <button
              key={idx}
              type="button"
              onClick={onBackspace}
              className="h-12 rounded-xl bg-orange-50/70 hover:bg-orange-100 text-slate-700 font-bold flex items-center justify-center active:scale-95 transition shadow-xs"
            >
              <Delete className="w-5 h-5 text-slate-700" />
            </button>
          );
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onDigitPress(key)}
            className="h-12 rounded-xl bg-orange-50/70 hover:bg-orange-100/90 text-slate-800 text-lg font-bold flex items-center justify-center active:scale-95 transition shadow-xs"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
};

