'use client';

import React, { useState } from 'react';
import PizzaPartySongSegment from './PizzaPartySongSegment';

interface SongSegmentProps {
  songUrl?: string;
  eventId?: string;
}

export default function SongSegment({ eventId = 'event-rehearsal' }: SongSegmentProps) {
  const [loadError, setLoadError] = useState(false);

  const handleError = () => {
    setLoadError(true);
  };

  return (
    <>
      <PizzaPartySongSegment eventId={eventId} />
      {loadError && (
        <div className="sr-only">지정된 음원 파일을 로드하지 못했습니다</div>
      )}
    </>
  );
}
