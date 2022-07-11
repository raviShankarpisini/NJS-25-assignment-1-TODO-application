const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());

let database;
const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: path.join(__dirname, "todoApplication.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DataBase error is ${error.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

//get the list of todos
/*
app.get("/todos/", async (request, response) => {
  const requestQuery = `select * from todo;`;
  const responseResult = await database.all(requestQuery);
  response.send(responseResult);
});
*/

//api 1

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  /*console.log(hasPriorityAndStatusProperties(request.query));
  console.log(hasCategoryAndStatus(request.query));
  console.log(hasCategoryAndPriority(request.query));
  console.log(hasPriorityProperty(request.query));
  console.log(hasStatusProperty(request.query));
  console.log(hasCategoryProperty(request.query));
  console.log(hasSearchProperty(request.query));*/

  /** switch case  */
  switch (true) {
    //scenario 3
    /**----------- has priority and status -------- */
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
      SELECT * FROM todo  WHERE status = '${status}' AND priority = '${priority}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    //scenario 5
    /** has  category and status  */
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `select * from todo where category='${category}' and status='${status}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    //scenario 7
    /** has both category and priority */
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `select * from todo where category='${category}' and priority='${priority}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    //scenario 2
    /**-------------- has only priority---------- */
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
      SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //scenario 1
    /**-------------has only status ------------ */
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //has only search property
    //scenario 4
    case hasSearchProperty(request.query):
      getTodosQuery = `select * from todo where todo like '%${search_q}%';`;
      data = await database.all(getTodosQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));
      break;
    //scenario 6
    //has only category
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `select * from todo where category='${category}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //default get all todos
    default:
      getTodosQuery = `select * from todo;`;
      data = await database.all(getTodosQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));
  }
});

//api2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getToDoQuery = `select * from todo where id=${todoId};`;
  const responseResult = await database.get(getToDoQuery);
  response.send(outPutResult(responseResult));
});

//api3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const requestQuery = `select * from todo where due_date='${newDate}';`;
    const responseResult = await database.all(requestQuery);
    //console.log(responseResult);
    response.send(responseResult.map((eachItem) => outPutResult(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//api4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
  INSERT INTO
    todo (id, todo, category,priority, status, due_date)
  VALUES
    (${id}, '${todo}', '${category}','${priority}', '${status}', '${postNewDueDate}');`;
          await database.run(postTodoQuery);
          //console.log(responseResult);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//api5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  console.log(requestBody);
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    // update status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //update priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //update todo
    case requestBody.todo !== undefined:
      updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

      await database.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;

    //update category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //update due date
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${newDueDate}' WHERE id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }

  /*updateTodoQuery = `
    UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}', category='${category}',
     due_date='${dueDate}' WHERE id = ${todoId};`;

  const responseData = await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);*/
});

//api6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

// const express = require("express");
// const { open } = require("sqlite");
// const sqlite3 = require("sqlite3");
// const path = require("path");
// const addDays = require("date-fns/addDays");
// const format = require("date-fns/format");
// const isValid = require("date-fns/isValid");

// const app = express();
// const dbPath = path.join(__dirname, "todoApplication.db");
// app.use(express.json());
// let db = null;

// const initializeDbAndServer = async () => {
//   try {
//     db = await open({
//       filename: dbPath,
//       driver: sqlite3.Database,
//     });
//     app.listen(3000, () => {
//       console.log("Server Running at http://localhost:3000");
//     });
//   } catch (error) {
//     console.log(`Db Error: ${error.message}`);
//     process.exit(1);
//   }
// };

// initializeDbAndServer();

// const queryStatusCheck = (request, response, next) => {
//   const { status } = request.query;
//   const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
//   if (statusArray.includes(status) || status === undefined) {
//     next();
//   } else {
//     response.status(400);
//     response.send("Invalid Todo Status");
//   }
// };

// const queryPriorityCheck = (request, response, next) => {
//   const { priority } = request.query;
//   const priorityArray = ["HIGH", "MEDIUM", "LOW"];
//   if (priorityArray.includes(priority) || priority === undefined) {
//     next();
//   } else {
//     response.status(400);
//     response.send("Invalid Todo Priority");
//   }
// };

// const queryCategoryCheck = (request, response, next) => {
//   const { category } = request.query;
//   const categoryArray = ["WORK", "HOME", "LEARNING"];
//   if (categoryArray.includes(category) || category === undefined) {
//     next();
//   } else {
//     response.status(400);
//     response.send("Invalid Todo Category");
//   }
// };

// const queryDueDateCheck = (request, response, next) => {
//   let { date } = request.query;
//   if (isValid(new Date(date)) || date === undefined) {
//     next();
//   } else {
//     response.status(400);
//     response.send("Invalid Due Date");
//   }
// };

// const convertDbObjectToResponseObject = (dbObject) => {
//   return {
//     id: dbObject.id,
//     todo: dbObject.todo,
//     priority: dbObject.priority,
//     status: dbObject.status,
//     category: dbObject.category,
//     dueDate: dbObject.due_date,
//   };
// };

