"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult, Draggable } from "@hello-pangea/dnd";

type SortingGameProps = {
  items: string[];
  onComplete?: (isCorrect: boolean) => void;
};

export default function SortingGame({ items, onComplete }: SortingGameProps) {
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    const shuffledItems = [...items].sort(() => Math.random() - 0.5);
    setShuffled(shuffledItems);
  }, [items]);

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const newOrder = Array.from(shuffled);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setShuffled(newOrder);
  };

  const checkOrder = () => {
    const isCorrect = JSON.stringify(shuffled) === JSON.stringify(items);
    setFeedback(isCorrect ? "Correct order!" : "Try again.");
    if (onComplete) onComplete(isCorrect);
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Sort the items</h2>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="list">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {shuffled.map((item, index) => (
                <Draggable key={item} draggableId={item} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-white text-indigo-800 font-semibold py-3 px-4 rounded shadow cursor-move"
                    >
                      {item}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>

      <button
        onClick={checkOrder}
        className="mt-6 bg-yellow-400 text-indigo-900 font-bold py-2 px-6 rounded hover:bg-yellow-500"
      >
        Check
      </button>

      {feedback && (
        <p className="mt-4 text-lg font-semibold text-indigo-700">{feedback}</p>
      )}
    </div>
  );
}
