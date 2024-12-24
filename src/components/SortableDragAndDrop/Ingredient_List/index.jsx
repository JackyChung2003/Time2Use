import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import supabase from "../../../config/supabaseClient";

const SortableIngredientList = ({ initialIngredients, onIngredientUpdate }) => {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const updatedIngredients = arrayMove(
        ingredients,
        ingredients.findIndex((ingredient) => ingredient.id === active.id),
        ingredients.findIndex((ingredient) => ingredient.id === over.id)
      );
      setIngredients(updatedIngredients);
      onIngredientUpdate(updatedIngredients); // Notify parent component
    }
  };

  const handleAddIngredient = () => {
    const newIngredient = {
      id: Date.now(),
      name: "",
      quantity: "",
      unit: "",
      ingredient_id: null,
    };
    const updatedIngredients = [...ingredients, newIngredient];
    setIngredients(updatedIngredients);
    onIngredientUpdate(updatedIngredients); // Notify parent component
  };

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={ingredients.map((ingredient) => ingredient.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {ingredients.map((ingredient) => (
              <SortableIngredient
                key={ingredient.id}
                id={ingredient.id}
                ingredient={ingredient}
                onUpdate={(updatedIngredient) => {
                  const updatedIngredients = ingredients.map((item) =>
                    item.id === updatedIngredient.id ? updatedIngredient : item
                  );
                  setIngredients(updatedIngredients);
                  onIngredientUpdate(updatedIngredients); // Notify parent component
                }}
                onRemove={(id) => {
                  const updatedIngredients = ingredients.filter(
                    (item) => item.id !== id
                  );
                  setIngredients(updatedIngredients);
                  onIngredientUpdate(updatedIngredients); // Notify parent component
                }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button
        onClick={handleAddIngredient}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        + Add Ingredient
      </button>
    </div>
  );
};

const SortableIngredient = ({ id, ingredient, onUpdate, onRemove }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      border: "1px solid #ccc",
      margin: "10px 0",
      padding: "10px",
      borderRadius: "5px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#f9f9f9",
      position: "relative",
    };
  
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
  
    const handleSearchIngredients = async (query) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("ingredients")
          .select("*")
          .ilike("name", `%${query}%`)
          .limit(10); // Increase the limit for more visible results
  
        if (error) {
          console.error("Error fetching ingredients:", error);
          setSuggestions([]);
        } else {
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Error:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };
  
    const handleSelectSuggestion = (selectedIngredient) => {
      onUpdate({
        ...ingredient,
        name: selectedIngredient.name,
        ingredient_id: selectedIngredient.id,
        unit: selectedIngredient.unit || "",
      });
      setSuggestions([]);
    };
  
    return (
      <li ref={setNodeRef} style={style} {...attributes}>
        {/* Drag Handle */}
        <span
          {...listeners}
          style={{
            cursor: "grab",
            marginRight: "10px",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ☰
        </span>
  
        {/* Ingredient Name Input */}
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            value={ingredient.name}
            placeholder="Ingredient Name"
            onChange={(e) => {
              const name = e.target.value;
              onUpdate({ ...ingredient, name });
              if (name.length > 1) {
                handleSearchIngredients(name);
              } else {
                setSuggestions([]);
              }
            }}
            style={{
              width: "100%",
              marginBottom: "5px",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
  
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "white",
                maxHeight: "200px", // Increased height
                width: "100%",
                overflowY: "auto",
                position: "absolute",
                top: "calc(100% + 5px)",
                zIndex: 100,
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    backgroundColor: "#f4f4f4",
                    borderBottom: "1px solid #ddd",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    <strong>{suggestion.name}</strong>
                    {suggestion.unit && ` (${suggestion.unit})`}
                  </span>
                  {suggestion.category && (
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      {suggestion.category}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
  
        {/* Quantity Input */}
        <input
          type="number"
          value={ingredient.quantity}
          placeholder="Quantity"
          onChange={(e) =>
            onUpdate({ ...ingredient, quantity: e.target.value })
          }
          style={{ width: "80px", marginRight: "10px" }}
        />
  
        {/* Unit Input */}
        <input
          type="text"
          value={ingredient.unit}
          placeholder="Unit"
          readOnly
          style={{ width: "80px", marginRight: "10px", backgroundColor: "#eee" }}
        />
  
        {/* Remove Button */}
        <button
          onClick={() => onRemove(id)}
          style={{
            background: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            padding: "5px 10px",
          }}
        >
          Remove
        </button>
      </li>
    );
  };
  
  export default SortableIngredientList;
  
