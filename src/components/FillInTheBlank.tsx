"use client";

import React, { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

type Question = {
  sentenceParts: string[];
  options: string[];
};

type FillInTheBlankProps = {
  questions: Question[];
  onComplete?: (totalScore: number, totalQuestions: number) => void;
};

export default function FillInTheBlank({ questions, onComplete }: FillInTheBlankProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState<(string | null)[]>([]);
  const [availableOptions, setAvailableOptions] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const blanksCount = currentQuestion ? currentQuestion.sentenceParts.length - 1 : 0;

  // Initialize answers when question changes
  useEffect(() => {
    if (currentQuestion) {
      setBlankAnswers(Array(blanksCount).fill(null));
      setAvailableOptions([...currentQuestion.options]);
      setChecked(false);
      setIsAnswerCorrect(false);
    }
  }, [currentIndex, currentQuestion, blanksCount]);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const newBlankAnswers = [...blankAnswers];
    const newAvailableOptions = [...availableOptions];

    const isFromOption = source.droppableId === "options";
    const isToOption = destination.droppableId === "options";
    const isFromBlank = source.droppableId.startsWith("blank-");
    const isToBlank = destination.droppableId.startsWith("blank-");

    // Dragging from options into a blank
    if (isFromOption && isToBlank) {
      const destIndex = Number(destination.droppableId.split("-")[1]);
      const existing = newBlankAnswers[destIndex];
      if (existing) {
        newAvailableOptions.push(existing);
      }
      const optIdx = newAvailableOptions.indexOf(draggableId);
      if (optIdx > -1) newAvailableOptions.splice(optIdx, 1);
      newBlankAnswers[destIndex] = draggableId;
    }

    // Dragging from blank back to options
    else if (isFromBlank && isToOption) {
      const srcIndex = Number(source.droppableId.split("-")[1]);
      const existing = newBlankAnswers[srcIndex];
      if (existing) {
        newAvailableOptions.push(existing);
        newBlankAnswers[srcIndex] = null;
      }
    }

    // Dragging between blanks
    else if (isFromBlank && isToBlank) {
      const srcIndex = Number(source.droppableId.split("-")[1]);
      const destIndex = Number(destination.droppableId.split("-")[1]);
      const temp = newBlankAnswers[destIndex];
      newBlankAnswers[destIndex] = newBlankAnswers[srcIndex];
      newBlankAnswers[srcIndex] = temp;
    }

    // Reordering options
    else if (isFromOption && isToOption) {
      const [removed] = newAvailableOptions.splice(source.index, 1);
      newAvailableOptions.splice(destination.index, 0, removed);
    }

    setBlankAnswers(newBlankAnswers);
    setAvailableOptions(newAvailableOptions);
  }

  const handleCheck = () => {
    const isCorrect = blankAnswers.every((ans, i) => ans === currentQuestion.options[i]);
    setChecked(true);
    setIsAnswerCorrect(isCorrect);
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCompleted(true);
      if (onComplete) {
        onComplete(score + (isAnswerCorrect ? 1 : 0), questions.length);
      }
    }
  };

  if (completed) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-indigo-50 rounded shadow text-indigo-900 text-center">
        <h2 className="text-2xl font-bold mb-4">All Questions Completed!</h2>
        <p className="text-xl">Your total score is {score} out of {questions.length}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow mt-10">
      <DragDropContext onDragEnd={onDragEnd}>
        <p className="text-xl mb-8 text-black">
          {currentQuestion.sentenceParts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < blanksCount && (
                <Droppable droppableId={`blank-${i}`} direction="horizontal">
                  {(provided, snapshot) => (
                    <span
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`inline-block w-32 min-h-[40px] mx-2 px-2 py-1 border-2 rounded transition-colors ${
                        snapshot.isDraggingOver
                          ? "border-indigo-600 bg-indigo-200"
                          : checked
                          ? blankAnswers[i] === currentQuestion.options[i]
                            ? "border-green-500 bg-green-100"
                            : "border-red-500 bg-red-100"
                          : "border-indigo-400 bg-indigo-100"
                      } text-indigo-900 font-semibold`}
                    >
                      {blankAnswers[i] ? (
                        <Draggable
                          draggableId={blankAnswers[i]!}
                          index={0}
                          isDragDisabled={checked && isAnswerCorrect}
                        >
                          {(provided) => (
                            <span
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="inline-block bg-indigo-600 text-white rounded px-2 py-1 cursor-move select-none"
                            >
                              {blankAnswers[i]}
                            </span>
                          )}
                        </Draggable>
                      ) : (
                        <span className="text-indigo-400 italic">[drag here]</span>
                      )}
                      {provided.placeholder}
                    </span>
                  )}
                </Droppable>
              )}
            </React.Fragment>
          ))}
        </p>

        <div>
          <h3 className="mb-2 font-semibold text-indigo-900">Options</h3>
          <Droppable droppableId="options" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex gap-3 flex-wrap p-2 border-2 rounded ${
                  snapshot.isDraggingOver
                    ? "border-indigo-600 bg-indigo-200"
                    : "border-indigo-400 bg-indigo-100"
                }`}
                style={{ minHeight: 50 }}
              >
                {availableOptions.length === 0 && (
                  <span className="text-indigo-400 italic">No options available</span>
                )}
                {availableOptions.map((opt, index) => (
                  <Draggable key={opt} draggableId={opt} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-indigo-600 text-white rounded px-3 py-1 cursor-move select-none"
                      >
                        {opt}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        <div className="mt-6 flex gap-4 items-center">
          {!checked && (
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              disabled={blankAnswers.includes(null)}
              onClick={handleCheck}
            >
              Check Answer
            </button>
          )}
          {checked && isAnswerCorrect && (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              onClick={handleNext}
            >
              Next
            </button>
          )}
        </div>

        <div className="mt-4 text-indigo-900 font-semibold">
          Question {currentIndex + 1} of {questions.length}
        </div>
      </DragDropContext>
    </div>
  );
}
