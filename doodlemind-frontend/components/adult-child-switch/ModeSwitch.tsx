'use client';

import { Switch } from '@nextui-org/switch';
import { Tooltip } from '@nextui-org/tooltip';
import { AdultIcon } from './AdultIcon'; // Assuming these components are already defined
import { ChildIcon } from './ChildIcon';
import React, { useState, useEffect } from 'react';

export enum UserMode {
  Adult = 'adult',
  Child = 'child',
}

export default function ModeSwitch() {
  const [mode, setMode] = useState<UserMode>(UserMode.Adult);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Ensure localStorage is accessed only in the browser
      const storedMode = localStorage.getItem('userMode');
      if (storedMode) {
        setMode(storedMode as UserMode);
      }
    }
  }, []); // Only run this on mount

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Save mode to localStorage only in the browser
      localStorage.setItem('userMode', mode);
    }
  }, [mode]);

  return (
    <Tooltip
      content={
        <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
          {mode === UserMode.Child ? (
            <>
              <span role="img" aria-label="Child">🧒</span> Child Mode ON
            </>
          ) : (
            <>
              <span role="img" aria-label="Adult">👨‍💼</span> Child Mode OFF
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
        aria-label={mode === UserMode.Child ? "Switch to Adult Mode" : "Switch to Child Mode"} // Added aria-label here
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
