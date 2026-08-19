'use client';

import { useSetlistStore } from '@/hooks/useSetlistStore';
import { TrackCard } from './TrackCard';
import { AddTrackInput } from './AddTrackInput';
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
  const { tracks, reorderTracks, removeTrack, toggleExclude } = useSetlistStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
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
    <div className="w-full max-w-4xl mx-auto px-6 pb-48">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {tracks.map((track, index) => {
              const currentSection = track.section || 'Main Set';
              const prevSection = index > 0 ? (tracks[index - 1].section || 'Main Set') : null;
              const isNewSection = index === 0 || currentSection !== prevSection;

              return (
                <div key={track.id}>
                  {isNewSection && (
                    <div className={`${index === 0 ? 'pt-2' : 'pt-6'} pb-2 flex items-center gap-3 select-none`}>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/50 to-border/20" />
                      <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-secondary/60 text-setdrift-gold border border-setdrift-gold/30 shadow-[0_0_10px_rgba(244,168,54,0.12)]">
                        {currentSection}
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border/50 to-border/20" />
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TrackCard track={track} onRemove={removeTrack} onToggleExclude={toggleExclude} />
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        </SortableContext>

      </DndContext>
      
      <AddTrackInput />
    </div>
  );
}
