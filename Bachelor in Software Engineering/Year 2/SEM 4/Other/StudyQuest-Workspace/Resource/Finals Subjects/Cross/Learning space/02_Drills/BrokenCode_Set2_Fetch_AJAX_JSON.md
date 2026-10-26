# Broken-Code Set 2 — JSON, AJAX (XHR), Fetch API & jQuery (8 exercises)

> World: the professor's Lab 3 apps — jsonplaceholder users/posts, User Card Directory, WeatherNow dashboard, Live User Search, Country Info App.
> Answers in `BrokenCode_Set2_ANSWERS.md`.

---

## Exercise 2.1 — JSON round-trip

A student record arrives from the server as a string and must go back as a string. Complete the conversions.

```js
const jsonString = '{"name":"Ahmad","age":22,"subjects":["Math","Programming"]}';

const student = ____(1)____(jsonString);
console.log(student.name);                 // Ahmad
console.log(student.subjects[1]);          // Programming

const myObject = { name: "Siti", age: 21 };
const result = ____(2)____(myObject);
console.log(result);                       // {"name":"Siti","age":21}

// pretty-print with 2-space indentation for debugging:
console.log(JSON.stringify(myObject, ____(3)____));
```

Also: the following JSON file refuses to parse — write the corrected line.
```json
{ 'city': 'Johor Bahru', }        ← line (4): rewrite this object as VALID JSON
```

**Must:** parse string→object, stringify object→string, pretty-print, and fix the two JSON syntax crimes.

---

## Exercise 2.2 — Classic AJAX with XMLHttpRequest (GET)

Restore the 5-step XHR pattern that loads user #1 and shows the name.

```js
const xhr = ____(1)____;

xhr.____(2)____("GET", "https://jsonplaceholder.typicode.com/users/1", true);

xhr.onload = function() {
  if (____(3)____) {                       // request succeeded
    const data = ____(4)____(xhr.responseText);
    console.log("Name:", data.name);
  } else {
    console.log("Error! Status:", xhr.status);
  }
};

xhr.onerror = function() { console.log("Network error occurred"); };

xhr.____(5)____;
```

**Must:** create the XHR object, configure an asynchronous GET, check for HTTP success, parse the raw response text, and fire the request.

---

## Exercise 2.3 — XHR POST with JSON body

The dashboard must create a new post. Complete the POST-specific lines.

```js
const xhr = new XMLHttpRequest();
xhr.open("POST", "https://jsonplaceholder.typicode.com/posts", true);

xhr.____(1)____("Content-Type", "application/json");

xhr.onload = function() {
  if (xhr.status === ____(2)____) {        // the "resource created" status
    const response = JSON.parse(xhr.responseText);
    console.log("Post created with ID:", response.id);
  }
};

const newPost = { title: "My First Post", body: "Hello World from AJAX!", userId: 1 };

xhr.send(____(3)____);
```

**Must:** declare the body format header, branch on the created status code, and send the object as a JSON string.

---

## Exercise 2.4 — Fetch with .then chains (the two-step dance)

Explain-by-completing: why are there two `.then()` calls?

```js
fetch("https://jsonplaceholder.typicode.com/users/1")
  .then(function(response) {
    console.log("Response status:", response.status);
    ____(1)____;                           // hand the parsed body to the next .then
  })
  .then(function(data) {
    console.log("User name:", ____(2)____);
  })
  ____(3)____(function(error) {
    console.log("Something went wrong:", error);
  });
```

**Must:** return the body-parsing promise from the first then, read the user's name in the second, and catch failures at the end of the chain.

---

## Exercise 2.5 — Fetch + async/await + ok-check (his recommended style)

The Country Info App's loader must use async/await with proper HTTP error handling.

```js
____(1)____ function getUser(id) {
  try {
    const response = ____(2)____ fetch(`https://jsonplaceholder.typicode.com/users/${id}`);

    if (____(3)____) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const user = await ____(4)____;
    console.log("Name:", user.name);
  } ____(5)____ {
    console.log("Error:", error.message);
  }
}
getUser(1);
```

**Must:** declare the function async, await the network call, detect non-2xx responses (fetch does NOT reject on 404!), await the JSON body, and route all failures into one handler.

---

## Exercise 2.6 — Fetch POST + AbortController timeout (WeatherNow Task 4)

Complete the create-post call and the 10-second timeout cancellation required by the WeatherNow rubric.

```js
async function createPost() {
  const newPost = { title: "Learning Fetch API", body: "Fetch makes AJAX easier!", userId: 1 };

  const controller = ____(1)____;
  const timeoutId = setTimeout(() => ____(2)____, 10000);

  const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
    ____(3)____: "POST",
    headers: { ____(4)____: "application/json" },
    ____(5)____: JSON.stringify(newPost),
    signal: controller.signal
  });
  clearTimeout(timeoutId);

  const data = await response.json();
  console.log("Created post ID:", data.id);
}
```

**Must:** build the abort controller, abort the request after 10 s, set the HTTP method, label the payload format, and attach the JSON body.

---

## Exercise 2.7 — jQuery Live Search (events + DOM methods)

The Live User Search filters preloaded users as you type. Complete the jQuery.

```js
let allUsers = [];

$(____(1)____).ready(function() {
  ____(2)____("https://jsonplaceholder.typicode.com/users", function(users) {
    allUsers = users;
    $("#status").text("Type to search " + users.length + " users");
  });
});

$("#searchBox").____(3)____(function() {
  const query = $(____(4)____).val().toLowerCase().trim();
  const resultsDiv = $("#results");
  resultsDiv.____(5)____();                       // clear previous results

  const matches = allUsers.filter(function(user) {
    return user.name.toLowerCase().includes(query);
  });
  matches.forEach(function(user) {
    resultsDiv.append(`<div class="result"><h3>${user.name}</h3></div>`);
  });
});
```

**Must:** run after the DOM is ready, load all users with jQuery's GET shorthand, react on every keystroke release, read the box's own value, and empty the results container before refilling.

---

## Exercise 2.8 — jQuery $.ajax POST + promise-style chaining (WeatherNow Task 3)

Complete the full-control AJAX call, then the `.done/.fail/.always` chain the rubric demands.

```js
$.ajax({
  url:      "https://jsonplaceholder.typicode.com/posts",
  ____(1)____: "POST",
  dataType: "json",
  contentType: "application/json",
  data: ____(2)____({ title: "jQuery AJAX Post", body: "Created with jQuery!", userId: 1 }),
  ____(3)____: function(response) {
    console.log("Post created! ID:", response.id);
  },
  error: function(xhr, status, error) { console.log("Error:", error); }
});

// WorldTimeAPI with chained handlers:
$.getJSON(url)
  .____(4)____(function(data) { showTime(data.datetime); })
  .fail(function()  { useBrowserTime(); })
  .____(5)____(function() { console.log("Request finished at", Date.now()); });
```

**Must:** set the HTTP method key, serialize the payload, name the success callback key, chain the success handler, and chain the runs-either-way handler.
