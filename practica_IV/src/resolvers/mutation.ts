import { ApolloError, UserInputError } from "apollo-server";
import { Collection, Db, MongoOptions } from "mongodb";
import { v4 as uuid } from "uuid";

const bcrypt = require('bcrypt');

type MongoUser = {
  _id: string,
  email: string,
  token: string,
  recipe: string[]
}

export const Mutation = {
  signUp: async (parent: any, args: { email: string, pwd: string }, context: { db_users: Collection }) => {

    const isRegistered = await context.db_users.findOne({ email: args.email });

    if (isRegistered) {
      throw new ApolloError("User already registered with that email");
    }

    const encryptedpwd: string = await bcrypt.hash(args.pwd, 10);

    const user = {
      email: args.email,
      pwd: encryptedpwd,
      token: null,
      recipes: []
    }

    const register = await context.db_users.insertOne(user);

    if (register) {
      return `User ${args.email} succesfully registered`;
    }

  },
  deleteAccount: async (parent: any, args: { email: string, pwd: string }, context: { user: MongoUser, db_users: Collection, db_recipes: Collection }) => {
    const isRegistered = await context.db_users.findOne({ email: args.email });

    if (!isRegistered) {
      throw new ApolloError("Email not registered");
    }

    const auth: boolean = await bcrypt.compare(args.pwd, isRegistered.pwd);

    if (!auth) {
      throw new ApolloError("Wrong email or password", "404");
    }

    const deletedUser = await context.db_users.deleteOne(isRegistered);

    const deletedRecipes = await context.db_recipes.deleteMany({ author: context.user.email });

    if (deletedUser && deletedRecipes) {
      return `Account ${args.email} deleted`;
    }

    throw new ApolloError("Unexpected error", "404");
  },
  logIn: async (parent: any, args: { email: string, pwd: string }, context: { db_users: Collection }) => {

    const isRegistered = await context.db_users.findOne({ email: args.email });

    if (!isRegistered) {
      throw new ApolloError("Email not registered");
    }

    const auth: boolean = await bcrypt.compare(args.pwd, isRegistered.pwd);

    if (auth) {
      const token = uuid();
      await context.db_users.updateOne({ email: args.email }, { $set: { token: token } });
      return `Token: ${token}`
    }

    throw new ApolloError("Wrong email or password", "404");
  },
  logOut: async (parent: any, args: any, context: { db_users: Collection, user: MongoUser }) => {

    const updateToken = await context.db_users.updateOne({ email: context.user.email }, { $set: { token: null } });

    if (updateToken) {
      return "Logged out";
    }

    throw new ApolloError("Unexpected error", "404");
  },
  addIngredient: async (parent: any, args: { name: string }, context: { db_ingredients: Collection }) => {

    const exists = await context.db_ingredients.findOne({ name: args.name });

    if (!exists) {
      await context.db_ingredients.insertOne({ name: args.name, recipes: [] });
      return `Added ${args.name}`;
    }

    throw new ApolloError(`Ingredient ${args.name} alredy in DB`, "404");
  },
  deleteIngredient: async (parent: any, args: { name: string }, context: { db_ingredients: Collection, db_recipes: Collection }) => {

    const exists = await context.db_ingredients.findOne({ name: args.name });

    if (!exists) {
      throw new ApolloError(`Ingredient ${args.name} does not exist`, "404");
    }

    const deletedIngredient = await context.db_ingredients.deleteOne({ name: args.name });

    const deletedRecipes = await context.db_recipes.deleteMany({ ingredients: args.name });

    if (deletedIngredient && deletedRecipes) {
      return `Ingredient ${args.name} and its recipes deleted`;
    }

    throw new ApolloError("Unexpected error", "404");

  },
  addRecipe: async (parent: any, args: { recipe: { name: string, description: string, ingredients: string[] } }, context: {
    db_ingredients: Collection, db_recipes: Collection, db_users: Collection, user: MongoUser
  }) => {

    const existingRecipe = await context.db_recipes.findOne({ name: args.recipe.name });

    if (existingRecipe) {
      throw new ApolloError("Recipe already in DB", "404")
    }

    if (args.recipe.ingredients.length > 0) {
      args.recipe.ingredients.forEach(async (i: string) => {
        const isInserted = await context.db_ingredients.findOne({ name: i });
        if (!isInserted) {
          await context.db_ingredients.insertOne({ name: i, recipes: [args.recipe.name] });
        } else {
          await context.db_ingredients.updateOne({ name: i }, { $push: { recipes: { $each: [args.recipe.name] } } })
        }
      })

      const myRecipe = {
        name: args.recipe.name,
        description: args.recipe.description,
        ingredients: args.recipe.ingredients,
        author: context.user.email
      }

      const recipeInserted = await context.db_recipes.insertOne(myRecipe);

      const userUpdated = await context.db_users.updateOne({ email: context.user.email }, { $push: { recipes: { $each: [args.recipe.name] } } });

      if (recipeInserted && userUpdated) {
        return "Recipe succesfully added"
      }

    } else {
      throw new UserInputError("No ingredients");
    }

    throw new ApolloError("Unexpected error", "404");

  },
  updateRecipe: async (parent: any, args: { recipe: { name: string, description: string, ingredients: string[] } }, context: {
    db_ingredients: Collection, db_recipes: Collection, db_users: Collection, user: MongoUser
  }) => {
    const existingRecipe = await context.db_recipes.findOne({ name: args.recipe.name });

    if (!existingRecipe) {
      throw new ApolloError(`Recipe ${args.recipe.name} does not exist`, "403");
    }

    if (args.recipe.ingredients.length > 0) {
      if (existingRecipe.author !== context.user.email) {
        throw new ApolloError("You did not create this recipe", "404");
      }

      args.recipe.ingredients.forEach(async (i: string) => {
        const isInserted = await context.db_ingredients.findOne({ name: i });
        if (!isInserted) {
          await context.db_ingredients.insertOne({ name: i, recipes: [args.recipe.name] });
        }
      })

      const updatedRecipe = await context.db_recipes.updateOne({ name: args.recipe.name }, { $set: { description: args.recipe.description }, $addToSet: { ingredients: { $each: args.recipe.ingredients } } });

      if (updatedRecipe) {
        return `Recipe ${args.recipe.name} succesfully updated`;
      }

    } else {
      throw new UserInputError("No ingredients");
    }

    throw new ApolloError("Unexpected error", "404");

  },
  deleteRecipe: async (parent: any, args: { name: string }, context: { user: MongoUser, db_recipes: Collection, db_ingredients: Collection, db_users: Collection }) => {
    const exists = await context.db_recipes.findOne({ name: args.name });

    if (!exists) {
      throw new ApolloError(`Recipe ${args.name} does not exist`);
    }

    if (exists.author !== context.user.email) {
      throw new ApolloError("You cannot delete a recipe that is not yours", "404");
    }

    const deletedRecipe = await context.db_recipes.deleteOne(exists);

    const updatedUser = await context.db_users.updateOne({ email: context.user.email }, { $pull: { recipes: args.name } });

    //await context.db_ingredients.updateMany({}, { $pull: { recipes: args.name }})

    if (deletedRecipe && updatedUser) {
      return `Recipe ${args.name} succesfully deleted`;
    }

    throw new ApolloError("Unexpected error", "404");
  }
}