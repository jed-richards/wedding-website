-- Catering is the Pancake Man: all-you-can-eat pancakes for everyone, so there is
-- no per-guest meal selection. Drop the now-unused meal_choice column. Dietary
-- notes still cover any special requests.
alter table guests
    drop column if exists meal_choice;
