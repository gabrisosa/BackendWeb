# Práctica 4

GraphQL API that handles users, recipes and ingredients 

## Mutations

```graphql
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
```

## Queries

```graphql
type Query {
  getRecipe(id: ID!): Recipe
  getRecipes(author: String, ingredient: String): [Recipe]
  
  getUser(id: ID!): User
  getUsers: [User]
}
```


### Install dependencies

Run

```
npm install
```

or

```
yarn
```

### Running

You can run it in developer mode, with hot reload on code change with

```
npm run dev
``` 
or
```
yarn run dev
```

You can also run it with the possibility of attaching a debugger (and hot reload) with

```
npm run dev-inspect
``` 
or
```
yarn run dev-inspect
```

Finally, you can run it in production mode with

```
npm run start
``` 
or
```
yarn run start
```