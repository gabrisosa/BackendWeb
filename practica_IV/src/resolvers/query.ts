import { ApolloError, UserInputError } from "apollo-server";
import { Collection, ObjectId } from "mongodb"

export const Query = {
  getRecipe: async (parent: any, args: { id: string }, context: { db_recipes: Collection }) => {

    if (!args.id) {
      throw new UserInputError("Missing id");
    }

    const myRecipe = await context.db_recipes.findOne({ _id: new ObjectId(args.id) });

    if (myRecipe) {
      return {
        ...myRecipe,
        id: myRecipe._id.toString()
      }
    }

    throw new ApolloError("No recipe found with that id", "404");

  },
  getRecipes: async (parent: any, args: { author: string, ingredient: string }, context: { db_recipes: Collection }) => {

    const myQuery = () => {
      if (args.author && !args.ingredient) {
        return { author: args.author }
      } else if (!args.author && args.ingredient) {
        return { ingredient: args.ingredient }
      } else if (args.author && args.ingredient) {
        return { author: args.author, ingredient: args.ingredient }
      }
      return {}
    }

    const myRecipes = (await context.db_recipes.find(myQuery()).toArray()).map(r => {
      return {
        ...r,
        id: r._id.toString()
      }
    })

    if (myRecipes) {
      return myRecipes;
    }

    throw new ApolloError("No recipes found", "404");

  }, getUser: async (parent: any, args: { id: string }, context: { db_users: Collection }) => {

    if (!args.id) {
      throw new UserInputError("Missing id");
    }

    const myUser = await context.db_users.findOne({ _id: new ObjectId(args.id) });

    if (myUser) {
      return {
        ...myUser,
        id: myUser._id.toString()
      }
    }

    throw new ApolloError("No user found with that id", "404");

  },
  getUsers: async (parent: any, args: any, context: { db_users: Collection }) => {


    const allUsers = (await context.db_users.find().toArray()).map(u => {
      return {
        ...u,
        id: u._id.toString()
      }
    })

    if (!allUsers) {
      throw new ApolloError("Unexpected error", "404");
    }

    return allUsers;

  }
}

export const Recipe = {
  ingredients: async (parent: { ingredients: string[] }, args: any, context: { db_ingredients: Collection }) => {
    const myIngredients = (await context.db_ingredients.find({ name: { $in: parent.ingredients } }).toArray()).map(i => {
      return {
        ...i,
        id: i._id.toString()
      }
    });
    return myIngredients;
  },
  author: async (parent: { author: string }, args: any, context: { db_users: Collection }) => {
    const myUser = await context.db_users.findOne({ email: parent.author });
    return {
      ...myUser,
      id: myUser?._id.toString()
    }
  }
}

export const Ingredient = {
  recipes: async (parent: { name: string }, args: any, context: { db_recipes: Collection }) => {
    const myRecipes = (await context.db_recipes.find({ ingredients: parent.name }).toArray()).map(r => {
      return {
        ...r,
        id: r._id.toString()
      }
    })
    return myRecipes;
  }
}

export const User = {
  recipes: async (parent: { email: string }, args: any, context: { db_recipes: Collection }) => {
    const myRecipes = (await context.db_recipes.find({ author: parent.email }).toArray()).map(r => {
      return {
        ...r,
        id: r._id.toString()
      }
    });
    return myRecipes;
  }
}