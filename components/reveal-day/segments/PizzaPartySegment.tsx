'use client';

import React from 'react';
import PizzaPartySongSegment from './PizzaPartySongSegment';

interface PizzaPartySegmentProps {
  eventId?: string;
  initialSeconds?: number;
  isPausedInitial?: boolean;
}

export default function PizzaPartySegment(props: PizzaPartySegmentProps) {
  return <PizzaPartySongSegment {...props} />;
}
