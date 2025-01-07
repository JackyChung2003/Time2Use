// SortableRecipe.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SortableRecipe = ({ id, recipe }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    marginBottom: "10px",
    background: "#f9f9f9",
    display: "flex",
    alignItems: "center",
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes}>
      <span
        {...listeners}
        style={{
          cursor: "grab",
          fontSize: "20px",
          marginRight: "10px",
          touchAction: "none",
        }}
        className="drag-handle"
      >
        ☰
      </span>
      <img
        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
        alt={recipe.name}
        style={{ width: "50px", height: "50px", borderRadius: "5px", marginRight: "10px" }}
      />
      <span>{recipe.name}</span>
    </li>
  );
};

export default SortableRecipe;
