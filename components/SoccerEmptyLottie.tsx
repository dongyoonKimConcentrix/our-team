'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

export default function SoccerEmptyLottie() {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch('/soccer-empty-state.json')
      .then((res) => res.json())
      .then(setAnimationData);
  }, []);

  if (!animationData) return null;

  return (
    <Lottie
      animationData={animationData}
      loop
      className="w-64 h-64 max-w-[264px] max-h-[264px]"
    />
  );
}
