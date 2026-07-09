/** Meal options offered on the RSVP form. Keep values stable once guests start submitting. */
export const MEAL_OPTIONS = [
  { value: "chicken", label: "Chicken" },
  { value: "beef", label: "Beef" },
  { value: "fish", label: "Fish" },
  { value: "vegetarian", label: "Vegetarian" },
] as const;

export type MealOption = (typeof MEAL_OPTIONS)[number]["value"];
