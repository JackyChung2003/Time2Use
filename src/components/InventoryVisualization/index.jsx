import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      console.log("INIIIII",data);
  
      // Calculate percentages for allocated and remaining quantities
      const percentageAllocated = ("111");
      const percentageRemaining = ("111");
  
      return (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          <p><strong>{data.name}</strong></p>
          <p>Initial Quantity: {data.initialQuantity + data.allocatedQuantity + data.remainingQuantity}</p>
          <p>
            Remaining Quantity: {data.remainingQuantity + data.allocatedQuantity} 
          </p>
          <p>
            Allocated Quantity: {data.allocatedQuantity} 
          </p>
        </div>
      );
    }
  
    return null;
  };

const InventoryVisualization = ({ linkedInventory, recipe }) => {
  // Transform the linked inventory data for the stacked bar chart
  const inventoryData = linkedInventory
    .filter((inventory) => inventory.meal_plan.recipe_id === recipe.id)
    .map((inventory) => {
      const allocatedQuantity = inventory.used_quantity;
      const remainingQuantity = inventory.inventory.quantity - allocatedQuantity;
      const initialQuantity = inventory.inventory.init_quantity - allocatedQuantity - remainingQuantity;

      return {
        name: inventory.ingredients.name || "Unknown Ingredient",
        allocatedQuantity: allocatedQuantity > 0 ? allocatedQuantity : 0,
        remainingQuantity: remainingQuantity > 0 ? remainingQuantity : 0,
        initialQuantity, // Total is used for the full length of the bar
      };
    });

  return (
    <div style={{ marginBottom: "20px" }}>
      <h4>Inventory Progress</h4>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart
          data={inventoryData}
          layout="vertical"
          margin={{
            top: 20,
            right: 30,
            left: 40,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          {/* <Tooltip /> */}
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {/* Allocated Quantity (Green, starts on the left) */}
          <Bar
            dataKey="allocatedQuantity"
            stackId="inventory"
            fill="#82ca9d"
            name="Allocated Quantity"
          />
          {/* Remaining Quantity (Yellow, stacked after green) */}
          <Bar
            dataKey="remainingQuantity"
            stackId="inventory"
            fill="#ffc658"
            name="Remaining Quantity"
          />
          {/* Initial Quantity (Gray, acts as the background total bar) */}
          <Bar
            dataKey="initialQuantity"
            stackId="inventory"
            fill="#d3d3d3"
            name="Initial Quantity"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InventoryVisualization;
