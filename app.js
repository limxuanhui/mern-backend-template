/* ----------------------------- MODULE IMPORTS ---------------------------- */
const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
/*
  dotenv.config()
  --- WHAT ---
  dotenv.config() loads KEY=VALUE pairs in .env file into the process.env global object.

  --- NOTE ---
  * If dotenv.config() is not called, the KEY=VALUE pairs in .env file will not be
    accessible from process.env global object. 

  * dotenv.config() has to be before the routes so that the variables in .env file are 
    loaded into the process.env global object before the variables are used in the routes.
    https://github.com/linnovate/meanio/issues/53#:~:text=first%2C%20you%20should,require(%27dotenv%27).config()%3B
*/
dotenv.config();
/* ------------------------------------------------------------------------- */

/* --------------------------------- ROUTES -------------------------------- */
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
/* ------------------------------------------------------------------------- */

const app = express();

/* ----------------------- CONFIGURATION MIDDLEWARES ----------------------- */
/* 
  ------------------------------ express.json() -----------------------------  
  --- WHAT ---
  express.json() middleware parses incoming requests with JSON payloads (POST, PUT methods),
  and a new JavaScript object containing the parsed data is populated on req.body.
  => JSON object in request to JavaScript object in req.body
  http://expressjs.com/en/api.html#:~:text=express.json(%5Boptions%5D)
   
  --- NOTE ---
  * If express.json() middleware is not used, req.body will be 'undefined' when 
    this server receives a request with 'content-type' header as 'application/json'.
    Verify headers by console.log(req.headers).
    
  * This can be proven by turning off express.json() middleware, send a simple
    POST request with JSON body and console.log(req.body). 'undefined' will be printed.
    Turn on express.json(), send the POST request again and console.log(req.body).
    The object containing the data (after parsing) sent by the request is printed.
  ---------------------------------------------------------------------------

  --------------------------- express.urlencoded() --------------------------  
  --- WHAT ---
  express.urlencoded() middleware parses incoming requests with urlencoded payloads,
  typically from forms, and a new JavaScript object containing the parsed data is populated on req.body.  
  http://expressjs.com/en/api.html#:~:text=express.urlencoded(%5Boptions%5D)

  --- NOTE ---
  * URL encoding/percent encoding is an encoding method to encode all user inputs
    into a string, while replacing certain characters with the encoding characters.
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST
    https://stackoverflow.com/questions/4667942/why-should-i-use-urlencode
  
  * { extended: true } option passed into the .urlencoded() function simply allows us to
    choose between parsing the URL-encoded data with the querystring library (when false)
    or the qs library (when true). The “extended” syntax allows for rich objects and arrays
    to be encoded into the URL-encoded format, allowing for a JSON-like experience with URL-encoded.
    For more information, please see the qs library.
    http://expressjs.com/en/api.html#:~:text=Default-,extended,-This%20option%20allows

  * 1) app.use(express.urlencoded({ extended: true }));
    2) app.get("/", (req, res) => {
        res.send(
          "<html><form action='/' method='post'><input type='text' name='username'/><input type='text' name='email'/><button type='submit'>submit</button</form></html>"
        );
      });
    3) app.post("/", (req, res) => {
        console.log(req.body);
        res.send("form submitted");
      });
      
  * In the above code,
      1) middleware for parsing urlencoded payloads
      2) a simple GET request to return a form on "/" path
      3) a POST route to handle the form submission.
    Open the browser (for this example its Chrome) at http://localhost:5000 (or your route),
    run your express server, by first commenting out the middleware, fill up the form and submit. 
    open developer tools with F12, open Network tab, under Headers you will see a Form Data section
    containing your parsed data and encoded data. Notice the encoded form data is all in one string
    with certain characters encoded. Now open your express server terminal and you will see req.body
    printed as 'undefined'. 

    Repeat the above by commenting in the urlencoding middleware, and req.body is now printed as a
    JavaScript object. This is because the middleware will parse the encoded string you see in the browser
    developer tools into an object and populate it at req.body.
  
  * If express.urlencoded() middleware is not used, req.body will be 'undefined'
    when this server receives a request with 'content-type' header as 'application/x-www-form-urlencoded'.
    Verify headers by console.log(req.headers).

  * This can be proven by turning off express.urlencoded() middleware, send a simple
    POST request with URL encoded data (setting 'content-type' header to 'application/x-www-form-urlencoded)
    and console.log(req.body). 'undefined' will be printed. Turn on express.urlencoded(),
    send the POST request again and console.log(req.body). The object containing
    the data (after parsing) sent by the request is printed.
  ---------------------------------------------------------------------------

  ------------------------------ compression() ------------------------------  
  --- WHAT ---
  compression() middleware will attempt to compress response bodies for all 
  requests that traverse through the middleware, based on the given options. 
  https://github.com/expressjs/compression
  
  --- NOTE ---
  * This middleware will make your JSON response and other static files responses smaller.
    https://www.digitalocean.com/community/tutorials/nodejs-compression
    https://medium.com/@victor.valencia.rico/gzip-compression-with-node-js-cc3ed74196f9

  * Content-Length response header, which represents size of response (in bytes), 
    may not be present when this middleware is used. 'Transfer-Encoding: chunked'
    may be present instead.
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Length
    https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#:~:text=closing%20the%20connection.-,3,-.If%20a%20Content

  * This middleware will never compress responses that include a Cache-Control header 
    with the no-transform directive, as compressing will transform the body.
  ---------------------------------------------------------------------------  

  ----------------------------- cookieParser() ------------------------------
  --- WHAT ---
  cookieParser() middleware will parse Cookie header and populate req.cookies
  with an object keyed by the cookie names. Optional parameters secret and options
  may be given.
  https://github.com/expressjs/cookie-parser#readme
  https://www.tutorialspoint.com/expressjs/expressjs_cookies.htm

  --- NOTE ---
  * A cookie is a NAME=VALUE pair data (possibly with some other attributes) that
    enable web servers to store stateful information (such as items added in the
    shopping cart in an online store) on the user’s device or to track the user's
    browsing activity (including clicking particular buttons, logging in, or 
    recording which pages were visited in the past). 
    
  * Cookies are sent by a web server as part of a response back the the client's
    web browser, and stored by this browser on the user's computer. A web browser
    also typically sends cookies back to the server on every user's request.
    https://en.wikipedia.org/wiki/HTTP_cookie
    https://www.section.io/engineering-education/what-are-cookies-nodejs/

  * If cookieParser() middleware is not used, req.cookies will be undefined.
    This is because in req.headers, we will have a key 'cookie' that has a 
    string value containing the NAME=VALUE pairs for each cookie. cookieParser()
    will parse this string of NAME=VALUE pairs into an object and set req.cookies
    to this object. 

  * A self-proof can be done by:
    1) Setting a cookie by res.cookie("name", "value") without cookieParser().
       Send a simple GET request for the first time so the cookie is set. Then send
       the GET request again with console.log(req) and you will find req.headers
       contain 'cookie' field with the string "name=value", but req.cookies
       is not present (just console.log(req.cookies) to see 'undefined' printed). 

    2) Turn on cookieParser() middleware and send the GET request with
       console.log(req) and you will see 'cookies' key with its value set to an object
       containing the NAME=VALUE pair for each cookie.  

  * On MacOS, choose "Go to Folder" in Finder’s Go tab, enter:
    '~/Library/Application Support/Google/Chrome/Default'
    as path to find the 'Cookies' SQLite database for Google Chrome.
    https://discussions.apple.com/thread/250445598
  ---------------------------------------------------------------------------
  
  --------------------------------- cors() ----------------------------------  
  --- WHAT ---
  cors() middleware will enable Cross-Origin Resource Sharing, which means
  access of resources from another server, by setting the relevant headers on
  the response. The default configuration (by calling cors()) is equivalent to:
  {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
  }
  https://github.com/expressjs/cors#readme
  
  --- NOTE ---
  * CORS, or Cross-Origin Resource Sharing, is a security mechanism by the 
    browser to ensure that only responses that include the right CORS headers
    can be accessed by the client. The server has to indicate which other servers
    can receive its responses via its API.
    https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

  * If cors() middleware is not used, the frontend application on a different
    server will not be able to access resources from this backend server via
    the API.
    https://www.section.io/engineering-education/how-to-use-cors-in-nodejs-with-express/
  ---------------------------------------------------------------------------

  -------------------------------- helmet() ---------------------------------  

  --- WHAT ---
  helmet() middleware helps to secure the Express app by setting various HTTP headers. 
  https://helmetjs.github.io/

  --- NOTE ---
  * The helmet() function is a wrapper around 15 smaller middleware functions,
    11 of which are enabled by default. The default ones are:
    - helmet.contentSecurityPolicy()
    - helmet.dnsPrefetchControl()
    - helmet.expectCt()
    - helmet.frameguard()
    - helmet.hidePoweredBy()
    - helmet.hsts()
    - helmet.ieNoOpen()
    - helmet.noSniff()
    - helmet.permittedCrossDomainPolicies()
    - helmet.referrerPolicy()
    - helmet.xssFilter()
    --------------------------------
    The explicitly-enabled ones are: 
    - helmet.crossOriginEmbedderPolicy() 
    - helmet.crossOriginOpenerPolicy()
    - helmet.crossOriginResourcePolicy()
    - helmet.originAgentCluster()
    These will be be default by next major Helmet version.
    Check out the link above on what each of the middlewares do.

  * If helmet() middleware is not used, we have to write and set these 
    middlewares manually.
  ---------------------------------------------------------------------------
*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());
app.use(cors());
app.use(helmet());
/* ----------------------------------------------------------------------- */

/* ------------------------------ ENDPOINTS ------------------------------ */
app.use("/", (req, res) => {
  res.send("Home page");
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use((err, req, res, next) => {
  /* express-jwt throws "UnauthorizedError" when a token cannot be validated for some reason. */
  if (err.name === "UnauthorizedError") {
    res.status(401).json({ error: `${err.name}: ${err.message}` });
  } else if (err) {
    console.log(err);
    res.status(400).json({ error: `${err.name}: ${err.message}` });
  }
});
/* ----------------------------------------------------------------------- */

// Uncomment to connect to MongoDB, Update MONGODB_URL in .env file
mongoose.connect(process.env.MONGODB_URL, (err) => {
  if (err) return console.log(err);
  console.log("Connected to MongoDB");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
  if (err) return console.log(err);
  console.log(`Server is listening on port ${PORT}`);
});
