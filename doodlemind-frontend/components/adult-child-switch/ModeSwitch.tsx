'use client';

import { Switch } from '@nextui-org/switch';
import { Tooltip } from '@nextui-org/tooltip';
import { AdultIcon } from './AdultIcon';
import { ChildIcon } from './ChildIcon';
import React, { useState, useEffect } from 'react';

export enum UserMode {
  Adult = 'adult',
  Child = 'child',
}

export default function ModeSwitch() {
  const [mode, setMode] = useState<UserMode>(
    () => (localStorage.getItem('userMode') as UserMode) || UserMode.Adult
  );

  useEffect(() => {
    localStorage.setItem('userMode', mode);
  }, [mode]);

  return (
    <Tooltip
      content={
        <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
          {mode === UserMode.Child ? (
            <>
              <span role="img" aria-label="Child">🧒</span> Child Mode
            </>
          ) : (
            <>
              <span role="img" aria-label="Adult">👨‍💼</span> Adult Mode
            </>
          )}
        </div>
      }
      placement="bottom"
      color="secondary"
      delay={0}
      closeDelay={0}
      motionProps={{
        variants: {
          exit: { opacity: 0, scale: 0.95 },
          enter: { opacity: 1, scale: 1 },
        },
        transition: {
          duration: 0.15,
        },
      }}
    >
     <Switch
  className="absolute top-16 right-2 sm:top-5 sm:right-60"
  size="lg"
  color="secondary"
  isSelected={mode === UserMode.Child}
  onValueChange={(value) => {
    setMode(value ? UserMode.Child : UserMode.Adult);
  }}
  thumbIcon={({ isSelected, className }) => (
    <div
      className={`${className} flex items-center justify-center bg-secondary rounded-full w-5 h-5`}
    >
      {isSelected ? "🧒" : "👨‍💼"}
    </div>
  )}
/>    
    </Tooltip>
  );
}
