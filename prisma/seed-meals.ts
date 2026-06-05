import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed meal data for the PreOne preschool ERP.
 * Creates 24 MealItem records, a sample weekly MealPlan with MealPlanItems,
 * and sample StudentAllergy records for demo purposes.
 */
export async function seedMealData(schoolId: string) {
  console.log('Seeding meal data for school:', schoolId);

  // ============================================
  // 1. Create 24 MealItem records
  // ============================================

  // --- 6 Breakfast Items ---
  const breakfastItems = await Promise.all([
    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Ragi Dosa with Chutney',
        description: 'Crispy finger millet dosa served with fresh coconut chutney. Rich in calcium and iron, perfect for growing bones.',
        mealType: 'BREAKFAST',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '2 dosas + 2 tbsp chutney',
        calories: 280,
        protein: 7.5,
        carbohydrates: 42,
        fat: 8,
        fiber: 4.2,
        sugar: 1.5,
        calcium: 220,
        iron: 3.8,
        vitaminC: 2.0,
        vitamins: '{"vitA":120,"vitD":0,"vitB12":0,"vitB6":0.3,"folate":35,"niacin":1.2}',
        allergens: '["GLUTEN"]',
        mayContain: '["SESAME"]',
        ingredients: '[{"name":"Ragi flour","quantity":"1 cup","isAllergen":false},{"name":"Rice flour","quantity":"2 tbsp","isAllergen":false},{"name":"Urad dal","quantity":"1 tbsp","isAllergen":false},{"name":"Coconut","quantity":"1/4 cup","isAllergen":false},{"name":"Green chillies","quantity":"1","isAllergen":false},{"name":"Curry leaves","quantity":"a few","isAllergen":false},{"name":"Salt","quantity":"to taste","isAllergen":false}]',
        prepTime: 20,
        cookTime: 15,
        recipe: 'Soak urad dal for 4 hours. Grind with ragi and rice flour to make batter. Ferment overnight. Pour thin dosas on hot tawa. Serve with coconut chutney.',
        category: 'Indian',
        cuisine: 'South Indian',
        tags: '["millet","calcium-rich","iron-rich","fermented"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 18,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Poha with Peanuts',
        description: 'Flattened rice cooked with peanuts, curry leaves, and a squeeze of lemon. A light yet energy-packed breakfast.',
        mealType: 'BREAKFAST',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 bowl (200g)',
        calories: 310,
        protein: 8.2,
        carbohydrates: 48,
        fat: 9.5,
        fiber: 3.0,
        sugar: 2.0,
        calcium: 50,
        iron: 4.5,
        vitaminC: 12.0,
        vitamins: '{"vitA":80,"vitD":0,"vitB12":0,"vitB6":0.4,"folate":42,"niacin":2.1}',
        allergens: '["PEANUTS"]',
        mayContain: '["MUSTARD"]',
        ingredients: '[{"name":"Thick poha","quantity":"1.5 cups","isAllergen":false},{"name":"Peanuts","quantity":"2 tbsp","isAllergen":true},{"name":"Mustard seeds","quantity":"1 tsp","isAllergen":true},{"name":"Curry leaves","quantity":"a few","isAllergen":false},{"name":"Green chillies","quantity":"1","isAllergen":false},{"name":"Onion","quantity":"1 small","isAllergen":false},{"name":"Lemon","quantity":"half","isAllergen":false},{"name":"Turmeric","quantity":"pinch","isAllergen":false}]',
        prepTime: 10,
        cookTime: 10,
        recipe: 'Wash and drain poha. Heat oil, add mustard seeds and peanuts. Sauté onion, curry leaves, green chillies. Add turmeric and poha. Mix gently. Squeeze lemon before serving.',
        category: 'Indian',
        cuisine: 'North Indian',
        tags: '["iron-rich","quick","energy-packed","peanut"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 15,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Vegetable Upma',
        description: 'Semolina porridge cooked with mixed vegetables, mustard seeds, and ghee. Wholesome and easy to digest.',
        mealType: 'BREAKFAST',
        isVegetarian: true,
        isVegan: false,
        isEggless: true,
        servingSize: '1 bowl (200g)',
        calories: 295,
        protein: 7.0,
        carbohydrates: 44,
        fat: 9.0,
        fiber: 3.5,
        sugar: 2.5,
        calcium: 60,
        iron: 2.2,
        vitaminC: 8.0,
        vitamins: '{"vitA":150,"vitD":0,"vitB12":0,"vitB6":0.25,"folate":30,"niacin":1.5}',
        allergens: '["WHEAT","GLUTEN"]',
        mayContain: '["MILK"]',
        ingredients: '[{"name":"Semolina (rava)","quantity":"1 cup","isAllergen":true},{"name":"Carrot","quantity":"2 tbsp grated","isAllergen":false},{"name":"Green peas","quantity":"2 tbsp","isAllergen":false},{"name":"Beans","quantity":"2 tbsp chopped","isAllergen":false},{"name":"Mustard seeds","quantity":"1 tsp","isAllergen":false},{"name":"Ghee","quantity":"1 tsp","isAllergen":false},{"name":"Curry leaves","quantity":"a few","isAllergen":false},{"name":"Cashew nuts","quantity":"1 tbsp","isAllergen":false}]',
        prepTime: 10,
        cookTime: 15,
        recipe: 'Dry roast semolina until golden. In a pan, temper mustard seeds, curry leaves, and cashews in ghee. Sauté vegetables. Add water, bring to boil, add rava slowly. Stir until cooked.',
        category: 'Indian',
        cuisine: 'South Indian',
        tags: '["semolina","vegetable","easy-digest","ghee"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 16,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Idli with Sambar',
        description: 'Steamed rice-lentil cakes served with vegetable lentil soup. A protein-rich, probiotic South Indian classic.',
        mealType: 'BREAKFAST',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '3 idlis + 1 small bowl sambar',
        calories: 320,
        protein: 10.5,
        carbohydrates: 50,
        fat: 5.5,
        fiber: 4.0,
        sugar: 2.0,
        calcium: 85,
        iron: 3.5,
        vitaminC: 10.0,
        vitamins: '{"vitA":100,"vitD":0,"vitB12":0,"vitB6":0.35,"folate":55,"niacin":1.8}',
        allergens: '[]',
        mayContain: '["MUSTARD"]',
        ingredients: '[{"name":"Idli rice","quantity":"1 cup","isAllergen":false},{"name":"Urad dal","quantity":"1/3 cup","isAllergen":false},{"name":"Toor dal","quantity":"1/4 cup","isAllergen":false},{"name":"Carrot","quantity":"2 tbsp","isAllergen":false},{"name":"Drumstick","quantity":"2 pieces","isAllergen":false},{"name":"Sambar powder","quantity":"1 tsp","isAllergen":false},{"name":"Tamarind","quantity":"small ball","isAllergen":false},{"name":"Mustard seeds","quantity":"1 tsp","isAllergen":false}]',
        prepTime: 30,
        cookTime: 20,
        recipe: 'Soak rice and urad dal separately for 6 hours. Grind and ferment batter overnight. Steam idlis for 12 minutes. Cook toor dal with vegetables, tamarind, and sambar powder. Temper with mustard seeds.',
        category: 'Indian',
        cuisine: 'South Indian',
        tags: '["steamed","fermented","protein-rich","probiotic"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 20,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Banana Pancakes',
        description: 'Fluffy whole wheat pancakes made with ripe banana and a touch of jaggery. A kid-friendly breakfast with natural sweetness.',
        mealType: 'BREAKFAST',
        isVegetarian: true,
        isVegan: false,
        isEggless: true,
        servingSize: '3 small pancakes',
        calories: 265,
        protein: 6.5,
        carbohydrates: 46,
        fat: 6.0,
        fiber: 3.2,
        sugar: 12.0,
        calcium: 95,
        iron: 1.8,
        vitaminC: 5.0,
        vitamins: '{"vitA":60,"vitD":0.5,"vitB12":0.3,"vitB6":0.4,"folate":25,"niacin":1.0}',
        allergens: '["MILK","WHEAT","GLUTEN"]',
        mayContain: '["EGGS"]',
        ingredients: '[{"name":"Whole wheat flour","quantity":"3/4 cup","isAllergen":true},{"name":"Ripe banana","quantity":"1 medium","isAllergen":false},{"name":"Milk","quantity":"1/2 cup","isAllergen":true},{"name":"Jaggery","quantity":"1 tbsp","isAllergen":false},{"name":"Cardamom powder","quantity":"pinch","isAllergen":false},{"name":"Ghee","quantity":"for cooking","isAllergen":false}]',
        prepTime: 10,
        cookTime: 10,
        recipe: 'Mash banana. Mix with wheat flour, milk, and jaggery to make a smooth batter. Add cardamom. Pour small pancakes on a hot ghee-lined tawa. Cook both sides until golden.',
        category: 'Indian',
        cuisine: 'Universal',
        tags: '["banana","whole-wheat","jaggery","kid-favorite"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 22,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Oats Porridge with Fruits',
        description: 'Creamy oats porridge topped with seasonal fruits and a drizzle of honey. High in fiber and keeps children full longer.',
        mealType: 'BREAKFAST',
        isVegetarian: true,
        isVegan: false,
        isEggless: true,
        servingSize: '1 bowl (180g)',
        calories: 240,
        protein: 8.0,
        carbohydrates: 40,
        fat: 5.5,
        fiber: 5.0,
        sugar: 10.0,
        calcium: 120,
        iron: 2.8,
        vitaminC: 8.0,
        vitamins: '{"vitA":50,"vitD":0.8,"vitB12":0.2,"vitB6":0.15,"folate":20,"niacin":0.8}',
        allergens: '["MILK","GLUTEN"]',
        mayContain: '["TREE_NUTS"]',
        ingredients: '[{"name":"Rolled oats","quantity":"1/3 cup","isAllergen":true},{"name":"Milk","quantity":"1 cup","isAllergen":true},{"name":"Apple","quantity":"2 tbsp diced","isAllergen":false},{"name":"Banana","quantity":"2 tbsp sliced","isAllergen":false},{"name":"Honey","quantity":"1 tsp","isAllergen":true},{"name":"Cinnamon","quantity":"pinch","isAllergen":false}]',
        prepTime: 5,
        cookTime: 10,
        recipe: 'Boil oats in milk, stirring continuously until creamy. Add cinnamon. Transfer to bowl, top with diced apple, banana slices, and a drizzle of honey.',
        category: 'Healthy',
        cuisine: 'Continental',
        tags: '["oats","fiber-rich","fruits","honey"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 25,
        usageCount: 0,
        isActive: true,
      },
    }),
  ]);

  // --- 6 Mid Morning Snack Items ---
  const snackItems = await Promise.all([
    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Apple Slices',
        description: 'Fresh apple slices sprinkled with a pinch of chaat masala. A crunchy, vitamin C-rich snack.',
        mealType: 'MID_MORNING_SNACK',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 medium apple',
        calories: 95,
        protein: 0.5,
        carbohydrates: 25,
        fat: 0.3,
        fiber: 4.4,
        sugar: 19,
        calcium: 11,
        iron: 0.22,
        vitaminC: 8.4,
        vitamins: '{"vitA":98,"vitD":0,"vitB12":0,"vitB6":0.075,"folate":5,"niacin":0.2}',
        allergens: '[]',
        mayContain: '[]',
        ingredients: '[{"name":"Apple","quantity":"1 medium","isAllergen":false},{"name":"Chaat masala","quantity":"pinch","isAllergen":false}]',
        prepTime: 5,
        cookTime: 0,
        recipe: 'Wash and core apple. Cut into thin slices. Sprinkle chaat masala lightly. Serve immediately.',
        category: 'Fruit',
        cuisine: 'Universal',
        tags: '["fruit","raw","vitamin-C","quick"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 12,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Banana',
        description: 'A whole ripe banana. Nature\'s perfect snack — rich in potassium and natural energy.',
        mealType: 'MID_MORNING_SNACK',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 medium banana',
        calories: 105,
        protein: 1.3,
        carbohydrates: 27,
        fat: 0.4,
        fiber: 3.1,
        sugar: 14,
        calcium: 6,
        iron: 0.31,
        vitaminC: 10.3,
        vitamins: '{"vitA":76,"vitD":0,"vitB12":0,"vitB6":0.43,"folate":24,"niacin":0.8}',
        allergens: '[]',
        mayContain: '[]',
        ingredients: '[{"name":"Banana","quantity":"1 medium","isAllergen":false}]',
        prepTime: 0,
        cookTime: 0,
        recipe: 'Peel and serve. Can be sliced for younger children.',
        category: 'Fruit',
        cuisine: 'Universal',
        tags: '["fruit","potassium","energy","no-prep"]',
        suitableAgeMin: 1,
        suitableAgeMax: 6,
        costPerServing: 8,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Papaya Cubes',
        description: 'Sweet ripe papaya cut into small cubes. Excellent source of vitamin A and digestive enzymes.',
        mealType: 'MID_MORNING_SNACK',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 small bowl (120g)',
        calories: 50,
        protein: 0.6,
        carbohydrates: 13,
        fat: 0.1,
        fiber: 2.0,
        sugar: 8,
        calcium: 34,
        iron: 0.15,
        vitaminC: 61.8,
        vitamins: '{"vitA":950,"vitD":0,"vitB12":0,"vitB6":0.04,"folate":38,"niacin":0.4}',
        allergens: '[]',
        mayContain: '[]',
        ingredients: '[{"name":"Ripe papaya","quantity":"120g","isAllergen":false}]',
        prepTime: 5,
        cookTime: 0,
        recipe: 'Peel papaya, remove seeds, and cut into small child-friendly cubes. Serve fresh.',
        category: 'Fruit',
        cuisine: 'Universal',
        tags: '["fruit","vitamin-A","digestive","tropical"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 10,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Orange Segments',
        description: 'Juicy orange segments packed with vitamin C. Helps boost immunity and iron absorption.',
        mealType: 'MID_MORNING_SNACK',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 medium orange',
        calories: 62,
        protein: 1.2,
        carbohydrates: 15,
        fat: 0.2,
        fiber: 3.1,
        sugar: 12,
        calcium: 52,
        iron: 0.1,
        vitaminC: 70,
        vitamins: '{"vitA":346,"vitD":0,"vitB12":0,"vitB6":0.08,"folate":40,"niacin":0.6}',
        allergens: '[]',
        mayContain: '[]',
        ingredients: '[{"name":"Orange","quantity":"1 medium","isAllergen":false}]',
        prepTime: 3,
        cookTime: 0,
        recipe: 'Peel orange and separate into segments. Remove seeds if any. Serve fresh.',
        category: 'Fruit',
        cuisine: 'Universal',
        tags: '["fruit","vitamin-C","immunity","citrus"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 10,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Seasonal Fruit Bowl',
        description: 'A colorful mix of seasonal fruits — mango, grapes, guava, and pomegranate. A nutrient-dense snack.',
        mealType: 'MID_MORNING_SNACK',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 small bowl (150g)',
        calories: 85,
        protein: 1.0,
        carbohydrates: 21,
        fat: 0.3,
        fiber: 3.5,
        sugar: 16,
        calcium: 25,
        iron: 0.4,
        vitaminC: 25.0,
        vitamins: '{"vitA":300,"vitD":0,"vitB12":0,"vitB6":0.12,"folate":30,"niacin":0.5}',
        allergens: '[]',
        mayContain: '[]',
        ingredients: '[{"name":"Mango","quantity":"2 tbsp diced","isAllergen":false},{"name":"Grapes","quantity":"5-6 pieces","isAllergen":false},{"name":"Guava","quantity":"2 tbsp diced","isAllergen":false},{"name":"Pomegranate","quantity":"1 tbsp seeds","isAllergen":false}]',
        prepTime: 8,
        cookTime: 0,
        recipe: 'Wash all fruits. Dice mango and guava into small pieces. Halve grapes. Extract pomegranate seeds. Mix together in a bowl.',
        category: 'Fruit',
        cuisine: 'Universal',
        tags: '["fruit","seasonal","mixed","colorful"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 20,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Musk Melon Pieces',
        description: 'Sweet and hydrating musk melon (kharbuja) cut into bite-sized pieces. Perfect for hot days and rich in vitamins.',
        mealType: 'MID_MORNING_SNACK',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 small bowl (100g)',
        calories: 34,
        protein: 0.8,
        carbohydrates: 8,
        fat: 0.1,
        fiber: 0.9,
        sugar: 7,
        calcium: 9,
        iron: 0.2,
        vitaminC: 18.0,
        vitamins: '{"vitA":3382,"vitD":0,"vitB12":0,"vitB6":0.07,"folate":21,"niacin":0.5}',
        allergens: '[]',
        mayContain: '[]',
        ingredients: '[{"name":"Musk melon (kharbuja)","quantity":"100g","isAllergen":false}]',
        prepTime: 5,
        cookTime: 0,
        recipe: 'Wash musk melon thoroughly. Cut in half, remove seeds. Scoop out flesh and cut into small child-friendly pieces. Serve immediately.',
        category: 'Fruit',
        cuisine: 'Universal',
        tags: '["fruit","hydrating","vitamin-A","summer"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 10,
        usageCount: 0,
        isActive: true,
      },
    }),
  ]);

  // --- 6 Lunch Items ---
  const lunchItems = await Promise.all([
    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Dal Rice with Vegetables',
        description: 'Soft-cooked toor dal mixed with rice and tempered vegetables. A complete protein meal with balanced nutrition.',
        mealType: 'LUNCH',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 plate (250g)',
        calories: 380,
        protein: 13.0,
        carbohydrates: 60,
        fat: 7.0,
        fiber: 5.0,
        sugar: 3.0,
        calcium: 75,
        iron: 3.5,
        vitaminC: 8.0,
        vitamins: '{"vitA":120,"vitD":0,"vitB12":0,"vitB6":0.4,"folate":65,"niacin":2.2}',
        allergens: '[]',
        mayContain: '["MUSTARD"]',
        ingredients: '[{"name":"Rice","quantity":"3/4 cup","isAllergen":false},{"name":"Toor dal","quantity":"1/3 cup","isAllergen":false},{"name":"Carrot","quantity":"2 tbsp","isAllergen":false},{"name":"Beans","quantity":"2 tbsp","isAllergen":false},{"name":"Tomato","quantity":"1 small","isAllergen":false},{"name":"Cumin seeds","quantity":"1/2 tsp","isAllergen":false},{"name":"Garlic","quantity":"2 cloves","isAllergen":false},{"name":"Ghee","quantity":"1 tsp","isAllergen":false}]',
        prepTime: 15,
        cookTime: 25,
        recipe: 'Cook rice and dal separately until very soft. Temper cumin, garlic, and tomato in ghee. Add diced vegetables and cook. Mix dal, rice, and vegetables together. Mash slightly for younger kids.',
        category: 'Indian',
        cuisine: 'South Indian',
        tags: '["dal","rice","complete-protein","comfort-food"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 25,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Rajma Chawal with Salad',
        description: 'Kidney bean curry served with steamed rice and fresh cucumber-tomato salad. High in protein and fiber.',
        mealType: 'LUNCH',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 plate (280g)',
        calories: 420,
        protein: 15.0,
        carbohydrates: 65,
        fat: 8.5,
        fiber: 8.0,
        sugar: 4.0,
        calcium: 90,
        iron: 4.8,
        vitaminC: 15.0,
        vitamins: '{"vitA":80,"vitD":0,"vitB12":0,"vitB6":0.5,"folate":110,"niacin":1.5}',
        allergens: '[]',
        mayContain: '["MUSTARD"]',
        ingredients: '[{"name":"Rajma (kidney beans)","quantity":"1/3 cup","isAllergen":false},{"name":"Rice","quantity":"3/4 cup","isAllergen":false},{"name":"Onion","quantity":"1 small","isAllergen":false},{"name":"Tomato","quantity":"1 medium","isAllergen":false},{"name":"Ginger-garlic paste","quantity":"1 tsp","isAllergen":false},{"name":"Cucumber","quantity":"2 tbsp for salad","isAllergen":false},{"name":"Lemon","quantity":"for salad","isAllergen":false},{"name":"Jeera powder","quantity":"1/2 tsp","isAllergen":false}]',
        prepTime: 20,
        cookTime: 30,
        recipe: 'Soak rajma overnight. Pressure cook until soft. Prepare onion-tomato gravy with mild spices. Add rajma and simmer. Serve with rice and fresh salad of cucumber, tomato, and lemon.',
        category: 'Indian',
        cuisine: 'North Indian',
        tags: '["rajma","protein-rich","fiber-rich","classic"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 28,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Sambar Rice with Stir Fry',
        description: 'Sambar mixed with soft rice accompanied by a mild vegetable stir fry. A South Indian lunch staple.',
        mealType: 'LUNCH',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 plate (260g)',
        calories: 360,
        protein: 11.0,
        carbohydrates: 58,
        fat: 7.5,
        fiber: 5.5,
        sugar: 3.5,
        calcium: 95,
        iron: 3.2,
        vitaminC: 12.0,
        vitamins: '{"vitA":130,"vitD":0,"vitB12":0,"vitB6":0.35,"folate":60,"niacin":2.0}',
        allergens: '[]',
        mayContain: '["MUSTARD"]',
        ingredients: '[{"name":"Rice","quantity":"3/4 cup","isAllergen":false},{"name":"Toor dal","quantity":"1/4 cup","isAllergen":false},{"name":"Drumstick","quantity":"2 pieces","isAllergen":false},{"name":"Carrot","quantity":"2 tbsp","isAllergen":false},{"name":"Ladies finger (okra)","quantity":"3-4 pieces","isAllergen":false},{"name":"Sambar powder","quantity":"1 tsp","isAllergen":false},{"name":"Coconut","quantity":"1 tbsp","isAllergen":false},{"name":"Mustard seeds","quantity":"1/2 tsp","isAllergen":false}]',
        prepTime: 15,
        cookTime: 25,
        recipe: 'Cook dal with vegetables and sambar powder. Add tamarind water and simmer. Temper with mustard seeds and curry leaves. Mix with soft rice. Stir fry okra with coconut separately.',
        category: 'Indian',
        cuisine: 'South Indian',
        tags: '["sambar","rice","vegetable","traditional"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 24,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Vegetable Khichdi with Curd',
        description: 'A one-pot meal of rice, moong dal, and vegetables, served with fresh curd. Easy to digest and nutritionally complete.',
        mealType: 'LUNCH',
        isVegetarian: true,
        isVegan: false,
        isEggless: true,
        servingSize: '1 plate (250g) + 1 small bowl curd',
        calories: 350,
        protein: 12.0,
        carbohydrates: 55,
        fat: 8.0,
        fiber: 4.5,
        sugar: 5.0,
        calcium: 180,
        iron: 2.8,
        vitaminC: 6.0,
        vitamins: '{"vitA":100,"vitD":0.2,"vitB12":0.4,"vitB6":0.3,"folate":50,"niacin":1.8}',
        allergens: '["MILK"]',
        mayContain: '[]',
        ingredients: '[{"name":"Rice","quantity":"1/3 cup","isAllergen":false},{"name":"Moong dal","quantity":"1/4 cup","isAllergen":false},{"name":"Carrot","quantity":"2 tbsp diced","isAllergen":false},{"name":"Potato","quantity":"2 tbsp diced","isAllergen":false},{"name":"Peas","quantity":"1 tbsp","isAllergen":false},{"name":"Turmeric","quantity":"1/4 tsp","isAllergen":false},{"name":"Cumin seeds","quantity":"1/2 tsp","isAllergen":false},{"name":"Curd (yogurt)","quantity":"1/4 cup","isAllergen":true}]',
        prepTime: 10,
        cookTime: 20,
        recipe: 'Wash rice and dal together. Add vegetables, turmeric, cumin, and water. Pressure cook for 3 whistles until mushy. Temper with ghee and cumin. Serve with fresh cool curd.',
        category: 'Indian',
        cuisine: 'North Indian',
        tags: '["khichdi","comfort-food","easy-digest","probiotic"]',
        suitableAgeMin: 1,
        suitableAgeMax: 6,
        costPerServing: 22,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Curd Rice with Pomegranate',
        description: 'Cooling tempered rice mixed with fresh curd and topped with pomegranate seeds. A probiotic-rich South Indian favorite.',
        mealType: 'LUNCH',
        isVegetarian: true,
        isVegan: false,
        isEggless: true,
        servingSize: '1 bowl (220g)',
        calories: 300,
        protein: 9.5,
        carbohydrates: 48,
        fat: 7.0,
        fiber: 2.5,
        sugar: 6.0,
        calcium: 210,
        iron: 1.5,
        vitaminC: 5.0,
        vitamins: '{"vitA":50,"vitD":0.3,"vitB12":0.5,"vitB6":0.2,"folate":30,"niacin":1.2}',
        allergens: '["MILK"]',
        mayContain: '[]',
        ingredients: '[{"name":"Rice","quantity":"3/4 cup cooked","isAllergen":false},{"name":"Curd (yogurt)","quantity":"1/3 cup","isAllergen":true},{"name":"Pomegranate","quantity":"2 tbsp seeds","isAllergen":false},{"name":"Mustard seeds","quantity":"1/2 tsp","isAllergen":false},{"name":"Curry leaves","quantity":"a few","isAllergen":false},{"name":"Ginger","quantity":"1/2 inch","isAllergen":false},{"name":"Green chillies","quantity":"1/2","isAllergen":false}]',
        prepTime: 10,
        cookTime: 0,
        recipe: 'Mash cooked rice lightly. Mix with fresh curd. Temper mustard seeds, curry leaves, ginger, and green chillies in oil. Pour over curd rice. Top with pomegranate seeds.',
        category: 'Indian',
        cuisine: 'South Indian',
        tags: '["curd-rice","probiotic","cooling","pomegranate"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 20,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Paneer Tikka with Roti',
        description: 'Mildly spiced grilled paneer cubes served with soft whole wheat roti. A protein and calcium powerhouse.',
        mealType: 'LUNCH',
        isVegetarian: true,
        isVegan: false,
        isEggless: true,
        servingSize: '2 rotis + 6-8 paneer pieces',
        calories: 410,
        protein: 18.0,
        carbohydrates: 42,
        fat: 16.0,
        fiber: 4.0,
        sugar: 3.5,
        calcium: 350,
        iron: 2.5,
        vitaminC: 4.0,
        vitamins: '{"vitA":150,"vitD":0.1,"vitB12":0.8,"vitB6":0.2,"folate":25,"niacin":1.5}',
        allergens: '["MILK","WHEAT","GLUTEN"]',
        mayContain: '["SOYBEAN"]',
        ingredients: '[{"name":"Paneer","quantity":"60g","isAllergen":true},{"name":"Whole wheat flour","quantity":"1/2 cup","isAllergen":true},{"name":"Curd (yogurt)","quantity":"1 tbsp for marinade","isAllergen":true},{"name":"Bell pepper","quantity":"2 tbsp diced","isAllergen":false},{"name":"Onion","quantity":"1 tbsp diced","isAllergen":false},{"name":"Turmeric","quantity":"1/4 tsp","isAllergen":false},{"name":"Mild tikka masala","quantity":"1/2 tsp","isAllergen":false},{"name":"Oil","quantity":"1 tsp","isAllergen":false}]',
        prepTime: 20,
        cookTime: 15,
        recipe: 'Marinate paneer cubes in curd, turmeric, and mild tikka masala for 15 minutes. Grill with bell pepper and onion. Knead soft dough and make rotis. Serve together.',
        category: 'Indian',
        cuisine: 'North Indian',
        tags: '["paneer","calcium-rich","protein-rich","roti"]',
        suitableAgeMin: 3,
        suitableAgeMax: 6,
        costPerServing: 35,
        usageCount: 0,
        isActive: true,
      },
    }),
  ]);

  // --- 6 Afternoon Snack Items ---
  const afternoonSnackItems = await Promise.all([
    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Milk with Biscuit',
        description: 'Warm milk served with 2-3 plain Marie biscuits. A comforting afternoon snack that provides calcium and energy.',
        mealType: 'AFTERNOON_SNACK',
        isVegetarian: true,
        isVegan: false,
        isEggless: true,
        servingSize: '1 glass milk (150ml) + 3 biscuits',
        calories: 200,
        protein: 7.0,
        carbohydrates: 28,
        fat: 5.5,
        fiber: 0.5,
        sugar: 18,
        calcium: 280,
        iron: 0.8,
        vitaminC: 0,
        vitamins: '{"vitA":150,"vitD":2.0,"vitB12":1.1,"vitB6":0.1,"folate":12,"niacin":0.3}',
        allergens: '["MILK","WHEAT","GLUTEN"]',
        mayContain: '["SOYBEAN"]',
        ingredients: '[{"name":"Full cream milk","quantity":"150ml","isAllergen":true},{"name":"Marie biscuits","quantity":"3 pieces","isAllergen":true},{"name":"Sugar","quantity":"1 tsp (optional)","isAllergen":false}]',
        prepTime: 2,
        cookTime: 3,
        recipe: 'Warm milk to a comfortable drinking temperature. Add a little sugar if desired. Serve with Marie biscuits on the side.',
        category: 'Beverage',
        cuisine: 'Universal',
        tags: '["milk","calcium","comfort","biscuit"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 15,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Fruit Chaat',
        description: 'A tangy and spicy mix of seasonal fruits tossed with lemon juice and chaat masala. A fun and flavorful snack.',
        mealType: 'AFTERNOON_SNACK',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 small bowl (150g)',
        calories: 120,
        protein: 1.5,
        carbohydrates: 30,
        fat: 0.5,
        fiber: 4.0,
        sugar: 20,
        calcium: 30,
        iron: 0.6,
        vitaminC: 35.0,
        vitamins: '{"vitA":200,"vitD":0,"vitB12":0,"vitB6":0.15,"folate":25,"niacin":0.5}',
        allergens: '[]',
        mayContain: '[]',
        ingredients: '[{"name":"Apple","quantity":"2 tbsp diced","isAllergen":false},{"name":"Banana","quantity":"2 tbsp sliced","isAllergen":false},{"name":"Guava","quantity":"2 tbsp diced","isAllergen":false},{"name":"Pomegranate","quantity":"1 tbsp seeds","isAllergen":false},{"name":"Lemon juice","quantity":"1 tsp","isAllergen":false},{"name":"Chaat masala","quantity":"1/4 tsp","isAllergen":false},{"name":"Black salt","quantity":"pinch","isAllergen":false}]',
        prepTime: 10,
        cookTime: 0,
        recipe: 'Dice all fruits into small child-friendly pieces. Toss with lemon juice, chaat masala, and black salt. Serve fresh.',
        category: 'Fruit',
        cuisine: 'Indian',
        tags: '["fruit-chaat","spicy-tangy","vitamin-C","refreshing"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 18,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Lassi with Cookie',
        description: 'Sweet yogurt-based drink (lassi) served with a soft cookie. A probiotic-rich and satisfying snack.',
        mealType: 'AFTERNOON_SNACK',
        isVegetarian: true,
        isVegan: false,
        isEggless: true,
        servingSize: '1 glass lassi (150ml) + 1 cookie',
        calories: 210,
        protein: 6.5,
        carbohydrates: 32,
        fat: 6.0,
        fiber: 0.3,
        sugar: 22,
        calcium: 240,
        iron: 0.5,
        vitaminC: 1.0,
        vitamins: '{"vitA":120,"vitD":0.5,"vitB12":0.9,"vitB6":0.1,"folate":15,"niacin":0.3}',
        allergens: '["MILK","WHEAT","GLUTEN"]',
        mayContain: '["EGGS","SOYBEAN"]',
        ingredients: '[{"name":"Curd (yogurt)","quantity":"1/2 cup","isAllergen":true},{"name":"Water","quantity":"1/4 cup","isAllergen":false},{"name":"Sugar","quantity":"1 tbsp","isAllergen":false},{"name":"Cardamom powder","quantity":"pinch","isAllergen":false},{"name":"Cookie (eggless)","quantity":"1 piece","isAllergen":true}]',
        prepTime: 5,
        cookTime: 0,
        recipe: 'Blend curd, water, sugar, and cardamom until frothy. Chill if needed. Serve with an eggless cookie on the side.',
        category: 'Beverage',
        cuisine: 'North Indian',
        tags: '["lassi","probiotic","calcium","refreshing"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 18,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Vegetable Cutlet',
        description: 'Pan-fried mixed vegetable patties with a crispy outer layer. A tasty way to get kids to eat their veggies.',
        mealType: 'AFTERNOON_SNACK',
        isVegetarian: true,
        isVegan: false,
        isEggless: true,
        servingSize: '2 small cutlets',
        calories: 180,
        protein: 5.0,
        carbohydrates: 22,
        fat: 8.0,
        fiber: 3.0,
        sugar: 2.0,
        calcium: 55,
        iron: 1.8,
        vitaminC: 10.0,
        vitamins: '{"vitA":200,"vitD":0,"vitB12":0,"vitB6":0.2,"folate":20,"niacin":1.0}',
        allergens: '["WHEAT","GLUTEN"]',
        mayContain: '["MILK"]',
        ingredients: '[{"name":"Potato","quantity":"1 medium boiled","isAllergen":false},{"name":"Carrot","quantity":"2 tbsp grated","isAllergen":false},{"name":"Beans","quantity":"2 tbsp chopped","isAllergen":false},{"name":"Green peas","quantity":"1 tbsp","isAllergen":false},{"name":"Bread crumbs","quantity":"for coating","isAllergen":true},{"name":"Coriander leaves","quantity":"1 tbsp","isAllergen":false},{"name":"Garam masala","quantity":"1/4 tsp","isAllergen":false},{"name":"Oil","quantity":"for shallow frying","isAllergen":false}]',
        prepTime: 20,
        cookTime: 10,
        recipe: 'Mash boiled potato. Mix with finely chopped vegetables, coriander, and spices. Shape into small cutlets. Coat with bread crumbs. Shallow fry until golden on both sides.',
        category: 'Snack',
        cuisine: 'Indian',
        tags: '["cutlet","vegetable","crispy","shallow-fried"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 20,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Sprout Salad',
        description: 'Lightly steamed mixed sprouts tossed with lemon, tomato, and onion. Rich in plant protein and easy to prepare.',
        mealType: 'AFTERNOON_SNACK',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 small bowl (120g)',
        calories: 130,
        protein: 8.0,
        carbohydrates: 18,
        fat: 2.0,
        fiber: 5.0,
        sugar: 2.5,
        calcium: 45,
        iron: 2.5,
        vitaminC: 18.0,
        vitamins: '{"vitA":50,"vitD":0,"vitB12":0,"vitB6":0.2,"folate":80,"niacin":1.2}',
        allergens: '[]',
        mayContain: '[]',
        ingredients: '[{"name":"Green moong sprouts","quantity":"1/3 cup","isAllergen":false},{"name":"Chana sprouts","quantity":"2 tbsp","isAllergen":false},{"name":"Tomato","quantity":"1 tbsp diced","isAllergen":false},{"name":"Onion","quantity":"1 tbsp diced","isAllergen":false},{"name":"Green chillies","quantity":"1/4 finely chopped","isAllergen":false},{"name":"Lemon juice","quantity":"1 tsp","isAllergen":false},{"name":"Chaat masala","quantity":"1/4 tsp","isAllergen":false},{"name":"Coriander leaves","quantity":"1 tsp","isAllergen":false}]',
        prepTime: 5,
        cookTime: 5,
        recipe: 'Lightly steam the sprouts for 3-4 minutes (for easier digestion by young kids). Let cool. Toss with diced tomato, onion, lemon juice, chaat masala, and coriander.',
        category: 'Healthy',
        cuisine: 'Indian',
        tags: '["sprouts","protein","healthy","steamed"]',
        suitableAgeMin: 3,
        suitableAgeMax: 6,
        costPerServing: 12,
        usageCount: 0,
        isActive: true,
      },
    }),

    prisma.mealItem.create({
      data: {
        schoolId,
        name: 'Roasted Makhana (Fox Nuts)',
        description: 'Lightly roasted lotus seeds (makhana) with a pinch of turmeric and salt. A crunchy, low-fat, calcium-rich traditional snack.',
        mealType: 'AFTERNOON_SNACK',
        isVegetarian: true,
        isVegan: true,
        isEggless: true,
        servingSize: '1 small bowl (30g)',
        calories: 110,
        protein: 4.5,
        carbohydrates: 18,
        fat: 1.5,
        fiber: 1.5,
        sugar: 0.5,
        calcium: 60,
        iron: 1.2,
        vitaminC: 0,
        vitamins: '{"vitA":0,"vitD":0,"vitB12":0,"vitB6":0.1,"folate":15,"niacin":0.6}',
        allergens: '[]',
        mayContain: '["TREE_NUTS"]',
        ingredients: '[{"name":"Makhana (fox nuts)","quantity":"30g","isAllergen":false},{"name":"Ghee","quantity":"1/2 tsp","isAllergen":false},{"name":"Turmeric","quantity":"pinch","isAllergen":false},{"name":"Salt","quantity":"to taste","isAllergen":false}]',
        prepTime: 2,
        cookTime: 8,
        recipe: 'Dry roast makhana in a pan until crisp and lightly golden. Add a little ghee, turmeric, and salt. Toss well and let cool before serving.',
        category: 'Healthy',
        cuisine: 'North Indian',
        tags: '["makhana","calcium","roasted","traditional"]',
        suitableAgeMin: 2,
        suitableAgeMax: 6,
        costPerServing: 15,
        usageCount: 0,
        isActive: true,
      },
    }),
  ]);

  // Collect all created meal items with their IDs
  const allMealItems = [
    ...breakfastItems,
    ...snackItems,
    ...lunchItems,
    ...afternoonSnackItems,
  ];

  console.log(`Created ${allMealItems.length} MealItem records`);

  // ============================================
  // 2. Create a sample MealPlan for the current week
  // ============================================

  // Calculate current week's Monday and Friday dates
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  const mealPlan = await prisma.mealPlan.create({
    data: {
      schoolId,
      name: 'Weekly Meal Plan — Current Week',
      description: 'A balanced Indian preschool meal plan for Monday through Friday. Includes breakfast, mid-morning snack, lunch, and afternoon snack with varied nutrition.',
      startDate: monday,
      endDate: friday,
      mealTypes: '["BREAKFAST","MID_MORNING_SNACK","LUNCH","AFTERNOON_SNACK"]',
      targetClassIds: null,
      status: 'PUBLISHED',
      avgDailyCalories: 1065,
      avgDailyProtein: 27,
      avgDailyIron: 6,
      avgDailyCalcium: 465,
      avgDailyVitaminC: 16,
      publishedAt: new Date(),
      publishedBy: null,
    },
  });

  console.log(`Created MealPlan: ${mealPlan.name} (${mealPlan.id})`);

  // Helper indices into the meal item arrays for weekly rotation
  // breakfastItems: 0-5, snackItems: 0-4, lunchItems: 0-5, afternoonSnackItems: 0-4
  // dayOfWeek: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday

  const weeklyPlan: {
    dayOfWeek: number;
    breakfast: number;
    snack: number;
    lunch: number;
    afternoonSnack: number;
  }[] = [
    { dayOfWeek: 1, breakfast: 0, snack: 0, lunch: 0, afternoonSnack: 0 }, // Mon: Ragi Dosa, Apple, Dal Rice, Milk+Biscuit
    { dayOfWeek: 2, breakfast: 1, snack: 1, lunch: 1, afternoonSnack: 1 }, // Tue: Poha, Banana, Rajma Chawal, Fruit Chaat
    { dayOfWeek: 3, breakfast: 2, snack: 2, lunch: 2, afternoonSnack: 2 }, // Wed: Upma, Papaya, Sambar Rice, Lassi+Cookie
    { dayOfWeek: 4, breakfast: 3, snack: 3, lunch: 3, afternoonSnack: 3 }, // Thu: Idli Sambar, Orange, Khichdi+Curd, Veg Cutlet
    { dayOfWeek: 5, breakfast: 4, snack: 4, lunch: 4, afternoonSnack: 4 }, // Fri: Banana Pancakes, Fruit Bowl, Curd Rice, Sprout Salad
  ];

  const mealPlanItems: { id: string }[] = [];

  for (const day of weeklyPlan) {
    // Breakfast
    mealPlanItems.push(
      await prisma.mealPlanItem.create({
        data: {
          mealPlanId: mealPlan.id,
          mealItemId: breakfastItems[day.breakfast].id,
          dayOfWeek: day.dayOfWeek,
          mealType: 'BREAKFAST',
          isAlternative: false,
          alternativeFor: null,
          sortOrder: 1,
        },
      })
    );

    // Mid Morning Snack
    mealPlanItems.push(
      await prisma.mealPlanItem.create({
        data: {
          mealPlanId: mealPlan.id,
          mealItemId: snackItems[day.snack].id,
          dayOfWeek: day.dayOfWeek,
          mealType: 'MID_MORNING_SNACK',
          isAlternative: false,
          alternativeFor: null,
          sortOrder: 2,
        },
      })
    );

    // Lunch
    mealPlanItems.push(
      await prisma.mealPlanItem.create({
        data: {
          mealPlanId: mealPlan.id,
          mealItemId: lunchItems[day.lunch].id,
          dayOfWeek: day.dayOfWeek,
          mealType: 'LUNCH',
          isAlternative: false,
          alternativeFor: null,
          sortOrder: 3,
        },
      })
    );

    // Afternoon Snack
    mealPlanItems.push(
      await prisma.mealPlanItem.create({
        data: {
          mealPlanId: mealPlan.id,
          mealItemId: afternoonSnackItems[day.afternoonSnack].id,
          dayOfWeek: day.dayOfWeek,
          mealType: 'AFTERNOON_SNACK',
          isAlternative: false,
          alternativeFor: null,
          sortOrder: 4,
        },
      })
    );

    // Add alternative breakfast items for peanut allergy (Poha with Peanuts alternative on Tuesday)
    if (day.dayOfWeek === 2) {
      // Alternative for PEANUTS allergy on Tuesday — swap Poha for Oats Porridge
      mealPlanItems.push(
        await prisma.mealPlanItem.create({
          data: {
            mealPlanId: mealPlan.id,
            mealItemId: breakfastItems[5].id, // Oats Porridge with Fruits
            dayOfWeek: day.dayOfWeek,
            mealType: 'BREAKFAST',
            isAlternative: true,
            alternativeFor: 'PEANUTS',
            sortOrder: 1,
          },
        })
      );
    }

    // Add alternative lunch for milk allergy (Vegetable Khichdi with Curd on Thursday)
    if (day.dayOfWeek === 4) {
      // Alternative for MILK allergy on Thursday — swap Khichdi+Curd for Sambar Rice
      mealPlanItems.push(
        await prisma.mealPlanItem.create({
          data: {
            mealPlanId: mealPlan.id,
            mealItemId: lunchItems[2].id, // Sambar Rice with Stir Fry (no milk)
            dayOfWeek: day.dayOfWeek,
            mealType: 'LUNCH',
            isAlternative: true,
            alternativeFor: 'MILK',
            sortOrder: 3,
          },
        })
      );
    }

    // Add alternative afternoon snack for milk/wheat allergy (Milk with Biscuit on Monday)
    if (day.dayOfWeek === 1) {
      // Alternative for MILK allergy on Monday — swap Milk+Biscuit for Fruit Chaat
      mealPlanItems.push(
        await prisma.mealPlanItem.create({
          data: {
            mealPlanId: mealPlan.id,
            mealItemId: afternoonSnackItems[1].id, // Fruit Chaat
            dayOfWeek: day.dayOfWeek,
            mealType: 'AFTERNOON_SNACK',
            isAlternative: true,
            alternativeFor: 'MILK',
            sortOrder: 4,
          },
        })
      );
    }
  }

  console.log(`Created ${mealPlanItems.length} MealPlanItem records`);

  // ============================================
  // 3. Create sample StudentAllergy records
  // ============================================

  // Using placeholder student IDs for demo data
  const studentAllergies = await Promise.all([
    // student-1: Aarav — peanut allergy (severe) and milk allergy (mild)
    prisma.studentAllergy.create({
      data: {
        studentId: 'student-1',
        allergen: 'PEANUTS',
        severity: 'SEVERE',
        reaction: 'Hives, facial swelling, difficulty breathing',
        notes: 'Carries EpiPen. Parents have provided detailed action plan.',
        diagnosedDate: new Date('2023-06-15'),
        diagnosedBy: 'Dr. Priya Sharma, Pediatric Allergist',
        actionPlan: 'Administer EpiPen immediately if exposed. Call emergency services. Notify parents.',
        isVerified: true,
        verifiedBy: null,
        verifiedAt: new Date('2024-01-10'),
        isActive: true,
      },
    }),
    prisma.studentAllergy.create({
      data: {
        studentId: 'student-1',
        allergen: 'MILK',
        severity: 'MILD',
        reaction: 'Mild skin rash around mouth',
        notes: 'Can tolerate small amounts of cooked milk in baked goods. Avoid raw milk and curd.',
        diagnosedDate: new Date('2023-09-20'),
        diagnosedBy: 'Dr. Rajesh Kumar, General Pediatrician',
        actionPlan: 'Monitor for rash. Antihistamine if symptoms appear. No raw milk products.',
        isVerified: true,
        verifiedBy: null,
        verifiedAt: new Date('2024-01-10'),
        isActive: true,
      },
    }),

    // student-2: Ananya — egg allergy (moderate) and wheat/gluten sensitivity (mild)
    prisma.studentAllergy.create({
      data: {
        studentId: 'student-2',
        allergen: 'EGGS',
        severity: 'MODERATE',
        reaction: 'Vomiting, abdominal cramps, skin rash',
        notes: 'Cannot have eggs in any form including baked goods with egg. All meals must be eggless.',
        diagnosedDate: new Date('2022-11-05'),
        diagnosedBy: 'Dr. Meena Iyer, Pediatric Allergist',
        actionPlan: 'Avoid all egg products. Administer antihistamine if accidentally consumed. Contact parents immediately.',
        isVerified: true,
        verifiedBy: null,
        verifiedAt: new Date('2024-02-15'),
        isActive: true,
      },
    }),
    prisma.studentAllergy.create({
      data: {
        studentId: 'student-2',
        allergen: 'GLUTEN',
        severity: 'MILD',
        reaction: 'Bloating, mild stomach discomfort',
        notes: 'Non-celiac gluten sensitivity. Can have small amounts of wheat but prefer millet/rice-based alternatives.',
        diagnosedDate: new Date('2024-01-10'),
        diagnosedBy: 'Dr. Suresh Patil, Gastroenterologist',
        actionPlan: 'Offer millet/rice alternatives when possible. No strict avoidance needed but monitor comfort.',
        isVerified: true,
        verifiedBy: null,
        verifiedAt: new Date('2024-03-01'),
        isActive: true,
      },
    }),

    // student-3: Vihaan — tree nut allergy (severe) and honey allergy (mild)
    prisma.studentAllergy.create({
      data: {
        studentId: 'student-3',
        allergen: 'TREE_NUTS',
        severity: 'SEVERE',
        reaction: 'Anaphylaxis — throat swelling, difficulty breathing, drop in blood pressure',
        notes: 'Extremely sensitive to all tree nuts (almonds, cashews, walnuts, pistachios). Cross-contamination risk. EpiPen required.',
        diagnosedDate: new Date('2022-08-22'),
        diagnosedBy: 'Dr. Anita Deshmukh, Pediatric Allergist',
        actionPlan: 'Strict avoidance of all tree nuts and products containing them. EpiPen administration on exposure. Emergency protocol activated immediately.',
        isVerified: true,
        verifiedBy: null,
        verifiedAt: new Date('2024-01-20'),
        isActive: true,
      },
    }),
    prisma.studentAllergy.create({
      data: {
        studentId: 'student-3',
        allergen: 'HONEY',
        severity: 'MILD',
        reaction: 'Mild throat irritation and coughing',
        notes: 'Avoid honey in all preparations. Use jaggery or sugar as substitute.',
        diagnosedDate: new Date('2023-12-01'),
        diagnosedBy: 'Dr. Anita Deshmukh, Pediatric Allergist',
        actionPlan: 'Substitute honey with jaggery or sugar in all meals. Monitor for throat irritation.',
        isVerified: false,
        verifiedBy: null,
        verifiedAt: null,
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${studentAllergies.length} StudentAllergy records`);

  console.log('Meal data seeding completed successfully!');

  return {
    mealItems: allMealItems,
    mealPlan,
    mealPlanItems,
    studentAllergies,
  };
}
