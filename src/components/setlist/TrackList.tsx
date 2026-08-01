'use client';

import { useSetlistStore } from '@/hooks/useSetlistStore';
import { TrackCard } from './TrackCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';

export function TrackList() {
  const { tracks, reorderTracks, removeTrack } = useSetlistStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTracks(active.id as string, over.id as string);
    }
  };

  if (tracks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No tracks available.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-6 pb-32">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {tracks.map((track) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TrackCard track={track} onRemove={removeTrack} />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>
    </div>
  );
}
