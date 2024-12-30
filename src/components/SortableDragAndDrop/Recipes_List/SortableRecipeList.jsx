// SortableRecipeList.jsx
import React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import SortableRecipe from "./SortableRecipe";

const SortableRecipeList = ({ recipes, setRecipes }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const updatedRecipes = arrayMove(
        recipes,
        recipes.findIndex((recipe) => recipe.id === active.id),
        recipes.findIndex((recipe) => recipe.id === over.id)
      );

      setRecipes(updatedRecipes);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={recipes.map((recipe) => recipe.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {recipes.map((recipe) => (
            <SortableRecipe key={recipe.id} id={recipe.id} recipe={recipe} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

export default SortableRecipeList;
