const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

// Middleware to check if user exists
const checksExistsUserAccount = (request, response, next) => {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if(!user){
    return response.status(400).json({ error: 'User not found!'});
  }

  // append the user data to the request object, so it can be retrieved in the following middleware
  request.user = user;

  // proceed to the next middleware
  return next();
};

// Middleware to check if todo exists
const checkTodoExists = (request, response, next) => {
  const { id } = request.params;
  const { user } = request;

  const todoIndex = user.todos.findIndex(todo => todo.id === id);
  if(todoIndex < 0){
    return response.status(404).json({ error: 'Todo not found' });
  }

  // append todo to request object
  const todo = user.todos[todoIndex];
  request.todo = todo;

  return next();
};

// Create new user with an empty todo list
app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.find(user => user.username === username);
  if(userAlreadyExists){
    return response.status(400).json({ error: 'User already exists!' });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

// List user's todos
app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(201).json(user.todos);
});

// Create user's todo
app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

// Show user's todo
app.put('/todos/:id', checksExistsUserAccount, checkTodoExists, (request, response) => {
  const { todo } = request;
  const { title, deadline } = request.body;

  todo.title = title;
  todo.deadline = new Date(deadline);

  // no need for response body
  return response.status(200).json(todo);
});

// Update 'done' status of user's todo
app.patch('/todos/:id/done', checksExistsUserAccount, checkTodoExists, (request, response) => {
  const { todo } = request;
  todo.done = true;

  // no need for response body
  return response.status(200).json(todo);
});

// Delete user's todo
app.delete('/todos/:id', checksExistsUserAccount, checkTodoExists, (request, response) => {
  const { user, todo } = request;

  user.todos = user.todos.filter(t => t.id !== todo.id);

  // no need for response body
  return response.status(204).send();
});

module.exports = app;