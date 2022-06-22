import { gql } from "apollo-server";

export const typeDefs = gql`

type Ingredient{
  id: ID!
  name: String!
  recipes: [Recipe!]!
}

type Recipe{
  id: ID!
  name: String!
  description: String!
  ingredients: [Ingredient!]!
  author: User!
}

input RecipeInput {
  name: String
  description: String
  ingredients: [String!]
}


type User{
  id: ID!
  email: String!
  pwd: String!
  token: String
}

type Query {
  test(num:Int!): Int!
}

type Mutation {
  signUp(email: String!, pwd: String!): String
  deleteAccount(email: String!, pwd: String!): String

  logIn(email: String!, pwd: String!): String
  logOut: String

  addIngredient(name: String!): String
  deleteIngredient(name: String!): String

  addRecipe(recipe: RecipeInput!): String
  updateRecipe(recipe: RecipeInput!): String
  deleteRecipe(name: String!): String
}
`