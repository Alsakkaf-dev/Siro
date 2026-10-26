<?php
// --((The index.php file serves as the entry point for the entire application.))
declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);

// This is the entry point for all HTTP requests. 
//It is the only file that is publicly accessible.
use App\Database\Database;
use App\Middleware\CorsMiddleware;
use App\Routes\Api;
use App\Support\JsonErrorHandler;
use Dotenv\Dotenv; // a tool to read the secrets from .env files and put them into $_ENV
use Slim\Factory\AppFactory;


// --((It first loads the environment configurations and settings))
// Autoload all classes using Composer's autoloader.
require __DIR__ . '/../vendor/autoload.php';

// 1. I load the environment variables from the .env file into $_ENV.
// to know where is the database, the username, the password, etc.
Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();

// 2. I load the application settings from the config/settings.php file.
$settings = require __DIR__ . '/../config/settings.php';


// --((..then establishes a single PDO database connection for the request lifecycle.))
// 3. I connect to the database using the settings from the config/settings.php file.
$db = Database::connect($settings['db']);

// 4. to Build the Slim app.
$app = AppFactory::create();


// --((After that, it passes incoming requests through ))
// --(( a series of middleware components to ensure security—such as the CORS middleware.))
// ----- Check-pointing -----------
// 5. I Add the body parsing middleware to handle JSON, 
// that the Vue app will send in the request body.
$app->addBodyParsingMiddleware();

// 6. I Add the routing middleware to handle route matching 
// to make the system know which URL is being requested
// and which controller should handle it.
$app->addRoutingMiddleware();

// 7. to make the frontend and backend communicate 
// with each other, I add the CORS middleware 
// to handle cross-origin requests.
$app->add(new CorsMiddleware());




// --((It also implements a custom error handler to return clean JSON responses. ))
// 8. Add the error middleware to handle 
// exceptions and errors, if the user put a wrong URL 
// or if the database is down, etc.
$errorMiddleware = $app->addErrorMiddleware(
    (bool) $settings['displayErrorDetails'],
    true,
    true
    );
    $errorMiddleware->setDefaultErrorHandler(
        new JsonErrorHandler($app->getResponseFactory())
        );
        
        
        
// --((Finally, it registers all routes, which directs the request ))
// --((to the appropriate controller to execute the required business logic. ))
// to connect the routes to the controllers, I create a new instance of the Api class,
// passing the database connection and the settings as parameters,
(new Api($db, $settings))($app);

// ready to run the app, and listen for incoming HTTP requests.
$app->run();
