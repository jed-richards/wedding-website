/**
 * Meal options offered on the RSVP form. Keep values stable once guests start submitting.
 * Catering by the Pancake Man (pancakeman.net). TODO: confirm these against his actual menu.
 */
export const MEAL_OPTIONS = [
  { value: "buttermilk", label: "Buttermilk pancakes" },
  { value: "blueberry", label: "Blueberry pancakes" },
  { value: "chocolate_chip", label: "Chocolate chip pancakes" },
  { value: "fruit", label: "Pancakes with fresh fruit" },
] as const;

export type MealOption = (typeof MEAL_OPTIONS)[number]["value"];
