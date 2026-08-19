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

              // Calculate section statistics
              const sectionTracks = tracks.filter((t) => (t.section || 'Main Set') === currentSection && !t.excluded);
              const sectionDurationMs = sectionTracks.reduce((acc, t) => acc + (t.durationMs || 210000), 0);
              const sectionMinutes = Math.round(sectionDurationMs / 60000);

              const isEncore = currentSection.toLowerCase().includes('encore');

              return (
                <div key={track.id}>
                  {isNewSection && (
                    <div className={`${index === 0 ? 'pt-2' : 'pt-8'} pb-3 flex items-center justify-between select-none`}>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border shadow-sm ${
                          isEncore
                            ? 'bg-purple-950/40 text-purple-300 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                            : 'bg-setdrift-gold/15 text-setdrift-gold border-setdrift-gold/30 shadow-[0_0_15px_rgba(244,168,54,0.15)]'
                        }`}>
                          {currentSection}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          {sectionTracks.length} {sectionTracks.length === 1 ? 'track' : 'tracks'} • ~{sectionMinutes} min
                        </span>
                      </div>
                      <div className="h-px flex-1 ml-4 bg-gradient-to-r from-border/50 to-transparent" />
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
