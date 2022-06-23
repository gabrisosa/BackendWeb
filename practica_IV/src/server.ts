import { ApolloError, ApolloServer } from "apollo-server";
import { connectDB } from "./mongo";
import { Mutation } from "./resolvers/mutation";
import { Ingredient, Query, Recipe, User } from "./resolvers/query";
import { typeDefs } from "./schema";

const resolvers = {
  Query,
  Mutation,
  Recipe,
  Ingredient,
  User
}

const run = async () => {

  const client = await connectDB();

  const db_users = client.collection("users");
  const db_ingredients = client.collection("ingredients");
  const db_recipes = client.collection("recipes");

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req, res }) => {
      const valid = ["deleteAccount", "logOut", "addIngredient", "deleteIngredient", "addRecipe", "updateRecipe", "deleteRecipe"];
      const header = req.headers["token"];
      if (valid.some(i => req.body.query.includes(i))) {
        if (header !== undefined) {
          const user = await db_users.findOne({ token: header });
          if (user) {
            return {
              db_users,
              db_ingredients,
              db_recipes,
              user
            }
          } else {
            throw new ApolloError("Authentication error", "404");
          }
        } else {
          throw new ApolloError("Authentication error", "Auth eror", { status: 403 });
        }
      } else {
        return {
          db_users,
          db_ingredients,
          db_recipes
        }
      }
    }
  })

  server.listen(process.env.PORT).then(() => {
    console.log(`Server listening on port ${process.env.PORT}`);
  })
}

try {
  run()
} catch (e) {
  throw (e)
}