// app.get(
//   "/todos/",
//   queryStatusCheck,
//   queryPriorityCheck,
//   queryCategoryCheck,
//   queryDueDateCheck,
//   async (request, response) => {
//     let {
//       status = "",
//       priority = "",
//       category = "",
//       date = "",
//       search_q = "",
//     } = request.query;
//     if (date !== "") {
//       date = format(new Date(date), "yyyy-MM-dd");
//     }
//     const getAllTodoQuery = `
//       SELECT *
//       FROM todo
//       WHERE status LIKE "%${status}%"
//       AND priority LIKE "%${priority}%"
//       AND category LIKE "%${category}%"
//       AND due_date LIKE "%${date}%"
//       AND todo LIKE "%${search_q}%";`;
//     const allTodos = await db.all(getAllTodoQuery);
//     response.send(
//       allTodos.map((eachObject) => convertDbObjectToResponseObject(eachObject))
//     );
//   }
// );

// app.get("/todos/:todoId/", async (request, response) => {
//   const { todoId } = request.params;
//   const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
//   const todo = await db.get(getTodoQuery);
//   response.send(convertDbObjectToResponseObject(todo));
// });

// app.get("/agenda/", queryDueDateCheck, async (request, response) => {
//   let { date } = request.query;
//   if (date !== "") {
//     date = format(new Date(date), "yyyy-MM-dd");
//   }
//   const getTodoQuery = `SELECT * FROM todo WHERE due_date LIKE "%${date}%";`;
//   const todo = await db.all(getTodoQuery);
//   response.send(
//     todo.map((eachObject) => convertDbObjectToResponseObject(eachObject))
//   );
// });

// const postOrUpdateStatusCheck = (request, response, next) => {
//   const { status } = request.body;
//   const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
//   if (statusArray.includes(status) || status === undefined) {
//     next();
//   } else {
//     response.status(400);
//     response.send("Invalid Todo Status");
//   }
// };

// const postOrUpdatePriorityCheck = (request, response, next) => {
//   const { priority } = request.body;
//   const priorityArray = ["HIGH", "MEDIUM", "LOW"];
//   if (priorityArray.includes(priority) || priority === undefined) {
//     next();
//   } else {
//     response.status(400);
//     response.send("Invalid Todo Priority");
//   }
// };

// const postOrUpdateCategoryCheck = (request, response, next) => {
//   const { category } = request.body;
//   const categoryArray = ["WORK", "HOME", "LEARNING"];
//   if (categoryArray.includes(category) || category === undefined) {
//     next();
//   } else {
//     response.status(400);
//     response.send("Invalid Todo Category");
//   }
// };

// const postOrUpdateDueDateCheck = (request, response, next) => {
//   let { dueDate } = request.body;
//   if (isValid(new Date(dueDate)) || dueDate === undefined) {
//     next();
//   } else {
//     response.status(400);
//     response.send("Invalid Due Date");
//   }
// };

// app.post(
//   "/todos/",
//   postOrUpdateStatusCheck,
//   postOrUpdatePriorityCheck,
//   postOrUpdateCategoryCheck,
//   postOrUpdateDueDateCheck,
//   async (request, response) => {
//     let { id, todo, priority, status, category, dueDate } = request.body;
//     if (dueDate !== "") {
//       dueDate = format(new Date(dueDate), "yyyy-MM-dd");
//     }
//     const postTodoQuery = `
//   INSERT INTO
//   todo (id, todo, priority, status, category, due_date)
//   VALUES
//   (${id}, "${todo}", "${priority}", "${status}", "${category}", "${dueDate}");`;
//     await db.run(postTodoQuery);
//     response.send("Todo Successfully Added");
//   }
// );

// app.put(
//   "/todos/:todoId/",
//   postOrUpdateStatusCheck,
//   postOrUpdatePriorityCheck,
//   postOrUpdateCategoryCheck,
//   postOrUpdateDueDateCheck,
//   async (request, response) => {
//     const { todoId } = request.params;
//     const getPreviousTodo = `SELECT * FROM todo WHERE id = ${todoId};`;
//     const previousTodo = await db.get(getPreviousTodo);
//     let element;
//     switch (true) {
//       case request.body.todo !== undefined:
//         element = "Todo";
//         break;
//       case request.body.priority !== undefined:
//         element = "Priority";
//         break;
//       case request.body.status !== undefined:
//         element = "Status";
//         break;
//       case request.body.category !== undefined:
//         element = "Category";
//         break;
//       case request.body.dueDate !== undefined:
//         element = "Due Date";
//         break;
//     }
//     let {
//       todo = previousTodo.todo,
//       priority = previousTodo.priority,
//       status = previousTodo.status,
//       category = previousTodo.category,
//       dueDate = previousTodo.due_date,
//     } = request.body;
//     if (dueDate !== "") {
//       dueDate = format(new Date(dueDate), "yyyy-MM-dd");
//     }
//     const updateTodoQuery = `
//     UPDATE todo
//     SET
//     todo = "${todo}",
//     priority = "${priority}",
//     status = "${status}",
//     category = "${category}",
//     due_date = "${dueDate}"
//     WHERE id = ${todoId};`;
//     await db.run(updateTodoQuery);
//     response.send(`${element} Updated`);
//   }
// );

// app.delete("/todos/:todoId/", async (request, response) => {
//   const { todoId } = request.params;
//   const deleteTodoQuery = `
//     DELETE FROM todo WHERE id = ${todoId};`;
//   await db.run(deleteTodoQuery);
//   response.send("Todo Deleted");
// });

// module.exports = app;
