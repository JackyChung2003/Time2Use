import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useRecipeContext } from "../../../../../../containers/Client/Recipe/Contexts/RecipeContext";
import BackButton from "../../../../../../components/Button/BackButton";
import supabase from "../../../../../../config/supabaseClient";
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
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./index.css"; // Add custom styles if needed

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
          touchAction: "none", // Prevent scrolling when dragging
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

const RecipePreparationPage = () => {
  const { fetchRecipeIngredients, fetchRecipeSteps, mealTypes } = useRecipeContext();
  const navigate = useNavigate();
  const { date } = useParams(); // Get date from URL
  const location = useLocation();
  const { planned_date, meal_type_id } = location.state || {};

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        const { data: mealPlans, error: mealPlansError } = await supabase
          .from("meal_plan")
          .select("recipe_id, notes, planned_date")
          .eq("planned_date", planned_date)
          .eq("meal_type_id", meal_type_id);

        if (mealPlansError) throw new Error(mealPlansError.message);

        if (!mealPlans || mealPlans.length === 0) {
          console.warn("No meal plans found for the given date and meal type.");
          setRecipes([]);
          return;
        }

        const recipeIds = mealPlans.map((meal) => meal.recipe_id);

        const { data: recipes, error: recipesError } = await supabase
          .from("recipes")
          .select("id, name, image_path, description, prep_time, cook_time")
          .in("id", recipeIds);

        if (recipesError) throw new Error(recipesError.message);

        setRecipes(recipes);
      } catch (error) {
        console.error("Error fetching preparation details:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (planned_date && meal_type_id) {
      fetchDetails();
    }
  }, [planned_date, meal_type_id]);

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

  const startCooking = () => {
    setShowModal(true);
  };

  const confirmSequence = () => {
    setShowModal(false);
    console.log("Confirmed cooking sequence:", recipes);
    // Proceed to cooking steps
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (loading) {
    return <div>Loading preparation details...</div>;
  }

  if (recipes.length === 0) {
    return <div>No recipes found for this meal plan.</div>;
  }

  return (
    <div className="recipe-preparation-page">
      <BackButton onClick={() => navigate(-1)} />
      <h1>Recipe Preparation</h1>
      <h3>Date: {planned_date}</h3>
      <h3>Meal Type: {mealTypes.find((type) => type.id === meal_type_id)?.name || "Unknown"}</h3>

      {recipes.map((recipe) => (
        <div key={recipe.id} className="recipe-details">
          <h2>{recipe.name}</h2>
          <img
            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${recipe.image_path}`}
            alt={recipe.name}
            style={{ width: "300px", borderRadius: "10px" }}
          />
          <p>{recipe.description}</p>
          <p>
            <strong>Prep Time:</strong> {recipe.prep_time} mins
          </p>
          <p>
            <strong>Cook Time:</strong> {recipe.cook_time} mins
          </p>
        </div>
      ))}

      <button
        onClick={startCooking}
        style={{
          padding: "10px 20px",
          background: "orange",
          color: "white",
          borderRadius: "5px",
          marginTop: "20px",
        }}
      >
        Start Cooking
      </button>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={closeModal} // Close modal if user clicks outside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "400px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3>Arrange Cooking Sequence</h3>
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
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
              <button onClick={closeModal} style={{ background: "red", color: "white", padding: "10px 20px", borderRadius: "5px" }}>
                Cancel
              </button>
              <button onClick={confirmSequence} style={{ background: "green", color: "white", padding: "10px 20px", borderRadius: "5px" }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipePreparationPage;
